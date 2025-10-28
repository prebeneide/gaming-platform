import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { createMatchInviteNotification } from "@/lib/notifications";
import { getMatches } from "@/lib/matchService";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";

const prisma = new PrismaClient();

// POST /api/matches - Create a new match
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2.5. Fetch user's wallet and check balance
    const wallet = await prisma.userWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
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
        error: `You are already a participant in another active match (\"${activeParticipant.match.name}\"). Leave that match before creating a new one.`,
        activeMatchId: activeParticipant.match.id,
      }, { status: 409 });
    }

    // 3. Parse request body
    const body = await request.json();
    const {
      name,
      gameName,
      gameMode,
      competitionType,
      competitionFormat,
      matchType,
      platform,
      buyIn,
      visibility,
      mediaUrl,
      mediaType,
      invitedUsers = []
    } = body;

    // 4. Validate required fields
    if (!name || !gameName || !gameMode || !competitionType || !competitionFormat || !platform || !buyIn) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // 4.5. Check if user has enough balance for buy-in
    if (wallet.balance < buyIn) {
      return NextResponse.json({ error: "Insufficient wallet balance for buy-in." }, { status: 402 });
    }

    // 5. Calculate match details
    let maxPlayers = 2; // Default for 1v1
    if (competitionFormat === '1v1v1') maxPlayers = 3;
    else if (competitionFormat === '1v1v1v1') maxPlayers = 4;

    const totalPot = maxPlayers * buyIn;
    const platformFee = totalPot * 0.10; // 10% platform fee
    const potentialWinnings = totalPot - platformFee;

    // 6. Get invited user IDs first
    const invitedUserIds: string[] = [];
    if (invitedUsers.length > 0) {
      for (const username of invitedUsers) {
        const invitedUser = await prisma.user.findUnique({
          where: { username },
          select: { id: true }
        });
        if (invitedUser) {
          invitedUserIds.push(invitedUser.id);
        }
      }
    }

    // 7. Create the match in database (with wallet integration)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement wallet
      const updatedWallet = await tx.userWallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: buyIn,
          },
        },
      });

      // 2. Create match_payment transaction
      const matchPaymentTx = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'match_payment',
          amount: buyIn,
          status: 'completed',
          description: `Buy-in for match`,
        },
      });

      // 3. Create the match and mark creator as paid
      const match = await tx.match.create({
        data: {
          name,
          gameName,
          gameMode,
          competitionType,
          competitionFormat,
          matchType,
          platform,
          buyIn,
          totalPot,
          potentialWinnings,
          visibility,
          maxPlayers,
          currentPlayers: 1,
          mediaUrl,
          mediaType,
          creatorId: user.id,
          participants: {
            create: {
              userId: user.id,
              status: 'joined',
              buyInPaid: true,
              buyInTransactionId: matchPaymentTx.id,
            },
          },
        },
        include: {
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

      return { match, updatedWallet };
    });

    // Log match creation
    await logActivity({
      userId: user.id,
      action: ActivityTypes.MATCH_CREATED,
      entityType: 'Match',
      entityId: result.match.id,
      details: {
        matchName: result.match.name,
        gameName: result.match.gameName,
        buyIn: result.match.buyIn,
        maxPlayers: result.match.maxPlayers
      }
    });

    // Log buy-in transaction
    await logActivity({
      userId: user.id,
      action: ActivityTypes.BUY_IN_PAID,
      entityType: 'Transaction',
      details: {
        amount: buyIn,
        matchId: result.match.id
      }
    });

    // Create invitations for invited users
    if (invitedUserIds.length > 0) {
      try {
        await (prisma as any).matchInvitation.createMany({
          data: invitedUserIds.map(userId => ({
            matchId: result.match.id,
            userId: userId,
            status: 'pending'
          }))
        });
        console.log('Invitations created successfully');
      } catch (invitationError) {
        console.error('Error creating invitations:', invitationError);
        // Don't fail the entire match creation if invitations fail
      }
    }

    // Opprett notifications for invited users
    if (invitedUsers.length > 0) {
      try {
        const inviterName = (user as any)?.displayName || user.username;
        
        for (const invitedUsername of invitedUsers) {
          const invitedUser = await prisma.user.findUnique({
            where: { username: invitedUsername },
          });
          
          if (invitedUser) {
            await createMatchInviteNotification(
              invitedUser.id,
              result.match.name,
              inviterName,
              result.match.id
            );
          }
        }
      } catch (notificationError) {
        console.error("Error creating match invite notifications:", notificationError);
        // Ikke krasj hvis notification-feiler
      }
    }

    return NextResponse.json({
      success: true,
      match: result.match,
      newBalance: result.updatedWallet.balance,
    });

  } catch (error) {
    console.error("Create match error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/matches - List all matches with full info
export async function GET() {
  try {
    // Get user ID if authenticated
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || undefined;
    
    const matches = await getMatches({}, userId);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 