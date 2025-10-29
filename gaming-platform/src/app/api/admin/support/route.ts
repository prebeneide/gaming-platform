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

    // Get all support conversations (grouped by user)
    const supportMessages = await prisma.message.findMany({
      where: {
        isSupport: true,
        OR: [
          { senderId: session.user.id }, // Admin sent
          { receiverId: session.user.id }, // User sent to admin
        ],
      },
      orderBy: { createdAt: 'desc' },
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

    // Group by user (the other party in the conversation)
    const conversations = new Map<string, {
      userId: string;
      user: {
        id: string;
        username: string;
        email: string;
        displayName?: string;
        image?: string;
      };
      lastMessage: typeof supportMessages[0];
      unreadCount: number;
      messages: typeof supportMessages;
    }>();

    supportMessages.forEach((message) => {
      const otherUser = message.senderId === session.user.id 
        ? message.receiver 
        : message.sender;
      
      if (!otherUser) return;

      const existing = conversations.get(otherUser.id);
      
      if (!existing || new Date(message.createdAt) > new Date(existing.lastMessage.createdAt)) {
        const unreadCount = message.receiverId === session.user.id && !message.isRead 
          ? 1 
          : 0;
        
        conversations.set(otherUser.id, {
          userId: otherUser.id,
          user: otherUser,
          lastMessage: message,
          unreadCount: existing ? existing.unreadCount + unreadCount : unreadCount,
          messages: existing ? [...existing.messages, message] : [message],
        });
      } else {
        const existing = conversations.get(otherUser.id)!;
        if (message.receiverId === session.user.id && !message.isRead) {
          existing.unreadCount++;
        }
        existing.messages.push(message);
      }
    });

    // Convert to array and sort by last message date
    const conversationsArray = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    return NextResponse.json({ conversations: conversationsArray });

  } catch (error) {
    console.error("Error fetching support conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
