import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get admin ID
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true }
  });

  if (!admin) {
    return NextResponse.json({ count: 0 });
  }

  // Count unread support messages for the user (from admin)
  const unreadCount = await prisma.message.count({
    where: {
      isSupport: true,
      senderId: admin.id,
      receiverId: session.user.id,
      isRead: false,
    },
  });

  return NextResponse.json({ count: unreadCount });
}
