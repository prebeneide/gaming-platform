import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getClientIP, getGeolocationFromIP } from "@/lib/geolocation";
import { setUserLocation } from "@/lib/geofencing";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ip = getClientIP(req) || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    if (!ip) {
      return NextResponse.json({ error: "Could not determine IP" }, { status: 400 });
    }

    const geo = await getGeolocationFromIP(ip);
    if (!geo.countryCode) {
      return NextResponse.json({ error: "Unable to verify location from IP" }, { status: 400 });
    }

    await setUserLocation(user.id, geo.countryCode, ip, 'ip_geolocation', geo.region || null);

    return NextResponse.json({
      success: true,
      userId: user.id,
      country: geo.countryCode,
      region: geo.region || null,
    });
  } catch (err) {
    console.error("Admin set location from IP error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


