import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";

// POST /api/admin/users/[id]/transfer - Admin transfer money to/from user
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
    const { type, amount, reason } = await request.json();

    if (!type || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    // Get user and their wallet
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      include: { wallet: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create wallet if it doesn't exist
    if (!user.wallet) {
      await prisma.userWallet.create({
        data: {
          userId: user.id,
          balance: 0,
          currency: "USD"
        }
      });
    }

    // Process transfer
    const updatedWallet = await prisma.userWallet.update({
      where: { userId: user.id },
      data: {
        balance: type === "deposit" 
          ? { increment: amount }
          : { decrement: amount }
      }
    });

    // Check for insufficient funds on withdrawal
    if (type === "withdraw" && updatedWallet.balance < 0) {
      // Revert the withdrawal
      await prisma.userWallet.update({
        where: { userId: user.id },
        data: { balance: { increment: amount } }
      });
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: type === "deposit" ? "admin_deposit" : "admin_withdrawal",
        amount,
        status: "completed",
        description: `Admin ${type}: ${reason}`
      }
    });

    // Log admin activity
    await logActivity({
      userId: session.user.id,
      action: type === "deposit" ? ActivityTypes.ADMIN_DEPOSIT : ActivityTypes.ADMIN_WITHDRAWAL,
      entityType: 'Transaction',
      entityId: transaction.id,
      details: {
        targetUserId: user.id,
        targetUsername: user.username,
        amount,
        reason,
        newBalance: updatedWallet.balance
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: updatedWallet.balance
    });

  } catch (error) {
    console.error("Error processing admin transfer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
