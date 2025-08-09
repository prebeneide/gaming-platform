import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { FiUser } from "react-icons/fi";
import FriendRequestActions from "./FriendRequestActions";
import BackButton from "@/components/BackButton";
import AvatarPresence, { PresenceStatus } from "@/components/AvatarPresence";

function presenceFrom(lastActiveAt?: Date | null): PresenceStatus {
  if (!lastActiveAt) return "offline";
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff <= 5 * 60 * 1000) return "online"; // 5 min
  if (diff <= 2 * 60 * 60 * 1000) return "recent"; // 2 timer
  return "offline";
}

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view friend requests</h1>
          <Link href="/api/auth/signin" className="text-pink-500 hover:text-pink-400">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  // Hent innkommende forespørsler
  const incomingRequests = await prisma.friendRequest.findMany({
    where: {
      toId: session.user.id,
      status: "pending",
    },
    include: {
      from: {
        select: {
          id: true,
          username: true,
          displayName: true,
          image: true,
          lastActiveAt: true,
        },
      },
    },
  });

  // Hent utgående forespørsler
  const outgoingRequests = await prisma.friendRequest.findMany({
    where: {
      fromId: session.user.id,
      status: "pending",
    },
    include: {
      to: {
        select: {
          id: true,
          username: true,
          displayName: true,
          image: true,
          lastActiveAt: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center">Friend Requests</h1>

        {/* Innkommende forespørsler */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-pink-400">Incoming Requests</h2>
          {incomingRequests.length === 0 ? (
            <p className="text-gray-400">No incoming friend requests</p>
          ) : (
            <div className="grid gap-4">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-neutral-950 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border border-gray-800"
                >
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <AvatarPresence
                      src={request.from.image}
                      alt={request.from.username}
                      size={48}
                      status={presenceFrom(request.from.lastActiveAt)}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${request.from.username}`}
                        className="font-semibold hover:text-pink-400 block truncate"
                      >
                        {request.from.displayName || request.from.username}
                      </Link>
                      <div className="text-gray-400 text-sm truncate">@{request.from.username}</div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    <FriendRequestActions requestId={request.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Utgående forespørsler */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-pink-400">Outgoing Requests</h2>
          {outgoingRequests.length === 0 ? (
            <p className="text-gray-400">No outgoing friend requests</p>
          ) : (
            <div className="grid gap-4">
              {outgoingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-neutral-950 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border border-gray-800"
                >
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <AvatarPresence
                      src={request.to.image}
                      alt={request.to.username}
                      size={48}
                      status={presenceFrom(request.to.lastActiveAt)}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${request.to.username}`}
                        className="font-semibold hover:text-pink-400 block truncate"
                      >
                        {request.to.displayName || request.to.username}
                      </Link>
                      <div className="text-gray-400 text-sm truncate">@{request.to.username}</div>
                    </div>
                  </div>
                  <div className="text-gray-400 w-full sm:w-auto">Pending...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 