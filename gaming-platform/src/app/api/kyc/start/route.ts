import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getKycSettings, isKycEnabled } from '@/lib/kycConfig';

export async function POST(req: NextRequest) {
  try {
    if (!isKycEnabled()) {
      return NextResponse.json({ 
        error: 'KYC verification is currently disabled',
        message: 'Identity verification is temporarily unavailable. Please contact support if you need assistance.'
      }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to start identity verification. Please refresh the page and try again.'
      }, { status: 401 });
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'The request data was invalid. Please check your information and try again.'
      }, { status: 400 });
    }

    const { dob, country } = body || {};

    // Validate required fields
    if (!dob) {
      return NextResponse.json({ 
        error: 'Date of birth required',
        message: 'Please provide your date of birth to start verification.'
      }, { status: 400 });
    }

    if (!country || country.length !== 2) {
      return NextResponse.json({ 
        error: 'Country code required',
        message: 'Please provide a valid 2-letter country code (e.g., NO, US, SE) to start verification.'
      }, { status: 400 });
    }

    // Validate date of birth
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date of birth',
        message: 'Please provide a valid date of birth.'
      }, { status: 400 });
    }

    const age = Math.floor((Date.now() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 18) {
      return NextResponse.json({ 
        error: 'Age requirement',
        message: 'You must be at least 18 years old to use this service.'
      }, { status: 400 });
    }

    const settings = getKycSettings();

    // Check if user already has a pending verification
    const existingVerification = await (prisma as any).kycVerification.findFirst({
      where: { 
        userId: session.user.id,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingVerification) {
      return NextResponse.json({ 
        verification: existingVerification,
        message: 'You already have a pending verification. Please continue with your existing submission.'
      }, { status: 200 });
    }

    const verification = await prisma.kycVerification.create({
      data: {
        userId: session.user.id,
        status: 'pending',
        provider: settings.provider,
        dob: dobDate,
        country: country.toUpperCase() || null,
      }
    });

    return NextResponse.json({ 
      verification,
      message: 'Verification started successfully'
    });
  } catch (error: any) {
    console.error('KYC start error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An error occurred while starting verification. Please try again or contact support if the problem persists.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}


