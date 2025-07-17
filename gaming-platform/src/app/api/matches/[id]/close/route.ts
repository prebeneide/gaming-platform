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

    // Check if user is the creator
    if (match.creatorId !== user.id) {
      return NextResponse.json({ error: "Only the match creator can close the match" }, { status: 403 });
    }

    // Check if match has already started or been cancelled
    if (match.status === "in_progress" || match.status === "completed" || match.status === "cancelled") {
      return NextResponse.json({ error: "Cannot close a match that has already started, completed, or been cancelled" }, { status: 400 });
    }

    // Transaction: refund all participants, update match status
    const updated = await prisma.$transaction(async (tx) => {
      // Refund all participants (including creator)
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
            description: `Refund for cancelled match`,
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
      message: "Match cancelled successfully. All participants have been refunded."
    });
  } catch (error) {
    console.error("Close match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 