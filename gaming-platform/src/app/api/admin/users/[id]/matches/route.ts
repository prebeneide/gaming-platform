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

    // Get all matches user has participated in
    const matchParticipations = await prisma.matchParticipant.findMany({
      where: { userId: resolvedParams.id },
      include: {
        match: {
          include: {
            result: {
              select: {
                winnerId: true,
                payoutAmount: true,
                completedAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    const matches = matchParticipations.map(p => ({
      id: p.match.id,
      name: p.match.name,
      gameName: p.match.gameName,
      status: p.match.status,
      buyInAmount: p.match.buyInAmount,
      createdAt: p.match.createdAt,
      completedAt: p.match.result?.completedAt,
      result: p.match.result ? {
        winnerId: p.match.result.winnerId,
        payoutAmount: p.match.result.payoutAmount
      } : null
    }));

    return NextResponse.json({ matches });

  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
