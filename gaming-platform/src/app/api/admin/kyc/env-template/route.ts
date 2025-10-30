import { NextResponse } from 'next/server';

export async function GET() {
  const bucket = process.env.S3_BUCKET || 'din-s3-bucket';
  const region = process.env.S3_REGION || 'eu-north-1';
  const access = process.env.S3_ACCESS_KEY_ID ? '***SET***' : 'DIN_AWS_ACCESS_KEY';
  const secret = process.env.S3_SECRET_ACCESS_KEY ? '***SET***' : 'DIN_AWS_SECRET';
  const tmpl = `# KYC feature flag\nFEATURE_KYC=true\nKYC_PROVIDER=manual\n\n# Lagring (anbefalt S3)\nKYC_STORAGE=s3\nS3_BUCKET=${bucket}\nS3_REGION=${region}\nS3_ACCESS_KEY_ID=${access}\nS3_SECRET_ACCESS_KEY=${secret}\n\n# Retensjon (antall dager før bevis slettes)\nKYC_RETENTION_DAYS=${process.env.KYC_RETENTION_DAYS || 30}\n\n# (Valgfritt) KYC-reviewer-tilgang uten full admin\nKYC_REVIEWER_EMAILS=${process.env.KYC_REVIEWER_EMAILS || 'din_admin@domene.no'}\n`;
  return NextResponse.json({ template: tmpl });
}


