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

    const friends = await prisma.friendRequest.findMany({
      where: {
        status: "accepted",
        OR: [{ fromId: user.id }, { toId: user.id }],
      },
      select: {
        from: { select: { id: true, username: true, displayName: true, image: true } },
        to: { select: { id: true, username: true, displayName: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const users = friends.map(fr => (fr.from.id === user.id ? fr.to : fr.from));
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ users: [] }, { status: 200 });
  }
} 