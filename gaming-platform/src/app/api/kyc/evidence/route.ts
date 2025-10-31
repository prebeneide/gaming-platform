import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isKycEnabled, getKycSettings } from '@/lib/kycConfig';

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
        message: 'You must be logged in to register documents. Please refresh the page and try again.'
      }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'The request data was invalid. Please try uploading the document again.'
      }, { status: 400 });
    }

    const { kycId, kind, storageKey, storageProvider } = body || {};

    // Validate required fields
    if (!kycId) {
      return NextResponse.json({ 
        error: 'Verification ID required',
        message: 'Verification session not found. Please refresh the page and start a new verification.'
      }, { status: 400 });
    }

    if (!kind) {
      return NextResponse.json({ 
        error: 'Document type required',
        message: 'Please specify which document you are registering (front, back, or selfie).'
      }, { status: 400 });
    }

    if (!storageKey) {
      return NextResponse.json({ 
        error: 'Storage key required',
        message: 'Document storage information missing. Please try uploading the document again.'
      }, { status: 400 });
    }

    // Verify the verification exists and belongs to the user
    const verification = await (prisma as any).kycVerification.findUnique({ where: { id: kycId } });
    if (!verification) {
      return NextResponse.json({ 
        error: 'Verification not found',
        message: 'Verification session not found. Please refresh the page and start a new verification.'
      }, { status: 404 });
    }

    if (verification.userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You do not have permission to register documents for this verification.'
      }, { status: 403 });
    }

    if (verification.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Verification not pending',
        message: `Your verification is already ${verification.status}. You cannot add more documents at this time.`
      }, { status: 400 });
    }

    const settings = getKycSettings();
    
    try {
      const evidence = await (prisma as any).kycEvidence.create({
        data: {
          kycId,
          kind,
          storageKey,
          storageProvider: storageProvider || settings.storage,
        }
      });
      return NextResponse.json({ evidence });
    } catch (dbError: any) {
      // Check for unique constraint violation (duplicate document type)
      if (dbError?.code === 'P2002' || dbError?.message?.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Document already exists',
          message: `You have already uploaded a ${kind} document. Please remove the existing one first if you want to replace it.`
        }, { status: 409 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Evidence registration error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An error occurred while registering your document. Please try again or contact support if the problem persists.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}


