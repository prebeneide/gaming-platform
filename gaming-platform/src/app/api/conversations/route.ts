import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Hent alle meldinger for brukeren
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true
          }
        }
      }
    });

    // Grupper meldinger etter samtale (mellom to brukere)
    const conversations = new Map();

    messages.forEach(message => {
      const otherUser = message.senderId === session.user.id
        ? message.receiver
        : message.sender;

      const conversationId = [session.user.id, otherUser.id].sort().join("-");

      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, {
          id: conversationId,
          otherUser,
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            isRead: message.isRead,
            senderId: message.senderId
          }
        });
      }
    });

    // Konverter til array og sorter etter siste melding
    const sortedConversations = Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

    return NextResponse.json(sortedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 