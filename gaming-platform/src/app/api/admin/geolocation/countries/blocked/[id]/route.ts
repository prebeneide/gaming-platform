import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/geolocation/countries/blocked/[id]
 * Update blocked country (activate/deactivate or update)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { isActive, reason } = await req.json();

    const country = await prisma.blockedCountry.update({
      where: { id: resolvedParams.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(reason !== undefined && { reason }),
      },
    });

    return NextResponse.json(country);
  } catch (error) {
    console.error("Error updating blocked country:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/geolocation/countries/blocked/[id]
 * Delete blocked country
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    await prisma.blockedCountry.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blocked country:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

