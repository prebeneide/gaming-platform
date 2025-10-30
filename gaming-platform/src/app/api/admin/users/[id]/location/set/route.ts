import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { setUserLocation } from "@/lib/geofencing";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const countryCode = (body.countryCode || "").toString().trim().toUpperCase();
    const region = (body.region || "").toString().trim().toUpperCase() || null;

    if (!countryCode || countryCode.length !== 2) {
      return NextResponse.json({ error: "Invalid country code (expected 2-letter ISO)" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await setUserLocation(user.id, countryCode, null, 'admin_override', region);

    return NextResponse.json({ success: true, userId: user.id, country: countryCode, region });
  } catch (err) {
    console.error("Admin set location error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


