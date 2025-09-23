import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's friends
    const friendships = await prisma.friendRequest.findMany({
      where: { 
        status: "accepted", 
        OR: [{ fromId: session.user.id }, { toId: session.user.id }] 
      },
      select: {
        from: { 
          select: { 
            id: true, 
            username: true, 
            displayName: true, 
            image: true 
          } 
        },
        to: { 
          select: { 
            id: true, 
            username: true, 
            displayName: true, 
            image: true 
          } 
        },
      },
    });

    // Get friend IDs
    const friendIds = friendships.map((fr) => 
      fr.from.id === session.user.id ? fr.to.id : fr.from.id
    );

    if (friendIds.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Get recent matches from friends
    const friendsRecentMatches = await prisma.match.findMany({
      where: {
        participants: {
          some: {
            userId: {
              in: friendIds
            }
          }
        },
        status: {
          in: ["completed", "cancelled"]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                image: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true
          }
        },
        result: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6 // Get 6 recent matches from friends
    });

    // Transform the data
    const transformedMatches = friendsRecentMatches.map(match => {
      // Find the friend who participated in this match
      const friendParticipant = match.participants.find(p => 
        friendIds.includes(p.user.id)
      );
      
      // Find the opponent (not the friend)
      const opponentParticipant = match.participants.find(p => 
        p.user.id !== friendParticipant?.user.id
      );

      // Determine result for the friend
      let result = "Draw";
      if (match.result?.winnerId === friendParticipant?.user.id) {
        result = "Win";
      } else if (match.result?.winnerId && match.result.winnerId !== friendParticipant?.user.id) {
        result = "Loss";
      }

      return {
        id: match.id,
        game: match.gameName,
        result,
        platform: match.platform,
        buyIn: match.buyIn,
        prize: match.result?.winnerId === friendParticipant?.user.id ? match.buyIn * 1.8 : 0,
        type: match.competitionFormat,
        createdAt: match.createdAt,
        friend: friendParticipant ? {
          username: friendParticipant.user.username,
          displayName: friendParticipant.user.displayName,
          image: friendParticipant.user.image
        } : {
          username: match.creator.username,
          displayName: match.creator.displayName,
          image: match.creator.image
        },
        opponent: opponentParticipant ? {
          username: opponentParticipant.user.username,
          displayName: opponentParticipant.user.displayName,
          image: opponentParticipant.user.image
        } : {
          username: match.creator.username,
          displayName: match.creator.displayName,
          image: match.creator.image
        }
      };
    });

    return NextResponse.json({ matches: transformedMatches });

  } catch (error) {
    console.error("Error fetching friends recent matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends recent matches" },
      { status: 500 }
    );
  }
}
