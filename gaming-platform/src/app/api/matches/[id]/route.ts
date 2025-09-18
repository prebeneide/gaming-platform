import { NextRequest, NextResponse } from "next/server";
import { getMatchById } from "@/lib/matchService";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/matches/[id] - Get a single match by id
export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  try {
    const match = await getMatchById(params.id);
    
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check access permissions for private matches
    if (match.visibility !== "public") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Check if user is creator, participant, or friend (for friends/invite matches)
      const isCreator = match.creator.id === session.user.id;
      const isParticipant = match.participants?.some(p => p.user.id === session.user.id) || false;
      
      if (!isCreator && !isParticipant) {
        // For friends and invite-only matches, check if user is friends with creator
        const friendship = await prisma.friendRequest.findFirst({
          where: {
            status: "accepted",
            OR: [
              { fromId: match.creator.id, toId: session.user.id },
              { fromId: session.user.id, toId: match.creator.id }
            ]
          }
        });
        
        if (!friendship) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Get match by id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 