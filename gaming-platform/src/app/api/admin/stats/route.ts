import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get basic statistics
    const [totalUsers, totalMatches, totalTransactions, recentActivity] = await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.transaction.count(),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              username: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      totalMatches,
      totalTransactions,
      recentActivity
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
