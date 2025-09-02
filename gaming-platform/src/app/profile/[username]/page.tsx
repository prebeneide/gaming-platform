import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import FollowButton from "./FollowButton";
import FriendButton from "./FriendButton";
import UserStats from "../../dashboard/UserStats";
import SocialCounts from "@/components/SocialCounts";
import UserMatchFeed from "./UserMatchFeed";
import BackButton from "@/components/BackButton";
import { getUserStats } from "@/lib/userStats";
import UserAvatar from "@/components/UserAvatar";

function presenceFrom(lastActiveAt?: Date | null): PresenceStatus {
  if (!lastActiveAt) return "offline";
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff <= 5 * 60 * 1000) return "online";
  if (diff <= 2 * 60 * 60 * 1000) return "recent";
  return "offline";
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      image: true,
      discord: true,
      twitter: true,
      twitch: true,
      steam: true,
      psn: true,
      xbox: true,
      customGames: true,
      lastActiveAt: true,
      // Her kan jeg flere felter etter behov
    },
  });
  if (!user) {
    return <div className="text-center text-red-400 mt-20">User not found</div>;
  }

  // Get user statistics from cache
  const userStats = await getUserStats(user.id);

  // Hent antall følgere og følger
  const followersCount = await prisma.follower.count({ where: { following: { username } } });
  const followingCount = await prisma.follower.count({ where: { follower: { username } } });
  // Hent antall venner
  const friendsCount = await prisma.friendRequest.count({
    where: { status: "accepted", OR: [ { from: { username } }, { to: { username } } ] },
  });
  // Finn ut om innlogget bruker følger denne profilen
  let isFollowing = false;
  let isOwnProfile = false;
  let sessionUser: any = null;
  let isFriend = false;
  try {
    const session = await getServerSession(authOptions);
    sessionUser = session?.user;
    if (sessionUser && sessionUser.username !== username && user?.id) {
      const follow = await prisma.follower.findUnique({
        where: { followerId_followingId: { followerId: sessionUser.id, followingId: user.id } },
      });
      isFollowing = !!follow;
    }
    if (sessionUser && sessionUser.username === username) {
      isOwnProfile = true;
    }
    if (sessionUser && user?.id) {
      const friendRequest = await prisma.friendRequest.findFirst({
        where: { status: "accepted", OR: [ { fromId: sessionUser.id, toId: user.id }, { fromId: user.id, toId: sessionUser.id } ] },
      });
      isFriend = !!friendRequest;
    }
  } catch {}
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-2">
      {/* Back Button */}
      <div className="w-full max-w-lg mx-auto mb-4">
        <BackButton />
      </div>
      <div className="bg-neutral-950 rounded-2xl shadow-xl p-8 flex flex-col gap-8 w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar 
            user={{
              image: user.image,
              username: user.username,
              displayName: user.displayName
            }}
            size={88}
            ring={true}
            showPresence={true}
            presenceStatus={presenceFrom(user.lastActiveAt)}
          />
          <h1 className="text-2xl font-bold mt-2">{user.displayName || user.username}</h1>
          <div className="text-gray-400">@{user.username}</div>
        </div>
        {user.bio && <div className="text-center text-lg text-gray-300">{user.bio}</div>}
        <div>
          {/* Social counts (clickable) */}
          <SocialCounts username={user.username} counts={{ followers: followersCount, following: followingCount, friends: friendsCount }} />
        </div>
        {/* Brukerstatistikk (samme som dashboard) */}
        <UserStats
          stats={{ matchesPlayed: userStats.matchesPlayed, wins: userStats.wins, losses: userStats.losses, draws: userStats.draws, rank: userStats.rank }}
          winPercent={userStats.winPercent}
          winLossRatio={userStats.winLossRatio}
          last10={userStats.last10Results}
        />
        {/* Social Links nederst, vises kun hvis minst én link finnes */}
        {(user.discord || user.twitter || user.twitch || user.steam || user.psn || user.xbox) && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2 text-pink-400">Social Links</h2>
            <ul className="flex flex-col gap-1">
              {user.discord && <li><b>Discord:</b> {user.discord}</li>}
              {user.twitter && <li><b>Twitter:</b> {user.twitter}</li>}
              {user.twitch && <li><b>Twitch:</b> {user.twitch}</li>}
              {user.steam && <li><b>Steam:</b> {user.steam}</li>}
              {user.psn && <li><b>PlayStation Network:</b> {user.psn}</li>}
              {user.xbox && <li><b>Xbox:</b> {user.xbox}</li>}
            </ul>
          </div>
        )}
        {/* Custom Games */}
        {user.customGames && Array.isArray(user.customGames) && user.customGames.length > 0 && user.customGames.some((g: any) => g.game || g.username) && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-pink-400">Custom Games</h2>
            <ul className="flex flex-col gap-1">
              {user.customGames.map((g: any, idx: number) => ((g.game || g.username) ? <li key={idx}><b>{g.game}:</b> {g.username}</li> : null))}
            </ul>
          </div>
        )}
      </div>
      {/* User Match Feed */}
      <div className="mt-8 w-full max-w-6xl">
        <UserMatchFeed username={username} />
      </div>
    </main>
  );
} 