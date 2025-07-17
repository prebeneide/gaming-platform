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

    // Check if user is a participant
    const participant = match.participants.find(p => p.userId === user.id);
    if (!participant) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 400 });
    }

    // Check if match is in countdown status
    if (match.status !== 'countdown') {
      return NextResponse.json({ error: "Match is not in countdown status" }, { status: 400 });
    }

    // Check if user is already ready
    if (participant.status === 'ready') {
      return NextResponse.json({ error: "You are already ready" }, { status: 400 });
    }

    // Update participant status to ready
    const updatedParticipant = await prisma.matchParticipant.update({
      where: { id: participant.id },
      data: { status: 'ready' },
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
    });

    // Check if all participants are ready
    const allParticipants = await prisma.matchParticipant.findMany({
      where: { matchId: match.id }
    });

    const allReady = allParticipants.every(p => p.status === 'ready');
    
    // If all ready, start the match
    if (allReady) {
      const updatedMatch = await prisma.match.update({
        where: { id: match.id },
        data: { 
          status: 'in_progress',
          startedAt: new Date()
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
          startedAt: true,
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

      return NextResponse.json({ 
        participant: updatedParticipant,
        match: updatedMatch,
        allReady,
        message: 'Match is starting!'
      });
    }

    // Return updated match data
    const updatedMatch = await prisma.match.findUnique({
      where: { id: match.id },
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

    return NextResponse.json({ 
      participant: updatedParticipant,
      match: updatedMatch,
      allReady,
      message: 'You are ready!'
    });
  } catch (error) {
    console.error("Ready up error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 