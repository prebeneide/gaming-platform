import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getClientIP, getCountryFromIP, getGeolocationFromIP } from "@/lib/geolocation";
import { checkCountryAllowed, setUserLocation } from "@/lib/geofencing";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/geolocation/check
 * Check user's geographic location and update restriction
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIP = getClientIP(req) || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    
    if (!clientIP) {
      return NextResponse.json({ 
        error: "Could not determine IP address",
        isAllowed: false 
      }, { status: 400 });
    }

    // Get full geolocation data from IP (country + region/state)
    const geoData = await getGeolocationFromIP(clientIP);
    
    if (!geoData.countryCode) {
      return NextResponse.json({ 
        error: "Could not determine country from IP",
        isAllowed: false 
      }, { status: 400 });
    }

    // Check if country/region is allowed
    const countryCheck = await checkCountryAllowed(geoData.countryCode, geoData.region || null);

    // Update user's geographic restriction record
    await setUserLocation(
      session.user.id,
      geoData.countryCode,
      clientIP,
      'ip_geolocation',
      geoData.region || null
    );

    return NextResponse.json({
      country: geoData.countryCode,
      countryName: geoData.countryName,
      region: geoData.region || null,
      regionName: geoData.regionName || null,
      isAllowed: countryCheck.isAllowed,
      restrictionLevel: countryCheck.restrictionLevel,
      reason: countryCheck.reason,
    });
  } catch (error) {
    console.error("Error checking geolocation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

