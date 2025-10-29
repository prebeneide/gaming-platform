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

    // Get all transactions with user information
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10000 // Limit to prevent too much data
    });

    return NextResponse.json({ transactions });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
