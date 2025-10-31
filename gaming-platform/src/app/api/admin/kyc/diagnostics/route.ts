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
      const allLines = content.split('\n');
      // Show lines that contain KYC-related vars, or first 20 lines if none found
      const kycLines = allLines.filter(l => 
        l.trim().toUpperCase().startsWith('FEATURE_KYC') || 
        l.trim().toUpperCase().startsWith('KYC_PROVIDER') || 
        l.trim().toUpperCase().startsWith('KYC_STORAGE') ||
        l.trim().toUpperCase().startsWith('S3_BUCKET') ||
        l.trim().toUpperCase().startsWith('S3_REGION')
      );
      const previewLines = kycLines.length > 0 ? kycLines : allLines.slice(0, 20);
      
      // Also check for common formatting issues
      const featureKycLine = allLines.find(l => l.trim().toUpperCase().startsWith('FEATURE_KYC'));
      let formatIssue = null;
      if (featureKycLine) {
        const trimmed = featureKycLine.trim();
        if (trimmed.includes('"') || trimmed.includes("'")) {
          formatIssue = 'Contains quotes (remove quotes)';
        } else if (!trimmed.includes('=')) {
          formatIssue = 'Missing equals sign';
        } else {
          const parts = trimmed.split('=');
          if (parts.length > 1 && parts[1].trim() !== 'true') {
            formatIssue = `Value is "${parts[1].trim()}" but should be "true" (no quotes)`;
          }
        }
      }
      
      envFileInfo = {
        exists: true,
        path: envPath,
        cwd: projectRoot,
        preview: previewLines,
        featureKycRaw: featureKycLine?.trim() || null,
        formatIssue,
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


