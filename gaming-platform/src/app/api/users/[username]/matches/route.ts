import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all matches where the user is either creator or participant
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          {
            participants: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true
          }
        },
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
        result: {
          select: {
            id: true,
            winnerId: true,
            resultType: true,
            status: true,
            payoutAmount: true,
            createdAt: true,
            completedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const transformedMatches = matches.map(match => ({
      id: match.id,
      name: match.name,
      gameName: match.gameName,
      gameMode: match.gameMode,
      competitionType: match.competitionType,
      competitionFormat: match.competitionFormat,
      matchType: match.matchType,
      platform: match.platform,
      buyIn: match.buyIn,
      totalPot: match.totalPot,
      potentialWinnings: match.potentialWinnings,
      visibility: match.visibility,
      status: match.status,
      maxPlayers: match.maxPlayers,
      currentPlayers: match.participants.length,
      mediaUrl: match.mediaUrl,
      mediaType: match.mediaType,
      createdAt: match.createdAt.toISOString(),
      creator: match.creator,
      participants: match.participants.map(p => ({
        id: p.id,
        status: p.status,
        buyInPaid: p.buyInPaid,
        hasReportedResult: p.hasReportedResult,
        reportedWinnerId: p.reportedWinnerId,
        reportedResult: p.reportedResult,
        proofImageUrl: p.proofImageUrl,
        proofUploadedAt: p.proofUploadedAt?.toISOString(),
        user: p.user
      })),
      result: match.result
    }));

    return NextResponse.json({ matches: transformedMatches });
  } catch (error) {
    console.error("Error fetching user matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
} 