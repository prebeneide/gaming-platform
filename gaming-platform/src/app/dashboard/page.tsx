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
      />
    </div>
  );
} 