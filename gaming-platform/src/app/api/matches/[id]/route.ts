import { NextRequest, NextResponse } from "next/server";
import { getMatchById } from "@/lib/matchService";

// GET /api/matches/[id] - Get a single match by id
export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  try {
    const match = await getMatchById(params.id);
    
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Get match by id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 