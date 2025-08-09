import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserDashboard from "./UserDashboard";
import { getUserStats } from "@/lib/userStats";

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

  // Hent sosiale statistikk
  const [followersCount, followingCount, friendsCount] = await Promise.all([
    prisma.follower.count({
      where: { followingId: session.user.id }
    }),
    prisma.follower.count({
      where: { followerId: session.user.id }
    }),
    prisma.friendRequest.count({
      where: {
        OR: [
          { fromId: session.user.id, status: 'accepted' },
          { toId: session.user.id, status: 'accepted' }
        ]
      }
    })
  ]);
  if (!userDb) {
    redirect("/login");
  }

  // Get user statistics (will be calculated and cached if not exists)
  const userStats = await getUserStats(userDb.id);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <UserDashboard 
        user={userDb} 
        userStats={userStats} 
        socialStats={{
          followers: followersCount,
          following: followingCount,
          friends: friendsCount
        }}
      />
    </div>
  );
} 