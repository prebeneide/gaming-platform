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
    if (match.status !== "open") {
      return NextResponse.json({ error: "Match is not open for joining." }, { status: 400 });
    }
    if (match.currentPlayers >= match.maxPlayers) {
      return NextResponse.json({ error: "Match is full." }, { status: 400 });
    }
    if (match.participants.some(p => p.userId === user.id)) {
      return NextResponse.json({ error: "You have already joined this match." }, { status: 400 });
    }
    // Wallet
    const wallet = await prisma.userWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }
    if (wallet.balance < match.buyIn) {
      return NextResponse.json({ error: "Insufficient wallet balance for buy-in." }, { status: 402 });
    }
    // Transaction: decrement wallet, add participant, increment currentPlayers, create transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.userWallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: match.buyIn } },
      });
      const joinTx = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'match_payment',
          amount: match.buyIn,
          status: 'completed',
          description: `Buy-in for match`,
        },
      });
      const updatedMatch = await tx.match.update({
        where: { id: match.id },
        data: {
          currentPlayers: { increment: 1 },
          participants: {
            create: {
              userId: user.id,
              status: 'joined',
              buyInPaid: true,
              buyInTransactionId: joinTx.id,
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
    return NextResponse.json({ match: updated.updatedMatch, newBalance: updated.updatedWallet.balance });
  } catch (error) {
    console.error("Join match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 