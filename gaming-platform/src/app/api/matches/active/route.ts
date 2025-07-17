import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Find the first match where the user is a participant (including creator) and status is active
  const activeParticipant = await prisma.matchParticipant.findFirst({
    where: {
      userId: user.id,
      match: {
        status: { in: ["open", "countdown", "in_progress"] },
      },
    },
    include: { match: true },
  });
  if (activeParticipant && activeParticipant.match) {
    return NextResponse.json({
      activeMatch: {
        id: activeParticipant.match.id,
        name: activeParticipant.match.name,
        status: activeParticipant.match.status,
        gameName: activeParticipant.match.gameName,
        competitionType: activeParticipant.match.competitionType,
        competitionFormat: activeParticipant.match.competitionFormat,
        platform: activeParticipant.match.platform,
        buyIn: activeParticipant.match.buyIn,
        maxPlayers: activeParticipant.match.maxPlayers,
        currentPlayers: activeParticipant.match.currentPlayers,
        creatorId: activeParticipant.match.creatorId,
      },
    });
  }
  return NextResponse.json({ error: "Match not found" }, { status: 404 });
} 