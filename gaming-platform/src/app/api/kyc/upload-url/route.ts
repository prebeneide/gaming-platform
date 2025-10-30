import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isKycEnabled, getKycSettings } from '@/lib/kycConfig';
import { getPresignedPutUrl } from '@/lib/s3';

export async function POST(req: NextRequest) {
  if (!isKycEnabled()) return NextResponse.json({ error: 'KYC disabled' }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { kycId, kind, contentType } = await req.json().catch(() => ({}));
  if (!kycId || !kind || !contentType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const settings = getKycSettings();
  if (settings.storage !== 's3') {
    return NextResponse.json({ error: 'S3 storage not enabled' }, { status: 400 });
  }
  const uuid = (global as any).crypto?.randomUUID ? (global as any).crypto.randomUUID() : Math.random().toString(36).slice(2);
  const key = `kyc/${session.user.id}/${kycId}/${kind}-${uuid}`;
  try {
    const url = await getPresignedPutUrl(key, contentType, 300);
    return NextResponse.json({ key, url, storageProvider: 's3' });
  } catch (e) {
    console.error('Presign error', e);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}


