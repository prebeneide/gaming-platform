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
  if (settings.storage !== 's3') return;
  const sdk = await import('@aws-sdk/client-s3');
  const presigner = await import('@aws-sdk/s3-request-presigner');
  S3Client = sdk.S3Client;
  PutObjectCommand = sdk.PutObjectCommand;
  GetObjectCommand = sdk.GetObjectCommand;
  DeleteObjectCommand = sdk.DeleteObjectCommand;
  getSignedUrl = presigner.getSignedUrl;

  s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    } : undefined,
  });
}

export async function getPresignedPutUrl(key: string, contentType: string, expiresSeconds = 300) {
  await ensureAws();
  if (!s3Client) throw new Error('S3 not configured');
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: expiresSeconds });
  return url;
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


