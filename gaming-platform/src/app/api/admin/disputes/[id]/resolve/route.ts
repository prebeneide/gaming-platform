import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";

// POST /api/admin/disputes/[id]/resolve - Resolve a dispute
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { winnerId, resultType, adminNotes } = await request.json();

    if (!winnerId || !resultType) {
      return NextResponse.json({ error: "Winner ID and result type are required" }, { status: 400 });
    }

    // Get the dispute
    const dispute = await prisma.matchResult.findUnique({
      where: { id: resolvedParams.id },
      include: {
        match: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== 'disputed') {
      return NextResponse.json({ error: "This dispute has already been resolved" }, { status: 400 });
    }

    // Resolve the dispute
    const updatedDispute = await prisma.matchResult.update({
      where: { id: resolvedParams.id },
      data: {
        winnerId: resultType === 'win' ? winnerId : null,
        resultType,
        status: 'resolved',
        completedAt: new Date()
      }
    });

    // Update match status
    await prisma.match.update({
      where: { id: dispute.matchId },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Handle payouts
    if (resultType === 'win' && winnerId) {
      const payoutAmount = dispute.match.potentialWinnings;
      
      // Update winner's wallet
      await prisma.userWallet.update({
        where: { userId: winnerId },
        data: { balance: { increment: payoutAmount } }
      });

      // Create payout transaction
      await prisma.transaction.create({
        data: {
          userId: winnerId,
          type: 'match_payout',
          amount: payoutAmount,
          status: 'completed',
          description: `Admin-resolved payout for winning match ${dispute.matchId}`
        }
      });
    } else if (resultType === 'draw') {
      // Refund all participants
      const refundAmount = dispute.match.buyIn;
      for (const participant of dispute.match.participants) {
        await prisma.userWallet.update({
          where: { userId: participant.userId },
          data: { balance: { increment: refundAmount } }
        });

        await prisma.transaction.create({
          data: {
            userId: participant.userId,
            type: 'match_draw_refund',
            amount: refundAmount,
            status: 'completed',
            description: `Admin-resolved refund for draw in match ${dispute.matchId}`
          }
        });
      }
    }

    // Log admin activity
    await logActivity({
      userId: session.user.id,
      action: ActivityTypes.ADMIN_DISPUTE_RESOLVED,
      entityType: 'MatchResult',
      entityId: resolvedParams.id,
      details: {
        matchId: dispute.matchId,
        matchName: dispute.match.name,
        gameName: dispute.match.gameName,
        winnerId,
        resultType,
        adminNotes,
        payoutAmount: resultType === 'win' ? dispute.match.potentialWinnings : null
      }
    });

    return NextResponse.json({ 
      success: true, 
      dispute: updatedDispute,
      message: "Dispute resolved successfully"
    });

  } catch (error) {
    console.error("Error resolving dispute:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
