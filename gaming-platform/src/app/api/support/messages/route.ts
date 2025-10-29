import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId");
  if (!adminId) {
    return NextResponse.json({ error: "Missing adminId" }, { status: 400 });
  }

  // Get support messages between user and admin
  const messages = await prisma.message.findMany({
    where: {
      isSupport: true,
      OR: [
        { senderId: session.user.id, receiverId: adminId },
        { senderId: adminId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, username: true, image: true, displayName: true } },
      receiver: { select: { id: true, username: true, image: true } },
    },
  });

  // Mark messages as read if user is receiver
  if (messages.length > 0) {
    await prisma.message.updateMany({
      where: {
        id: { in: messages.filter(m => m.receiverId === session.user.id && !m.isRead).map(m => m.id) },
      },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ messages });
}
