import { getKycSettings } from './kycConfig';

// Lazy import AWS SDK to keep it optional
let s3Client: any;
let fromIni: any;
let PutObjectCommand: any;
let GetObjectCommand: any;
let DeleteObjectCommand: any;
let S3Client: any;
let getSignedUrl: any;

async function ensureAws() {
  if (s3Client) return;
  const settings = getKycSettings();
  if (settings.storage !== 's3') {
    console.error('[S3] Storage is not set to S3, storage:', settings.storage);
    throw new Error('S3 storage is not enabled in configuration');
  }

  // Check required environment variables
  if (!process.env.S3_BUCKET) {
    console.error('[S3] S3_BUCKET is not set');
    throw new Error('S3_BUCKET environment variable is not set');
  }
  if (!process.env.S3_REGION) {
    console.error('[S3] S3_REGION is not set');
    throw new Error('S3_REGION environment variable is not set');
  }
  if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    console.error('[S3] S3 credentials are missing');
    throw new Error('S3 credentials (S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY) are not set');
  }

  try {
    const sdk = await import('@aws-sdk/client-s3');
    const presigner = await import('@aws-sdk/s3-request-presigner');
    S3Client = sdk.S3Client;
    PutObjectCommand = sdk.PutObjectCommand;
    GetObjectCommand = sdk.GetObjectCommand;
    DeleteObjectCommand = sdk.DeleteObjectCommand;
    getSignedUrl = presigner.getSignedUrl;

    console.log('[S3] Initializing S3 client:', { 
      region: process.env.S3_REGION, 
      bucket: process.env.S3_BUCKET,
      hasCredentials: !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)
    });

    s3Client = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
    console.log('[S3] S3 client initialized successfully');
  } catch (error: any) {
    console.error('[S3] Failed to initialize AWS SDK:', error);
    throw new Error(`Failed to initialize S3 client: ${error?.message || 'Unknown error'}`);
  }
}

export async function getPresignedPutUrl(key: string, contentType: string, expiresSeconds = 300) {
  try {
    console.log('[S3] Getting presigned PUT URL:', { key, contentType, expiresSeconds });
    await ensureAws();
    
    if (!s3Client) {
      throw new Error('S3 client is not initialized');
    }

    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable is not set');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    
    console.log('[S3] Generating presigned URL for:', { bucket: process.env.S3_BUCKET, key });
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresSeconds });
    console.log('[S3] Presigned URL generated successfully:', { urlLength: url?.length, key });
    return url;
  } catch (error: any) {
    console.error('[S3] Error getting presigned PUT URL:', error);
    console.error('[S3] Error details:', { 
      message: error?.message, 
      stack: error?.stack,
      key,
      bucket: process.env.S3_BUCKET
    });
    throw new Error(`Failed to generate upload URL: ${error?.message || 'Unknown error'}`);
  }
}

export async function getPresignedGetUrl(key: string, expiresSeconds = 300) {
  await ensureAws();
  if (!s3Client) throw new Error('S3 not configured');
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: expiresSeconds });
  return url;
}

export async function deleteObject(key: string) {
  await ensureAws();
  if (!s3Client) throw new Error('S3 not configured');
  const command = new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
  await s3Client.send(command);
}


