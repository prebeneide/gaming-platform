import { NextResponse } from 'next/server';
import { getKycSettings, isKycEnabled } from '@/lib/kycConfig';

export async function GET() {
  const settings = getKycSettings();
  return NextResponse.json({ enabled: isKycEnabled(), settings });
}


