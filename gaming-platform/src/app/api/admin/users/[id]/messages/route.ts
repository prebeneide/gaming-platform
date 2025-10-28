import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    // Get all messages - private messages, global messages, and match messages
    const [privateMessages, globalMessages, matchMessages] = await Promise.all([
      prisma.message.findMany({
        where: { senderId: resolvedParams.id },
        include: {
          recipient: {
            select: { username: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      }),
      prisma.globalMessage.findMany({
        where: { senderId: resolvedParams.id },
        orderBy: { createdAt: 'desc' },
        take: 500
      }),
      prisma.matchMessage.findMany({
        where: { senderId: resolvedParams.id },
        include: {
          match: {
            select: { name: true, gameName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      })
    ]);

    // Combine and format messages
    const messages = [
      ...privateMessages.map(m => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        type: 'private' as const,
        recipient: m.recipient
      })),
      ...globalMessages.map(m => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        type: 'global' as const
      })),
      ...matchMessages.map(m => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        type: 'match' as const,
        match: m.match
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ messages });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
