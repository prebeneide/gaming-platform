import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/wallet - Get user's wallet balance and transactions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20 // Last 20 transactions
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create wallet if it doesn't exist
    if (!user.wallet) {
      const wallet = await prisma.userWallet.create({
        data: {
          userId: user.id,
          balance: 0,
          currency: "USD"
        }
      });
      return NextResponse.json({
        balance: wallet.balance,
        currency: wallet.currency,
        transactions: []
      });
    }

    return NextResponse.json({
      balance: user.wallet.balance,
      currency: user.wallet.currency,
      transactions: user.transactions
    });

  } catch (error) {
    console.error("Wallet GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/wallet - Create deposit or withdrawal transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, amount, description } = await request.json();

    if (!type || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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

    // For withdrawals, check if user has enough balance
    if (type === 'withdrawal') {
      const currentBalance = user.wallet?.balance || 0;
      if (currentBalance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
    }

    // Create a pending transaction for both deposits and withdrawals
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type,
        amount,
        status: 'pending',
        description
      }
    });

    // Return the pending transaction.
    // The balance will be updated via a separate webhook/confirmation call.
    return NextResponse.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error("Wallet POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 