// Centralized match service for consistent data handling across the app
import { prisma } from "@/lib/prisma";

export interface MatchFilters {
  status?: string;
  gameName?: string;
  platform?: string;
  userId?: string;
}

export interface MatchData {
  id: string;
  name: string;
  gameName: string;
  gameMode: string;
  competitionType: string;
  competitionFormat: string;
  matchType?: string;
  platform: string;
  buyIn: number;
  totalPot: number;
  potentialWinnings: number;
  visibility: string;
  status: string;
  maxPlayers: number;
  currentPlayers: number;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
  scheduledAt?: string;
  creator: {
    id: string;
    username: string;
    displayName?: string;
    image?: string;
  };
  participants?: Array<{
    id: string;
    status: string;
    buyInPaid?: boolean;
    hasReportedResult?: boolean;
    reportedWinnerId?: string;
    reportedResult?: string;
    proofImageUrl?: string;
    proofUploadedAt?: string;
    user: {
      id: string;
      username: string;
      displayName?: string;
      image?: string;
    };
  }>;
  result?: {
    id: string;
    winnerId?: string;
    resultType: string;
    status: string;
    agreedBy: string[];
    disputedBy: string[];
    payoutAmount?: number;
    createdAt: string;
    completedAt?: string;
  };
}

// Base query for match data - used by all match endpoints
const getBaseMatchQuery = () => ({
  select: {
    id: true,
    name: true,
    gameName: true,
    gameMode: true,
    competitionType: true,
    competitionFormat: true,
    matchType: true,
    platform: true,
    buyIn: true,
    totalPot: true,
    potentialWinnings: true,
    visibility: true,
    status: true,
    maxPlayers: true,
    currentPlayers: true,
    mediaUrl: true,
    mediaType: true,
    createdAt: true,
    scheduledAt: true,
    creator: {
      select: {
        id: true,
        username: true,
        displayName: true,
        image: true,
      }
    },
    participants: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
      },
    },
    result: {
      select: {
        id: true,
        winnerId: true,
        resultType: true,
        status: true,
        agreedBy: true,
        disputedBy: true,
        payoutAmount: true,
        createdAt: true,
        completedAt: true,
      },
    },
  },
});

// Get all matches with optional filters
export async function getMatches(filters: MatchFilters = {}): Promise<MatchData[]> {
  try {
    const where: Record<string, any> = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.gameName) {
      where.gameName = filters.gameName;
    }
    
    if (filters.platform) {
      where.platform = filters.platform;
    }

    const matches = await prisma.match.findMany({
      where,
      ...getBaseMatchQuery(),
      orderBy: { createdAt: 'desc' },
    });

    return matches as MatchData[];
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
}

// Get matches for a specific user (creator or participant)
export async function getUserMatches(username: string): Promise<MatchData[]> {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get all matches where the user is either creator or participant
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          {
            participants: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      ...getBaseMatchQuery(),
      orderBy: { createdAt: 'desc' }
    });

    return matches as MatchData[];
  } catch (error) {
    console.error("Error fetching user matches:", error);
    throw error;
  }
}

// Get a single match by ID
export async function getMatchById(id: string): Promise<MatchData | null> {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
      ...getBaseMatchQuery(),
    });

    return match as MatchData | null;
  } catch (error) {
    console.error("Error fetching match by ID:", error);
    throw error;
  }
}
