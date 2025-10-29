import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the first admin user (you can change this logic if needed)
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { id: true, username: true, email: true }
    });

    if (!admin) {
      return NextResponse.json({ error: "No admin found" }, { status: 404 });
    }

    return NextResponse.json({ adminId: admin.id, username: admin.username });

  } catch (error) {
    console.error("Error fetching admin ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
