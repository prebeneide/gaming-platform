import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        displayName: true,
        bio: true,
        discord: true,
        twitter: true,
        twitch: true,
        steam: true,
        psn: true,
        xbox: true,
        customGames: true,
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("SESSION:", session);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const userId = session.user.id;
  const data = await req.json();
  console.log("USER ID:", userId);
  console.log("DATA:", data);
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        image: data.profileImage,
        displayName: data.displayName,
        bio: data.bio,
        discord: data.discord,
        twitter: data.twitter,
        twitch: data.twitch,
        steam: data.steam,
        psn: data.psn,
        xbox: data.xbox,
        customGames: data.customGames,
      },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
        displayName: true,
        bio: true,
        discord: true,
        twitter: true,
        twitch: true,
        steam: true,
        psn: true,
        xbox: true,
        customGames: true,
      },
    });
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error?.message || JSON.stringify(error) || 'Update failed' }, { status: 500 });
  }
} 