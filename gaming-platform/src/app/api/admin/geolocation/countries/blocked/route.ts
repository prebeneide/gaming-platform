import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/geolocation/countries/blocked
 * Add a blocked country
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { countryCode, countryName, reason } = await req.json();

    if (!countryCode || !countryName) {
      return NextResponse.json(
        { error: "countryCode and countryName are required" },
        { status: 400 }
      );
    }

    // Ensure country code is uppercase
    const upperCountryCode = countryCode.toUpperCase();

    // Check if it already exists
    const existing = await prisma.blockedCountry.findUnique({
      where: { countryCode: upperCountryCode },
    });

    if (existing) {
      // Update if exists
      const country = await prisma.blockedCountry.update({
        where: { countryCode: upperCountryCode },
        data: {
          countryName,
          reason,
          isActive: true,
        },
      });
      return NextResponse.json(country);
    }

    const country = await prisma.blockedCountry.create({
      data: {
        countryCode: upperCountryCode,
        countryName,
        reason,
      },
    });

    return NextResponse.json(country);
  } catch (error) {
    console.error("Error adding blocked country:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

