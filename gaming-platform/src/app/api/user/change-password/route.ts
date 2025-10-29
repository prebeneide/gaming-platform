import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, currentPassword, newPassword, confirmPassword, isAdminAction } = await req.json();
    
    // Determine target user ID
    const targetUserId = userId || session.user.id;
    const isAdmin = session.user.role === "admin";
    const isChangingOwnPassword = targetUserId === session.user.id;
    
    // Admin can change any user's password without current password
    // Regular users must provide current password when changing their own
    if (isAdminAction && isAdmin) {
      // Admin changing another user's password
      if (!newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: "New password and confirmation are required" },
          { status: 400 }
        );
      }
    } else {
      // Regular user changing their own password
      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        );
      }
    }

    // Sjekk at nytt passord og bekreftelse matcher
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match" },
        { status: 400 }
      );
    }

    // Valider nytt passord
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user is trying to change another user's password without admin role
    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: You can only change your own password" },
        { status: 403 }
      );
    }

    // Hent bruker med passord
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, password: true, username: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verifiser gjeldende passord (only for regular users changing their own password)
    if (!isAdminAction || isChangingOwnPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
    }

    // Sjekk at nytt passord ikke er det samme som gammelt passord
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash nytt passord
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Oppdater passord
    await prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashedPassword },
    });

    // Log aktivitet
    await logActivity({
      userId: targetUserId,
      action: ActivityTypes.PASSWORD_CHANGED,
      entityType: "User",
      entityId: targetUserId,
      details: {
        passwordChanged: true,
        changedByAdmin: isAdmin && !isChangingOwnPassword,
        changedBy: isAdmin && !isChangingOwnPassword ? session.user.id : targetUserId,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

