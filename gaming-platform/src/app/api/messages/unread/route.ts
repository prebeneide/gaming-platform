import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // For admin users: exclude support messages (they should only see them in admin panel)
    const isAdmin = session.user.role === "admin";
    
    // Hent antall uleste meldinger (ekskluder support-meldinger for admin)
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false,
        // Exclude support messages for admin users
        ...(isAdmin ? { isSupport: false } : {})
      }
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 