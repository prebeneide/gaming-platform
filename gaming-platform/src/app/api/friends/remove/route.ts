import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Finn brukeren som skal fjernes som venn
    const friendUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!friendUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Finn og slett akseptert friend request
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromId: session.user.id, toId: friendUser.id, status: "accepted" },
          { fromId: friendUser.id, toId: session.user.id, status: "accepted" },
        ],
      },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    // Slett friend request
    await prisma.friendRequest.delete({
      where: { id: friendRequest.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json(
      { error: "Failed to remove friend" },
      { status: 500 }
    );
  }
} 