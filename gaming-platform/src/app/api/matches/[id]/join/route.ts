import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
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
    // Sjekk om brukeren allerede er deltaker i en annen aktiv match
    const activeParticipant = await prisma.matchParticipant.findFirst({
      where: {
        userId: user.id,
        match: {
          status: { in: ["open", "countdown", "in_progress"] },
        },
      },
      include: { match: true },
    });
    if (activeParticipant) {
      return NextResponse.json({
        error: `You are already a participant in another active match ("${activeParticipant.match.name}"). Leave that match before joining a new one.`,
        activeMatchId: activeParticipant.match.id,
      }, { status: 409 });
    }
    // Fetch match
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { 
        participants: true,
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
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

    // Check visibility and invitation requirements
    if (match.visibility === "invite_only") {
      // For invite-only matches, only invited users can join
      // Check if this user was specifically invited
      let invitation = null;
      try {
        invitation = await (prisma as any).matchInvitation.findFirst({
          where: {
            matchId: params.id,
            userId: user.id,
            status: "pending"
          }
        });
      } catch (invitationError) {
        console.error('Error checking invitation:', invitationError);
        // If invitation check fails, treat as not invited
        invitation = null;
      }
      
      if (!invitation) {
        return NextResponse.json({ 
          error: "🔒 Private Match - This is an exclusive invitation-only match. Only invited players can join this game." 
        }, { status: 403 });
      }
    } else if (match.visibility === "friends") {
      // For friends-only matches, check if user is friends with creator
      const friendship = await prisma.friendRequest.findFirst({
        where: {
          status: "accepted",
          OR: [
            { fromId: match.creator.id, toId: user.id },
            { fromId: user.id, toId: match.creator.id }
          ]
        }
      });
      
      if (!friendship) {
        return NextResponse.json({ 
          error: "👥 Friends Only - This match is exclusively for the creator's friends. Send a friend request to join!" 
        }, { status: 403 });
      }
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
          status: match.currentPlayers + 1 >= match.maxPlayers ? 'countdown' : 'open',
          scheduledAt: match.currentPlayers + 1 >= match.maxPlayers ? new Date() : null,
          participants: {
            create: {
              userId: user.id,
              status: 'joined',
              buyInPaid: true,
              buyInTransactionId: joinTx.id,
            },
          },
          // Update invitation status to accepted if this is an invite-only match
          ...(match.visibility === "invite_only" && {
            invitations: {
              updateMany: {
                where: {
                  userId: user.id,
                  status: "pending"
                },
                data: {
                  status: "accepted"
                }
              }
            }
          })
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
    // Add special message for invited users
    let successMessage = "Successfully joined the match!";
    if (match.visibility === "invite_only") {
      successMessage = "🎉 Welcome to your exclusive invitation match! You've been specially selected to join this private game.";
    } else if (match.visibility === "friends") {
      successMessage = "👥 Joined the friends-only match! Good luck playing with your friends!";
    }
    
    return NextResponse.json({ 
      match: updated.updatedMatch, 
      newBalance: updated.updatedWallet.balance,
      message: successMessage
    });
  } catch (error) {
    console.error("Join match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 