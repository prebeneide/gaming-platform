import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  try {
    // Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch match with participants
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { participants: true }
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if match is in countdown status
    if (match.status !== "countdown") {
      return NextResponse.json({ error: "Match is not in countdown status" }, { status: 400 });
    }

    // Transaction: refund all participants, update match status
    const updated = await prisma.$transaction(async (tx) => {
      // Refund all participants
      const refundPromises = match.participants.map(async (participant) => {
        // Refund wallet
        await tx.userWallet.update({
          where: { userId: participant.userId },
          data: { balance: { increment: match.buyIn } },
        });

        // Create refund transaction
        await tx.transaction.create({
          data: {
            userId: participant.userId,
            type: 'match_refund',
            amount: match.buyIn,
            status: 'completed',
            description: `Refund for match timeout`,
          },
        });
      });

      await Promise.all(refundPromises);

      // Update match status to cancelled
      const updatedMatch = await tx.match.update({
        where: { id: match.id },
        data: { 
          status: 'cancelled',
          completedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          gameName: true,
          gameMode: true,
          competitionType: true,
          competitionFormat: true,
          matchType: true,
          platform: true,
          buyIn: true,
          totalPot: true,
          potentialWinnings: true,
          visibility: true,
          status: true,
          maxPlayers: true,
          currentPlayers: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
          scheduledAt: true,
          completedAt: true,
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              image: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return { updatedMatch };
    });

    return NextResponse.json({ 
      match: updated.updatedMatch,
      message: "Match cancelled due to timeout. All participants have been refunded.",
      warning: "Please ensure all players are ready before creating matches to avoid timeouts."
    });
  } catch (error) {
    console.error("Match timeout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 