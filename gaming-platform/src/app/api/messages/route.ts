import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch messages between the logged-in user and another user (by username or userId)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get("userId");
  if (!otherUserId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, username: true, image: true } },
      receiver: { select: { id: true, username: true, image: true } },
    },
  });

  return NextResponse.json(messages);
}

// POST: Send a message to another user
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

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content,
    },
    include: {
      sender: { select: { id: true, username: true, image: true } },
      receiver: { select: { id: true, username: true, image: true } },
    },
  });

  return NextResponse.json(message);
} 