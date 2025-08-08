import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from 'cloudinary';
import { updateStatsForMatchParticipants } from "@/lib/userStats";
import { createMatchResultNotification } from "@/lib/notifications";

const prisma = new PrismaClient();

// Konfigurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/matches/[id]/report-result - Rapporter resultat med bevis
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  try {
    // 1. Autentiser bruker
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Hent bruker fra database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log('Reporting user:', user.id, user.email);

    // 3. Hent match og sjekk at brukeren er deltaker
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        participants: true,
      },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    // Logg alle deltagere før oppdatering
    console.log('Participants BEFORE update:', match.participants.map(p => ({
      userId: p.userId,
      status: p.status,
      hasReportedResult: p.hasReportedResult,
      reportedResult: p.reportedResult,
      reportedWinnerId: p.reportedWinnerId,
    })));

    // Sjekk at brukeren er deltaker
    const participant = match.participants.find(p => p.userId === user.id);
    if (!participant) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 });
    }

    // Sjekk at matchen er ferdig eller in_progress
    if (match.status !== 'completed' && match.status !== 'in_progress') {
      return NextResponse.json({ error: "Match is not in progress or completed yet" }, { status: 400 });
    }

    // 4. Parse request body (FormData for bildeopplasting)
    const formData = await request.formData();
    const resultType = formData.get('resultType') as string; // 'win', 'draw', 'problem'
    const winnerIdRaw = formData.get('winnerId');
    const winnerId = typeof winnerIdRaw === 'string' ? winnerIdRaw : undefined;
    const proofFile = formData.get('proofFile') as File | null;

    // 5. Valider input
    if (!resultType || !['win', 'draw', 'problem'].includes(resultType)) {
      return NextResponse.json({ error: "Invalid result type" }, { status: 400 });
    }

    if (resultType === 'win' && !winnerId) {
      return NextResponse.json({ error: "Winner ID required for win result" }, { status: 400 });
    }

    if (!proofFile) {
      return NextResponse.json({ error: "Proof image is required" }, { status: 400 });
    }

    // 6. Last opp bilde til Cloudinary
    let proofImageUrl: string | null = null;
    
    try {
      // Konverter File til buffer
      const bytes = await proofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Last opp til Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `match-proofs/${match.id}`,
            public_id: `${user.id}-${Date.now()}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      proofImageUrl = (uploadResult as any).secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return NextResponse.json({ error: "Failed to upload proof image" }, { status: 500 });
    }

    // 7. Oppdater participant med resultat og bevis
    const updatedParticipant = await prisma.matchParticipant.update({
      where: {
        matchId_userId: {
          matchId: match.id,
          userId: user.id,
        },
      },
      data: {
        hasReportedResult: true,
        reportedWinnerId: winnerId,
        reportedResult: resultType,
        proofImageUrl: proofImageUrl,
        proofUploadedAt: new Date(),
      },
    });

    // Hent OPPDATERT match med alle deltagere etter oppdatering
    const matchForConsensus = await prisma.match.findUnique({
      where: { id: match.id },
      include: { participants: true },
    });

    // 8. Sjekk om alle har rapportert og oppdater match resultat
    const allParticipants = matchForConsensus?.participants || [];
    const reportedParticipants = allParticipants.filter(p => p.hasReportedResult);

    // LOGGING: Vis hvem som har rapportert og hva de har rapportert
    console.log('--- Reported Participants ---');
    reportedParticipants.forEach(p => {
      console.log({
        userId: p.userId,
        reportedResult: p.reportedResult,
        reportedWinnerId: p.reportedWinnerId,
      });
    });
    console.log(`Total reported: ${reportedParticipants.length} / ${allParticipants.length}`);

    if (reportedParticipants.length === allParticipants.length) {
      // Alle har rapportert - sjekk for konsensus
      const results = reportedParticipants.map(p => ({
        resultType: typeof p.reportedResult === 'string' ? p.reportedResult : '',
        winnerId: typeof p.reportedWinnerId === 'string' ? p.reportedWinnerId : undefined,
        userId: p.userId,
      }));

      // Sjekk om alle er enige
      const firstResult = results[0];
      const allAgree = results.every(r => 
        r.resultType === firstResult.resultType && 
        r.winnerId === firstResult.winnerId
      );
      console.log('Consensus check:', { allAgree, firstResult, results });

      if (allAgree) {
        // Alle er enige - opprett match resultat og utbetal
        let matchResult;
        try {
          matchResult = await prisma.matchResult.create({
            data: {
              matchId: match.id,
              winnerId: firstResult.winnerId,
              resultType: firstResult.resultType,
              status: 'agreed',
              agreedBy: reportedParticipants.map(p => p.userId),
              disputedBy: [],
            },
          });
        } catch (err) {
          // Hvis det allerede finnes et matchResult, hent det og returner en tydelig feilmelding
          const error = err as any;
          if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint'))) {
            const existingResult = await prisma.matchResult.findUnique({ where: { matchId: match.id } });
            return NextResponse.json({
              error: "Result has already been registered for this match.",
              existingResult,
            }, { status: 409 });
          } else {
            console.error('Error creating matchResult:', error);
            return NextResponse.json({ error: "Failed to create match result" }, { status: 500 });
          }
        }
        // Sett match til completed
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'completed', completedAt: new Date() },
        });
        console.log('Match set to COMPLETED');

        // Oppdater statistikk for alle deltakere
        await updateStatsForMatchParticipants(match.id);
        console.log('User statistics updated for all participants');

        // --- UTBETALING TIL VINNER ---
        if (firstResult.resultType === 'win' && firstResult.winnerId) {
          // Finn potten som skal utbetales
          const payoutAmount = match.potentialWinnings;
          // Oppdater vinnerens wallet
          await prisma.userWallet.update({
            where: { userId: firstResult.winnerId },
            data: { balance: { increment: payoutAmount } },
          });
          // Opprett payout-transaction
          await prisma.transaction.create({
            data: {
              userId: firstResult.winnerId,
              type: 'match_payout',
              amount: payoutAmount,
              status: 'completed',
              description: `Payout for winning match ${match.id}`,
            },
          });
          console.log(`Payout of $${payoutAmount} sent to winner ${firstResult.winnerId}`);

          // Opprett notification for vinneren
          try {
            await createMatchResultNotification(
              firstResult.winnerId,
              match.name,
              'win',
              payoutAmount
            );
          } catch (notificationError) {
            console.error("Error creating win notification:", notificationError);
          }

          // Opprett notification for taperne
          const losers = match.participants.filter(p => p.userId !== firstResult.winnerId);
          for (const loser of losers) {
            try {
              await createMatchResultNotification(
                loser.userId,
                match.name,
                'loss'
              );
            } catch (notificationError) {
              console.error("Error creating loss notification:", notificationError);
            }
          }
        }
        // --- UAVGJORT: Del potten (valgfritt, her får alle buy-in tilbake) ---
        if (firstResult.resultType === 'draw') {
          const refundAmount = match.buyIn;
          for (const p of reportedParticipants) {
            await prisma.userWallet.update({
              where: { userId: p.userId },
              data: { balance: { increment: refundAmount } },
            });
            await prisma.transaction.create({
              data: {
                userId: p.userId,
                type: 'match_draw_refund',
                amount: refundAmount,
                status: 'completed',
                description: `Refund for draw in match ${match.id}`,
              },
            });

            // Opprett notification for uavgjort
            try {
              await createMatchResultNotification(
                p.userId,
                match.name,
                'draw'
              );
            } catch (notificationError) {
              console.error("Error creating draw notification:", notificationError);
            }
          }
          console.log('Draw: All participants refunded their buy-in');
        }
      } else {
        // Uenighet - opprett dispute
        await prisma.matchResult.create({
          data: {
            matchId: match.id,
            winnerId: null,
            resultType: 'dispute',
            status: 'disputed',
            agreedBy: [],
            disputedBy: reportedParticipants.map(p => p.userId),
          },
        });
        // Sett match til dispute
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'dispute' },
        });
        console.log('Match set to DISPUTE');
      }
    }

    return NextResponse.json({
      success: true,
      message: "Result reported successfully",
      participant: updatedParticipant,
    });

  } catch (error) {
    console.error("Report result error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 