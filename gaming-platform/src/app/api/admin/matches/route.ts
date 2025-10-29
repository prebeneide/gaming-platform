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

    // Get all matches with creator and participant information
    const matches = await prisma.match.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            image: true,
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                image: true,
              }
            }
          }
        },
        result: {
          select: {
            id: true,
            winnerId: true,
            resultType: true,
            status: true,
            payoutAmount: true,
            createdAt: true,
            completedAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10000 // Limit to prevent too much data
    });

    return NextResponse.json({ matches });

  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
