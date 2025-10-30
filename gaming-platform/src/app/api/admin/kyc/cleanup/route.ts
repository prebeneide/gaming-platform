import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { deleteObject } from '@/lib/s3';
import { getKycSettings, isKycEnabled, isKycReviewer } from '@/lib/kycConfig';

export async function POST(req: NextRequest) {
  if (!isKycEnabled()) return NextResponse.json({ cleaned: 0 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isKycReviewer({ role: session.user.role, email: session.user.email })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { retentionDays } = getKycSettings();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // Delete evidences whose parent verification was decided before cutoff, or evidence older than cutoff
  const decided = await prisma.kycVerification.findMany({
    where: {
      decidedAt: { lt: cutoff },
    },
    select: { id: true }
  });
  const decidedIds = decided.map(d => d.id);

  const evidences = await prisma.kycEvidence.findMany({
    where: {
      OR: [
        { kycId: { in: decidedIds } },
        { createdAt: { lt: cutoff } }
      ]
    }
  });

  let cleaned = 0;
  for (const ev of evidences) {
    try {
      if (ev.storageProvider === 's3') {
        await deleteObject(ev.storageKey);
      }
      await prisma.kycEvidence.delete({ where: { id: ev.id } });
      cleaned++;
    } catch (e) {
      console.warn('Failed to delete evidence', ev.id, e);
    }
  }

  return NextResponse.json({ cleaned, retentionDays });
}


