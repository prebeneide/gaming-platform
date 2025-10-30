import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getKycSettings, isKycEnabled } from '@/lib/kycConfig';

export async function POST(req: NextRequest) {
  if (!isKycEnabled()) return NextResponse.json({ error: 'KYC disabled' }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { dob, country } = await req.json().catch(() => ({ }));
  const settings = getKycSettings();
  const verification = await prisma.kycVerification.create({
    data: {
      userId: session.user.id,
      status: 'pending',
      provider: settings.provider,
      dob: dob ? new Date(dob) : null,
      country: country || null,
    }
  });
  return NextResponse.json({ verification });
}


