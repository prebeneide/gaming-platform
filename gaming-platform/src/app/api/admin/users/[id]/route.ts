import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    // Get user details with all counts
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        image: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        discord: true,
        twitter: true,
        twitch: true,
        steam: true,
        psn: true,
        xbox: true,
        _count: {
          select: {
            activityLogs: true,
            createdMatches: true,
            matchParticipations: true,
            transactions: true,
            sentMessages: true,
            receivedMessages: true,
            globalMessages: true,
            matchMessages: true,
            followers: true,
            following: true,
            friendRequestsSent: true,
            friendRequestsReceived: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
