import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/matches/[id] - Get a single match by id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
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
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json({ match });
  } catch (error) {
    console.error("Get match by id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 