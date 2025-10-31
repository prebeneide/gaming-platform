import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isKycEnabled, getKycSettings } from '@/lib/kycConfig';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    console.log('[KYC UPLOAD] Request received');

    if (!isKycEnabled()) {
      return NextResponse.json({ 
        error: 'KYC verification is currently disabled',
        message: 'Identity verification is temporarily unavailable.'
      }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to upload documents.'
      }, { status: 401 });
    }

    const settings = getKycSettings();
    if (settings.storage !== 'cloudinary') {
      return NextResponse.json({ 
        error: 'Invalid storage',
        message: 'This endpoint is only for Cloudinary storage.'
      }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const kycId = formData.get('kycId') as string;
    const kind = formData.get('kind') as string;
    const storageKey = formData.get('storageKey') as string;

    if (!file || !kycId || !kind || !storageKey) {
      return NextResponse.json({ 
        error: 'Missing fields',
        message: 'File, kycId, kind, and storageKey are required.'
      }, { status: 400 });
    }

    // Verify the verification belongs to the user
    const verification = await (prisma as any).kycVerification.findUnique({ where: { id: kycId } });
    if (!verification || verification.userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You do not have permission to upload documents for this verification.'
      }, { status: 403 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    console.log('[KYC UPLOAD] Uploading to Cloudinary:', { kycId, kind, storageKey });
    
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: `kyc/${session.user.id}/${kycId}`,
          public_id: `${kind}-${storageKey.split('-').pop()}`,
          resource_type: 'image',
          type: 'private', // Keep images private in Cloudinary
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });

    console.log('[KYC UPLOAD] Upload successful:', { publicId: uploadResult.public_id });

    // Return the Cloudinary public_id as storage key
    return NextResponse.json({ 
      key: uploadResult.public_id, // Use Cloudinary public_id as storage key
      url: uploadResult.secure_url, // Keep for reference
      storageProvider: 'cloudinary'
    });
  } catch (error: any) {
    console.error('[KYC UPLOAD] Error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      message: error?.message || 'Failed to upload file to Cloudinary.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

