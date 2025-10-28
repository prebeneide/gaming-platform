import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/matches/[id]/chat - Get chat messages for a specific match
export async function GET(request: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get last 50 messages for this match
    const messages = await (prisma as any).matchMessage.findMany({
      where: { matchId: id },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    // Reverse to get chronological order
    messages.reverse();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Match chat GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

