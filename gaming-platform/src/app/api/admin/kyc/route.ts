import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isKycEnabled } from '@/lib/kycConfig';

export async function GET(req: NextRequest) {
  if (!isKycEnabled()) return NextResponse.json({ items: [] });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await prisma.kycVerification.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, username: true, email: true, displayName: true, image: true } }, evidences: true },
  } as any);
  return NextResponse.json({ items });
}


