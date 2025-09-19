import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// GET /api/users/[username]/recent-matches - Get recent matches for a user
export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const username = params.username;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Get user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent matches where user is a participant
    const recentMatches = await prisma.match.findMany({
      where: {
        participants: {
          some: {
            userId: user.id
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
      take: 10
    });

    // Transform matches to include opponent info and result
    const transformedMatches = recentMatches.map(match => {
      const userParticipant = match.participants.find(p => p.user.id === user.id);
      const opponentParticipant = match.participants.find(p => p.user.id !== user.id);
      
      // Determine result for the user
      let result = "Draw";
      if (match.result?.winnerId === user.id) {
        result = "Win";
      } else if (match.result?.winnerId && match.result.winnerId !== user.id) {
        result = "Loss";
      }

      return {
        id: match.id,
        game: match.gameName,
        result,
        platform: match.platform,
        buyIn: match.buyIn,
        prize: match.result?.winnerId === user.id ? match.buyIn * 1.8 : 0, // Winner gets 1.8x buy-in
        type: match.competitionFormat,
        createdAt: match.createdAt,
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
    console.error("Get recent matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
