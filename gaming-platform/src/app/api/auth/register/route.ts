import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { rateLimit } from "@/lib/rate-limit";
import { logActivity, ActivityTypes } from "@/lib/activityLogger";

const prisma = new PrismaClient();

// Rate limiting: maks 5 registreringer per IP per time
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 time
  uniqueTokenPerInterval: 500
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(5, ip);

    const { email, username, password } = await req.json();

    // Validering
    if (!email || !username || !password) {
      return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // E-post validering
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Brukernavn validering
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
        { error: "Username must be between 3 and 20 characters" },
        { status: 400 }
      );
    }

    // Passord validering
    if (password.length < 8) {
      return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Sjekk om e-post eller brukernavn allerede eksisterer
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
        { error: "Email or username already exists" },
        { status: 400 }
      );
    }

    // Hash passord
    const hashedPassword = await bcrypt.hash(password, 12);

    // Opprett bruker
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const errMsg = (error instanceof Error) ? error.message : String(error);
    // Håndter rate limit feil
    if (errMsg.includes("rate limit")) {
      return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }
    // Returner mer detaljert feilmelding for debugging
    return NextResponse.json(

    // Log user registration
    await logActivity({
      userId: user.id,
      action: ActivityTypes.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
        username: user.username
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });
      { error: errMsg, details: JSON.stringify(error) },
      { status: 500 }
    );
  }
} 