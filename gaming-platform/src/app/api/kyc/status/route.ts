import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getKycSettings } from '@/lib/kycConfig';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { enabled } = getKycSettings();
  const verification = await prisma.kycVerification.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { evidences: true },
  });
  return NextResponse.json({ enabled, verification });
}


