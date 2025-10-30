import { NextResponse } from 'next/server';
import { getKycSettings, isKycEnabled } from '@/lib/kycConfig';
import { getPresignedPutUrl } from '@/lib/s3';

export async function GET() {
  const settings = getKycSettings();
  if (settings.storage !== 's3') return NextResponse.json({ ok: false, reason: 'KYC_STORAGE is not s3' }, { status: 400 });
  try {
    const url = await getPresignedPutUrl(`kyc/_diag/test-${Date.now()}`, 'application/octet-stream', 120);
    return NextResponse.json({ ok: true, presigned: !!url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'presign failed' }, { status: 500 });
  }
}


