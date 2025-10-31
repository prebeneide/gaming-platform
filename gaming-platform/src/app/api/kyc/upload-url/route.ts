import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isKycEnabled, getKycSettings } from '@/lib/kycConfig';
import { getPresignedPutUrl } from '@/lib/s3';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(req: NextRequest) {
  try {
    console.log('[UPLOAD URL] Request received');
    
    if (!isKycEnabled()) {
      console.log('[UPLOAD URL] KYC disabled, returning 403');
      return NextResponse.json({ 
        error: 'KYC verification is currently disabled',
        message: 'Identity verification is temporarily unavailable. Please contact support if you need assistance.'
      }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[UPLOAD URL] No session, returning 401');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to upload documents. Please refresh the page and try again.'
      }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('[UPLOAD URL] Body parsed:', { kycId: body?.kycId ? 'present' : 'missing', kind: body?.kind, contentType: body?.contentType });
    } catch (parseError: any) {
      console.error('[UPLOAD URL] Body parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request',
        message: 'The request data was invalid. Please try selecting the file again.'
      }, { status: 400 });
    }

    const { kycId, kind, contentType } = body || {};

    // Validate required fields
    if (!kycId) {
      console.log('[UPLOAD URL] Missing kycId');
      return NextResponse.json({ 
        error: 'Verification ID required',
        message: 'Verification session not found. Please refresh the page and start a new verification.'
      }, { status: 400 });
    }

    if (!kind) {
      console.log('[UPLOAD URL] Missing kind');
      return NextResponse.json({ 
        error: 'Document type required',
        message: 'Please specify which document you are uploading (front, back, or selfie).'
      }, { status: 400 });
    }

    if (!contentType || !contentType.startsWith('image/')) {
      console.log('[UPLOAD URL] Invalid contentType:', contentType);
      return NextResponse.json({ 
        error: 'Invalid file type',
        message: 'Please upload an image file (JPG, PNG, WebP, etc.). Other file types are not supported.'
      }, { status: 400 });
    }

    // Verify the verification belongs to the user (before checking storage)
    console.log('[UPLOAD URL] Checking verification:', kycId);
    const verification = await (prisma as any).kycVerification.findUnique({ where: { id: kycId } });
    if (!verification) {
      console.log('[UPLOAD URL] Verification not found:', kycId);
      return NextResponse.json({ 
        error: 'Verification not found',
        message: 'Verification session not found. Please refresh the page and start a new verification.'
      }, { status: 404 });
    }

    if (verification.userId !== session.user.id) {
      console.log('[UPLOAD URL] User mismatch:', { verificationUserId: verification.userId, sessionUserId: session.user.id });
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You do not have permission to upload documents for this verification.'
      }, { status: 403 });
    }

    const settings = getKycSettings();
    console.log('[UPLOAD URL] Settings:', { storage: settings.storage, enabled: settings.enabled });
    
    // Support both S3 and Cloudinary (Cloudinary for testing only)
    if (settings.storage === 'cloudinary') {
      // Configure Cloudinary if not already configured
      if (!cloudinary.config().cloud_name) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
      }

      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('[UPLOAD URL] Cloudinary not configured');
        return NextResponse.json({ 
          error: 'Cloudinary not configured',
          message: 'Cloudinary credentials are missing. Please check your environment variables.',
        }, { status: 500 });
      }

      // For Cloudinary, we'll use direct upload via server
      const uuid = (global as any).crypto?.randomUUID ? (global as any).crypto.randomUUID() : Math.random().toString(36).slice(2);
      const storageKey = `kyc-${session.user.id}-${kycId}-${kind}-${uuid}`;
      
      console.log('[UPLOAD URL] Using Cloudinary storage (testing mode):', { 
        storageKey,
        cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME
      });
      
      return NextResponse.json({ 
        key: storageKey, 
        url: '/api/kyc/upload', // Client will POST here instead of direct to storage
        storageProvider: 'cloudinary',
        directUpload: false, // Indicates we need to upload via server
      });
    } else if (settings.storage === 's3') {
      const uuid = (global as any).crypto?.randomUUID ? (global as any).crypto.randomUUID() : Math.random().toString(36).slice(2);
      const key = `kyc/${session.user.id}/${kycId}/${kind}-${uuid}`;
      console.log('[UPLOAD URL] Generating presigned URL for key:', key);
      
      try {
        const url = await getPresignedPutUrl(key, contentType, 300);
        console.log('[UPLOAD URL] Presigned URL generated successfully');
        return NextResponse.json({ key, url, storageProvider: 's3', directUpload: true });
      } catch (e: any) {
        console.error('[UPLOAD URL] Presign error:', e);
        console.error('[UPLOAD URL] Error stack:', e?.stack);
        return NextResponse.json({ 
          error: 'Failed to create upload URL',
          message: 'Failed to prepare document upload. Please check your S3 configuration or contact support.',
          details: process.env.NODE_ENV === 'development' ? {
            message: e?.message,
            stack: e?.stack,
            hint: 'Check S3 credentials in .env.local'
          } : undefined
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('[UPLOAD URL] Outer catch error:', error);
    console.error('[UPLOAD URL] Error stack:', error?.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An error occurred while preparing document upload. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        stack: error?.stack
      } : undefined
    }, { status: 500 });
  }
}


