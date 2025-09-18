import { NextRequest, NextResponse } from "next/server";
import { getUserMatches } from "@/lib/matchService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const matches = await getUserMatches(username);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching user matches:", error);
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 