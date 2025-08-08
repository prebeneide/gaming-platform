import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { createPaymentNotification } from "@/lib/notifications";

const prisma = new PrismaClient();

// POST /api/wallet/confirm-withdrawal - Simulate an internal confirmation for a withdrawal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    // Security checks
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    if (transaction.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (transaction.status !== 'pending') {
      return NextResponse.json({ error: `Transaction is already ${transaction.status}` }, { status: 409 });
    }
     if (transaction.type !== 'withdrawal') {
      return NextResponse.json({ error: `Transaction is not a withdrawal` }, { status: 400 });
    }

    // Use a Prisma transaction to ensure both updates succeed or fail together
    const [, updatedWallet] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'completed' },
      }),
      prisma.userWallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: transaction.amount,
          },
        },
      }),
    ]);

    // Opprett notification for withdrawal
    try {
      await createPaymentNotification(
        user.id,
        'withdrawal',
        transaction.amount,
        'completed'
      );
    } catch (notificationError) {
      console.error("Error creating withdrawal notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal confirmed successfully",
      newBalance: updatedWallet.balance,
    });

  } catch (error) {
    console.error("Confirm Withdrawal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 