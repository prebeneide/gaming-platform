import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get all support messages between admin and this user
    const messages = await prisma.message.findMany({
      where: {
        isSupport: true,
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            image: true,
          }
        },
      },
    });

    // Mark messages as read if admin is receiver
    await prisma.message.updateMany({
      where: {
        id: { in: messages.filter(m => m.receiverId === session.user.id && !m.isRead).map(m => m.id) },
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error("Error fetching support messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Missing receiverId or content" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        isSupport: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            image: true,
          }
        },
      },
    });

    return NextResponse.json(message);

  } catch (error) {
    console.error("Error sending support message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
