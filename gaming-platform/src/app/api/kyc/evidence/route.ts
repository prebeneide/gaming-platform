import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isKycEnabled, getKycSettings } from '@/lib/kycConfig';

export async function POST(req: NextRequest) {
  if (!isKycEnabled()) return NextResponse.json({ error: 'KYC disabled' }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { kycId, kind, storageKey, storageProvider } = await req.json();
  if (!kycId || !kind || !storageKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const verification = await prisma.kycVerification.findUnique({ where: { id: kycId } });
  if (!verification || verification.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (verification.status !== 'pending') return NextResponse.json({ error: 'Verification not pending' }, { status: 400 });
  const settings = getKycSettings();
  const evidence = await prisma.kycEvidence.create({
    data: {
      kycId,
      kind,
      storageKey,
      storageProvider: storageProvider || settings.storage,
    }
  });
  return NextResponse.json({ evidence });
}


