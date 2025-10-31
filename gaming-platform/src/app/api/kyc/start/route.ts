import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getKycSettings, isKycEnabled } from '@/lib/kycConfig';

export async function POST(req: NextRequest) {
  try {
    console.log('[KYC START] Request received');
    
    const kycEnabled = isKycEnabled();
    const settings = getKycSettings();
    console.log('[KYC START] KYC enabled:', kycEnabled, 'Settings:', settings);
    
    if (!kycEnabled) {
      console.log('[KYC START] KYC disabled, returning 403');
      return NextResponse.json({ 
        error: 'KYC verification is currently disabled',
        message: 'Identity verification is temporarily unavailable. Please contact support if you need assistance.'
      }, { status: 403 });
    }

    console.log('[KYC START] Getting session...');
    const session = await getServerSession(authOptions);
    console.log('[KYC START] Session:', session ? 'exists' : 'missing', session?.user?.id ? `userId: ${session.user.id}` : 'no userId');
    
    if (!session?.user?.id) {
      console.log('[KYC START] No session or userId, returning 401');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to start identity verification. Please refresh the page and try again.'
      }, { status: 401 });
    }

    // Parse request body with error handling
    console.log('[KYC START] Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('[KYC START] Body parsed:', { dob: body?.dob ? 'present' : 'missing', country: body?.country || 'missing' });
    } catch (parseError: any) {
      console.error('[KYC START] Body parse error:', parseError);
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
    console.log('[KYC START] Settings:', settings);

    // Check if user already has a pending verification
    console.log('[KYC START] Checking for existing verification...');
    let existingVerification;
    try {
      existingVerification = await (prisma as any).kycVerification.findFirst({
        where: { 
          userId: session.user.id,
          status: 'pending'
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log('[KYC START] Existing verification:', existingVerification ? 'found' : 'not found');
    } catch (dbError: any) {
      console.error('[KYC START] Database error checking existing verification:', dbError);
      console.error('[KYC START] Error stack:', dbError?.stack);
      return NextResponse.json({ 
        error: 'Database error',
        message: 'Failed to check for existing verification. Please try again or contact support if the problem persists.',
        details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
      }, { status: 500 });
    }

    if (existingVerification) {
      console.log('[KYC START] Returning existing verification');
      return NextResponse.json({ 
        verification: existingVerification,
        message: 'You already have a pending verification. Please continue with your existing submission.'
      }, { status: 200 });
    }

    // Create new verification
    console.log('[KYC START] Creating new verification...');
    let verification;
    try {
      const verificationData = {
        userId: session.user.id,
        status: 'pending',
        provider: settings.provider || 'manual',
        dob: dobDate,
        country: country.toUpperCase() || null,
      };
      console.log('[KYC START] Verification data:', { ...verificationData, userId: '***' });
      
      verification = await (prisma as any).kycVerification.create({
        data: verificationData
      });
      console.log('[KYC START] Verification created successfully:', verification?.id);
    } catch (dbError: any) {
      console.error('[KYC START] Database error creating verification:', dbError);
      console.error('[KYC START] Error code:', dbError?.code);
      console.error('[KYC START] Error message:', dbError?.message);
      console.error('[KYC START] Error stack:', dbError?.stack);
      
      // Provide specific error messages based on error type
      if (dbError?.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Duplicate verification',
          message: 'A verification with the same information already exists. Please check your existing verifications or contact support.'
        }, { status: 409 });
      }
      
      if (dbError?.code === 'P2003') {
        return NextResponse.json({ 
          error: 'Invalid user reference',
          message: 'User account not found. Please refresh the page and try again.'
        }, { status: 400 });
      }

      return NextResponse.json({ 
        error: 'Failed to create verification',
        message: 'An error occurred while creating your verification. Please try again or contact support if the problem persists.',
        details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
      }, { status: 500 });
    }

    return NextResponse.json({ 
      verification,
      message: 'Verification started successfully'
    });
  } catch (error: any) {
    console.error('KYC start error (outer catch):', error);
    console.error('Error stack:', error?.stack);
    
    // Make sure we always return valid JSON
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while starting verification. Please try again or contact support if the problem persists.',
      details: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      } : undefined
    }, { status: 500 });
  }
}


