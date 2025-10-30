import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isKycEnabled } from '@/lib/kycConfig';
import { logActivity, ActivityTypes } from '@/lib/activityLogger';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isKycEnabled()) return NextResponse.json({ error: 'KYC disabled' }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const item = await prisma.kycVerification.findUnique({ where: { id }, include: { evidences: true, user: { select: { id: true, username: true, email: true, displayName: true } } } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isKycEnabled()) return NextResponse.json({ error: 'KYC disabled' }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const { action, reason } = await req.json(); // action: 'approve' | 'reject'
  const verification = await prisma.kycVerification.findUnique({ where: { id } });
  if (!verification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (verification.status !== 'pending') return NextResponse.json({ error: 'Already decided' }, { status: 400 });
  const status = action === 'approve' ? 'approved' : 'rejected';
  const updated = await prisma.kycVerification.update({
    where: { id },
    data: { status, reason: reason || null, reviewerId: session.user.id, decidedAt: new Date() }
  });
  await logActivity({
    userId: verification.userId,
    action: status === 'approved' ? ActivityTypes.KYC_APPROVED : ActivityTypes.KYC_REJECTED,
    entityType: 'KycVerification',
    entityId: id,
    details: { reviewerId: session.user.id, reason: reason || undefined },
  });
  return NextResponse.json({ item: updated });
}


