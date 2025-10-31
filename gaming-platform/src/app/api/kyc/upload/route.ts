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

    console.log('[KYC UPLOAD] Parsing form data...');
    const formData = await req.formData();
    
    const file = formData.get('file') as File;
    const kycId = formData.get('kycId')?.toString() || '';
    const kind = formData.get('kind')?.toString() || '';
    const storageKey = formData.get('storageKey')?.toString() || '';

    console.log('[KYC UPLOAD] Form data parsed:', {
      hasFile: !!file,
      fileSize: file?.size,
      fileType: file?.type,
      fileName: file?.name,
      kycId,
      kind,
      storageKey
    });

    if (!file || file.size === 0) {
      console.error('[KYC UPLOAD] Missing or empty file');
      return NextResponse.json({ 
        error: 'Missing file',
        message: 'No file was uploaded. Please select a file and try again.'
      }, { status: 400 });
    }

    if (!kycId || !kind || !storageKey) {
      console.error('[KYC UPLOAD] Missing required fields:', { kycId: !!kycId, kind: !!kind, storageKey: !!storageKey });
      return NextResponse.json({ 
        error: 'Missing fields',
        message: 'Verification ID, document type, and storage key are required.'
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
    const folder = `kyc/${session.user.id}/${kycId}`;
    const publicId = `${kind}-${storageKey.split('-').pop() || 'unknown'}`;
    
    console.log('[KYC UPLOAD] Uploading to Cloudinary:', { 
      folder, 
      publicId,
      fileSize: buffer.length,
      kycId, 
      kind, 
      storageKey,
      cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME
    });
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[KYC UPLOAD] Cloudinary not configured');
      return NextResponse.json({ 
        error: 'Cloudinary not configured',
        message: 'Cloudinary credentials are missing. Please check your environment variables.'
      }, { status: 500 });
    }
    
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadOptions = {
        folder: folder,
        public_id: publicId,
        resource_type: 'image' as const,
        overwrite: false,
      };
      
      console.log('[KYC UPLOAD] Cloudinary upload options:', uploadOptions);
      
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('[KYC UPLOAD] Cloudinary upload error:', error);
            return reject(error);
          }
          console.log('[KYC UPLOAD] Cloudinary upload success:', { 
            public_id: result?.public_id,
            secure_url: result?.secure_url 
          });
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

