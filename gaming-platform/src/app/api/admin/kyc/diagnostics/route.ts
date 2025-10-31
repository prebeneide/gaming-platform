import { NextResponse } from 'next/server';
import { getKycSettings, isKycEnabled } from '@/lib/kycConfig';
import * as fs from 'fs';
import * as path from 'path';

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

  // Debug: Check if .env.local exists and what it contains (safe - only read first few lines to avoid secrets)
  let envFileInfo = null;
  try {
    const projectRoot = process.cwd();
    const envPath = path.join(projectRoot, '.env.local');
    const exists = fs.existsSync(envPath);
    if (exists) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n').slice(0, 10); // First 10 lines only
      envFileInfo = {
        exists: true,
        path: envPath,
        cwd: projectRoot,
        preview: lines.filter(l => l.includes('FEATURE_KYC') || l.includes('KYC_PROVIDER') || l.includes('KYC_STORAGE')).slice(0, 5),
      };
    } else {
      envFileInfo = {
        exists: false,
        expectedPath: envPath,
        cwd: projectRoot,
      };
    }
  } catch (e: any) {
    envFileInfo = { error: e?.message || 'Could not check file' };
  }

  const body = {
    enabled: isKycEnabled(),
    settings,
    env,
    awsInstalled,
    serverTime: new Date().toISOString(),
    pid: process.pid,
    uptimeSec: Math.floor(process.uptime()),
    envFileInfo,
  };

  return new NextResponse(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}


