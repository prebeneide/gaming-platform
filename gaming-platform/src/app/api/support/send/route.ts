import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { receiverId, content } = body;
  if (!receiverId || !content) {
    return NextResponse.json({ error: "Missing receiverId or content" }, { status: 400 });
  }

  // Verify receiver is admin
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { role: true }
  });

  if (!receiver || receiver.role !== "admin") {
    return NextResponse.json({ error: "Receiver must be an admin" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content,
      isSupport: true, // Mark as support message
    },
    include: {
      sender: { select: { id: true, username: true, image: true, displayName: true } },
      receiver: { select: { id: true, username: true, image: true } },
    },
  });

  // Log activity
  await logActivity({
    userId: session.user.id,
    action: ActivityTypes.PRIVATE_MESSAGE_SENT,
    entityType: 'Message',
    entityId: message.id,
    details: { 
      content: content,
      isSupport: true,
      receiverId: receiverId
    }
  });

  return NextResponse.json(message);
}
