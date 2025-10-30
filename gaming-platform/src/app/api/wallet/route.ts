import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";
import { checkUserLocation, setUserLocation } from "@/lib/geofencing";
import { getClientIP, getGeolocationFromIP } from "@/lib/geolocation";

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

    // Geofencing check for deposits (admins bypass geofencing)
    if (type === 'deposit' && session.user.role !== 'admin') {
      // Ensure user's location is set (if missing) based on IP
      try {
        const existingRestriction = await (prisma as any).geographicRestriction.findUnique({ where: { userId: user.id } });
        if (!existingRestriction) {
          const clientIP = getClientIP(request) || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
          if (clientIP) {
            const geo = await getGeolocationFromIP(clientIP);
            if (geo.countryCode) {
              await setUserLocation(user.id, geo.countryCode, clientIP, 'ip_geolocation', geo.region || null);
            } else {
              // If we can't detect location, block the transaction
              return NextResponse.json({
                error: "Unable to verify your location. Please contact support if you believe this is an error.",
                restrictionLevel: 'blocked',
              }, { status: 403 });
            }
          } else {
            // If we can't get IP, block the transaction
            return NextResponse.json({
              error: "Unable to verify your location. Please contact support if you believe this is an error.",
              restrictionLevel: 'blocked',
            }, { status: 403 });
          }
        }
      } catch (e) {
        console.error('[Geofencing] Failed to auto-detect user location:', e);
        return NextResponse.json({
          error: "Unable to verify your location. Please contact support if you believe this is an error.",
          restrictionLevel: 'blocked',
        }, { status: 403 });
      }

      // Now check location after ensuring it's set
      const locationCheck = await checkUserLocation(user.id);
      if (!locationCheck.isAllowed) {
        return NextResponse.json({
          error: locationCheck.reason || "Deposits are not allowed from your location",
          country: locationCheck.country,
          restrictionLevel: locationCheck.restrictionLevel,
        }, { status: 403 });
      }
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

    // Log activity
    await logActivity({
      userId: user.id,
      action: type === 'deposit' ? ActivityTypes.DEPOSIT_INITIATED : ActivityTypes.WITHDRAWAL_INITIATED,
      entityType: 'Transaction',
      entityId: transaction.id,
      details: {
        type,
        amount,
        description,
        status: 'pending'
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