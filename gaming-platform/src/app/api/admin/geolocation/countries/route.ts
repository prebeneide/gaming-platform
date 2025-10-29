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

    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { countryCode, countryName, minAge, restrictions } = body;

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

    console.log("Creating allowed country with data:", {
      countryCode: upperCountryCode,
      countryName,
      minAge: minAge || 18,
    });

    const country = await prisma.allowedCountry.create({
      data: {
        countryCode: upperCountryCode,
        countryName,
        minAge: minAge || 18,
        restrictions: restrictions ? JSON.parse(JSON.stringify(restrictions)) : null,
      },
    });

    console.log("Successfully created allowed country:", country);
    return NextResponse.json(country);
  } catch (error) {
    console.error("Error adding allowed country:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // More detailed error response
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}

