import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { senderId } = await request.json();
    if (!senderId) {
      return new NextResponse("Sender ID is required", { status: 400 });
    }

    // Marker alle uleste meldinger fra denne avsenderen som lest
    await prisma.message.updateMany({
      where: {
        senderId: senderId,
        receiverId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 