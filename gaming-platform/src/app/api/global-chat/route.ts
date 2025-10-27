import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/global-chat - Get recent global chat messages
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get last 50 messages
    const messages = await (prisma as any).globalMessage.findMany({
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
    console.error("Global chat GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/global-chat - Send a global chat message (not needed, using socket)
export async function POST(request: NextRequest) {
  // This is handled by socket.io
  return NextResponse.json({ message: "Use socket.io for real-time messaging" });
}

