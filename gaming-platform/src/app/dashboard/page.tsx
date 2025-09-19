import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserDashboard from "./UserDashboard";
import { getUnifiedUserStats } from "@/lib/unifiedStats";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  
  // Hent brukerdata direkte fra databasen for å få oppdatert info
  const userDb = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      image: true,
      displayName: true,
      bio: true,
      discord: true,
      twitter: true,
      twitch: true,
      steam: true,
      psn: true,
      xbox: true,
      customGames: true,
    },
  });

  if (!userDb) {
    redirect("/login");
  }

  // Get unified user statistics (calculated from Match table)
  const unifiedStats = await getUnifiedUserStats(userDb.id);

  // Get social statistics
  const followersCount = await prisma.follower.count({
    where: { followingId: userDb.id }
  });
  const followingCount = await prisma.follower.count({
    where: { followerId: userDb.id }
  });
  const friendsCount = await prisma.friendRequest.count({
    where: {
      OR: [
        { fromId: userDb.id, status: 'accepted' },
        { toId: userDb.id, status: 'accepted' }
      ]
    }
  });

  // Get friends data for Friends Online section
  const friendships = await prisma.friendRequest.findMany({
    where: { 
      status: "accepted", 
      OR: [{ fromId: userDb.id }, { toId: userDb.id }] 
    },
    select: {
      from: { 
        select: { 
          id: true, 
          username: true, 
          displayName: true, 
          image: true, 
          lastActiveAt: true 
        } 
      },
      to: { 
        select: { 
          id: true, 
          username: true, 
          displayName: true, 
          image: true, 
          lastActiveAt: true 
        } 
      },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10, // Limit to 10 friends for dashboard
  });

  // Process friends data
  const friends = friendships.map((fr) => {
    const other = fr.from.id === userDb.id ? fr.to : fr.from;
    const now = new Date();
    const lastActive = other.lastActiveAt ? new Date(other.lastActiveAt) : null;
    
    // Determine online status
    let status: "online" | "recent" | "offline" = "offline";
    if (lastActive) {
      const timeDiff = now.getTime() - lastActive.getTime();
      const minutesAgo = timeDiff / (1000 * 60);
      
      if (minutesAgo <= 5) {
        status = "online";
      } else if (minutesAgo <= 60) {
        status = "recent";
      }
    }

    return {
      id: other.id,
      name: other.displayName || other.username,
      username: other.username,
      image: other.image,
      status: status,
      lastActiveAt: lastActive,
    };
  });

  // Get recent matches for the user
  const recentMatches = await prisma.match.findMany({
    where: {
      participants: {
        some: {
          userId: userDb.id
        }
      },
      status: {
        in: ["completed", "cancelled"]
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              image: true
            }
          }
        }
      },
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          image: true
        }
      },
      result: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 3
  });

  // Transform recent matches data
  const transformedRecentMatches = recentMatches.map(match => {
    const userParticipant = match.participants.find(p => p.user.id === userDb.id);
    const opponentParticipant = match.participants.find(p => p.user.id !== userDb.id);
    
    // Determine result for the user
    let result = "Draw";
    if (match.result?.winnerId === userDb.id) {
      result = "Win";
    } else if (match.result?.winnerId && match.result.winnerId !== userDb.id) {
      result = "Loss";
    }

    return {
      id: match.id,
      game: match.gameName,
      result,
      platform: match.platform,
      buyIn: match.buyIn,
      prize: match.result?.winnerId === userDb.id ? match.buyIn * 1.8 : 0, // Winner gets 1.8x buy-in
      type: match.competitionFormat,
      createdAt: match.createdAt,
      opponent: opponentParticipant ? {
        username: opponentParticipant.user.username,
        displayName: opponentParticipant.user.displayName,
        image: opponentParticipant.user.image
      } : {
        username: match.creator.username,
        displayName: match.creator.displayName,
        image: match.creator.image
      }
    };
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <UserDashboard 
        user={userDb} 
        unifiedStats={unifiedStats}
        socialStats={{
          followers: followersCount,
          following: followingCount,
          friends: friendsCount
        }}
        friends={friends}
        recentMatches={transformedRecentMatches}
      />
    </div>
  );
} 