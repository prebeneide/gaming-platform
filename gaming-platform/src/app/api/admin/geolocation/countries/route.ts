import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/geolocation/countries
 * Get all allowed and blocked countries
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedCountries = await prisma.allowedCountry.findMany({
      orderBy: { countryName: 'asc' },
    });

    const blockedCountries = await prisma.blockedCountry.findMany({
      orderBy: { countryName: 'asc' },
    });

    return NextResponse.json({
      allowed: allowedCountries,
      blocked: blockedCountries,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/geolocation/countries/allowed
 * Add an allowed country
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { countryCode, countryName, minAge, restrictions } = await req.json();

    if (!countryCode || !countryName) {
      return NextResponse.json(
        { error: "countryCode and countryName are required" },
        { status: 400 }
      );
    }

    // Ensure country code is uppercase
    const upperCountryCode = countryCode.toUpperCase();

    // Check if it already exists
    const existing = await prisma.allowedCountry.findUnique({
      where: { countryCode: upperCountryCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Country already exists" },
        { status: 409 }
      );
    }

    const country = await prisma.allowedCountry.create({
      data: {
        countryCode: upperCountryCode,
        countryName,
        minAge: minAge || 18,
        restrictions: restrictions || null,
      },
    });

    return NextResponse.json(country);
  } catch (error) {
    console.error("Error adding allowed country:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

