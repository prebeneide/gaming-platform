import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isKycEnabled, getKycSettings } from '@/lib/kycConfig';
import { getPresignedPutUrl } from '@/lib/s3';
import { prisma } from '@/lib/prisma';

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
        message: 'You must be logged in to upload documents. Please refresh the page and try again.'
      }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'The request data was invalid. Please try selecting the file again.'
      }, { status: 400 });
    }

    const { kycId, kind, contentType } = body || {};

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
        message: 'Please specify which document you are uploading (front, back, or selfie).'
      }, { status: 400 });
    }

    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        message: 'Please upload an image file (JPG, PNG, WebP, etc.). Other file types are not supported.'
      }, { status: 400 });
    }

    const settings = getKycSettings();
    if (settings.storage !== 's3') {
      return NextResponse.json({ 
        error: 'S3 storage not configured',
        message: 'Document storage is not properly configured. Please contact support.'
      }, { status: 500 });
    }

    // Verify the verification belongs to the user
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
        message: 'You do not have permission to upload documents for this verification.'
      }, { status: 403 });
    }

    const uuid = (global as any).crypto?.randomUUID ? (global as any).crypto.randomUUID() : Math.random().toString(36).slice(2);
    const key = `kyc/${session.user.id}/${kycId}/${kind}-${uuid}`;
    
    try {
      const url = await getPresignedPutUrl(key, contentType, 300);
      return NextResponse.json({ key, url, storageProvider: 's3' });
    } catch (e: any) {
      console.error('Presign error', e);
      return NextResponse.json({ 
        error: 'Failed to create upload URL',
        message: 'Failed to prepare document upload. Please try again or contact support if the problem persists.',
        details: process.env.NODE_ENV === 'development' ? e?.message : undefined
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Upload URL error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An error occurred while preparing document upload. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}


