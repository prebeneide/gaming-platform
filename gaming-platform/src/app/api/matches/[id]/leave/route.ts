import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Fetch match
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { participants: true }
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if user is a participant
    const participant = match.participants.find(p => p.userId === user.id);
    if (!participant) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 400 });
    }

    // Check if match has already started
    if (match.status === "in_progress" || match.status === "completed" || match.status === "cancelled") {
      return NextResponse.json({ error: "Cannot leave a match that has already started, completed, or been cancelled" }, { status: 400 });
    }

    // Check if user is the creator (creator cannot leave, must close match instead)
    if (match.creatorId === user.id) {
      return NextResponse.json({ error: "Creator cannot leave match. Use close match instead." }, { status: 400 });
    }

    // Transaction: refund wallet, remove participant, decrement currentPlayers, create refund transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Refund the buy-in
      const updatedWallet = await tx.userWallet.update({
        where: { userId: user.id },
        data: { balance: { increment: match.buyIn } },
      });

      // Create refund transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'match_refund',
          amount: match.buyIn,
          status: 'completed',
          description: `Refund for leaving match`,
        },
      });

      // Remove participant and update match
      const updatedMatch = await tx.match.update({
        where: { id: match.id },
        data: {
          currentPlayers: { decrement: 1 },
          // If match was 'ready' and now has fewer players, change back to 'open'
          status: match.status === 'ready' && match.currentPlayers - 1 < match.maxPlayers ? 'open' : match.status,
          participants: {
            delete: {
              id: participant.id,
            },
          },
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

      return { updatedMatch, updatedWallet };
    });

    return NextResponse.json({ 
      match: updated.updatedMatch, 
      newBalance: updated.updatedWallet.balance,
      message: "Successfully left the match"
    });
  } catch (error) {
    console.error("Leave match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 