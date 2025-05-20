import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import FollowButton from "./FollowButton";
import FriendButton from "./FriendButton";

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
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
      // Her kan jeg flere felter etter behov
    },
  });
  if (!user) {
    return <div className="text-center text-red-400 mt-20">User not found</div>;
  }
  // Hent antall følgere og følger
  const followersCount = await prisma.follower.count({ where: { following: { username: params.username } } });
  const followingCount = await prisma.follower.count({ where: { follower: { username: params.username } } });
  // Hent antall venner (aksepterte venneforespørsler der denne brukeren er involvert)
  const friendsCount = await prisma.friendRequest.count({
    where: {
      status: "accepted",
      OR: [
        { from: { username: params.username } },
        { to: { username: params.username } },
      ],
    },
  });
  // Finn ut om innlogget bruker følger denne profilen
  let isFollowing = false;
  let isOwnProfile = false;
  let sessionUser: any = null;
  let isFriend = false;
  try {
    const session = await getServerSession(authOptions);
    sessionUser = session?.user;
    if (sessionUser && sessionUser.username !== params.username && user?.id) {
      const follow = await prisma.follower.findUnique({
        where: {
          followerId_followingId: {
            followerId: sessionUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }
    if (sessionUser && sessionUser.username === params.username) {
      isOwnProfile = true;
    }
    if (sessionUser && user?.id) {
      const friendRequest = await prisma.friendRequest.findFirst({
        where: {
          status: "accepted",
          OR: [
            { fromId: sessionUser.id, toId: user.id },
            { fromId: user.id, toId: sessionUser.id },
          ],
        },
      });
      isFriend = !!friendRequest;
    }
  } catch {}
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-2">
      <div className="bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col gap-8 border border-gray-800 w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full w-24 h-24 flex items-center justify-center">
            <div className="bg-gray-900 rounded-full w-22 h-22 flex items-center justify-center">
              <Image src={user.image || "/default-avatar.svg"} alt="Profile" width={88} height={88} className="rounded-full object-cover w-22 h-22" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mt-2">{user.displayName || user.username}</h1>
          <div className="text-gray-400">@{user.username}</div>
        </div>
        {user.bio && <div className="text-center text-lg text-gray-300">{user.bio}</div>}
        <div>
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
        {user.customGames && Array.isArray(user.customGames) && user.customGames.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2 text-pink-400">Custom Games</h2>
            <ul className="flex flex-col gap-1">
              {user.customGames.map((g: any, idx: number) => (
                <li key={idx}><b>{g.game}:</b> {g.username}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-center gap-8 text-lg text-pink-300 font-semibold">
          <div><span className="text-white">{followersCount}</span> Followers</div>
          <div><span className="text-white">{followingCount}</span> Following</div>
          <div><span className="text-white">{friendsCount}</span> Friends</div>
        </div>
        {!isOwnProfile && sessionUser && (
          <div className="flex gap-4 justify-center">
            <FollowButton
              isFollowing={isFollowing}
              username={params.username}
              isOwnProfile={isOwnProfile}
            />
            <FriendButton
              username={params.username}
              isOwnProfile={isOwnProfile}
              isFriend={isFriend}
            />
          </div>
        )}
        {/* Her kan jeg legge til stats, matcher, venneliste osv. */}
      </div>
    </main>
  );
} 