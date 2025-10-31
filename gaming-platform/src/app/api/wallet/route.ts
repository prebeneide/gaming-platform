import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";
import { checkUserLocation, setUserLocation } from "@/lib/geofencing";
import { getClientIP, getGeolocationFromIP } from "@/lib/geolocation";
import { isKycEnabled, getKycSettings } from "@/lib/kycConfig";

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

    // Check KYC status if KYC is enabled
    let kycStatus = null;
    const kycEnabled = isKycEnabled();
    if (kycEnabled) {
      const kycVerification = await (prisma as any).kycVerification.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (kycVerification) {
        kycStatus = {
          status: kycVerification.status,
          reason: kycVerification.reason || null,
          createdAt: kycVerification.createdAt,
          decidedAt: kycVerification.decidedAt || null,
        };
      } else {
        kycStatus = {
          status: 'not_started',
          reason: null,
          createdAt: null,
          decidedAt: null,
        };
      }
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
        transactions: [],
        kycStatus,
        kycEnabled,
      });
    }

    return NextResponse.json({
      balance: user.wallet.balance,
      currency: user.wallet.currency,
      transactions: user.transactions,
      kycStatus,
      kycEnabled,
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

    // KYC verification check for deposits and withdrawals (admins bypass KYC)
    if (session.user.role !== 'admin') {
      const kycEnabled = isKycEnabled();
      
      if (kycEnabled && (type === 'deposit' || type === 'withdrawal')) {
        // Check if user has approved KYC verification
        const kycVerification = await (prisma as any).kycVerification.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });

        if (!kycVerification) {
          // User hasn't started KYC verification
          return NextResponse.json({
            error: "Identity verification required",
            message: "To make deposits or withdrawals, you must complete identity verification. This helps us comply with regulations and keep your account secure.",
            action: "verify_identity",
            redirectTo: "/kyc",
            status: 'not_started',
          }, { status: 403 });
        }

        if (kycVerification.status === 'pending') {
          // KYC is pending review
          return NextResponse.json({
            error: "Identity verification pending",
            message: "Your identity verification is currently under review. We'll notify you once it's been processed, which typically takes 1-2 business days.",
            action: "pending_review",
            redirectTo: "/kyc",
            status: 'pending',
            submittedAt: kycVerification.createdAt,
          }, { status: 403 });
        }

        if (kycVerification.status === 'rejected') {
          // KYC was rejected
          return NextResponse.json({
            error: "Identity verification required",
            message: kycVerification.reason 
              ? `Your previous identity verification was rejected: ${kycVerification.reason}. Please submit a new verification with corrected documents.`
              : "Your previous identity verification was rejected. Please submit a new verification with correct documents.",
            action: "rejected",
            redirectTo: "/kyc",
            status: 'rejected',
            reason: kycVerification.reason || null,
          }, { status: 403 });
        }

        if (kycVerification.status !== 'approved') {
          // Unknown status
          return NextResponse.json({
            error: "Identity verification required",
            message: "Your identity verification status could not be determined. Please verify your identity to continue.",
            action: "verify_identity",
            redirectTo: "/kyc",
            status: 'unknown',
          }, { status: 403 });
        }
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