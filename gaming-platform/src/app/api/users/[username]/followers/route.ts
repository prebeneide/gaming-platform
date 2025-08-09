import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  try {
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) return NextResponse.json({ users: [] });

    const followers = await prisma.follower.findMany({
      where: { followingId: user.id },
      select: { follower: { select: { id: true, username: true, displayName: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users: followers.map(f => f.follower) });
  } catch (e) {
    return NextResponse.json({ users: [] }, { status: 200 });
  }
} 