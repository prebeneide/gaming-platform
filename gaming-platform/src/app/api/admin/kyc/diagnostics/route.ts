import { NextResponse } from 'next/server';
import { getKycSettings, isKycEnabled } from '@/lib/kycConfig';

export async function GET() {
  const settings = getKycSettings();
  const env = {
    FEATURE_KYC: process.env.FEATURE_KYC || null,
    KYC_PROVIDER: process.env.KYC_PROVIDER || null,
    KYC_STORAGE: process.env.KYC_STORAGE || null,
    S3_BUCKET: !!process.env.S3_BUCKET,
    S3_REGION: !!process.env.S3_REGION,
    S3_ACCESS_KEY_ID: !!process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: !!process.env.S3_SECRET_ACCESS_KEY,
    KYC_RETENTION_DAYS: process.env.KYC_RETENTION_DAYS || null,
    KYC_REVIEWER_EMAILS: process.env.KYC_REVIEWER_EMAILS || '',
  };
  let awsInstalled = false;
  try {
    await import('@aws-sdk/client-s3');
    await import('@aws-sdk/s3-request-presigner');
    awsInstalled = true;
  } catch {}
  return NextResponse.json({
    enabled: isKycEnabled(),
    settings,
    env,
    awsInstalled,
  });
}


