import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Følg en bruker
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { username } = await req.json();
  const followerId = session.user.id;
  const followingUser = await prisma.user.findUnique({ where: { username } });
  if (!followingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (followingUser.id === followerId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }
  // Opprett Follower-relasjon hvis den ikke finnes
  await prisma.follower.upsert({
    where: {
      followerId_followingId: {
        followerId,
        followingId: followingUser.id,
      },
    },
    update: {},
    create: {
      followerId,
      followingId: followingUser.id,
    },
  });
  return NextResponse.json({ success: true });
}

// Avfølg en bruker
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { username } = await req.json();
  const followerId = session.user.id;
  const followingUser = await prisma.user.findUnique({ where: { username } });
  if (!followingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  await prisma.follower.deleteMany({
    where: {
      followerId,
      followingId: followingUser.id,
    },
  });
  return NextResponse.json({ success: true });
} 