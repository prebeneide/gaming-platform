import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import FriendRequestActions from "./FriendRequestActions";

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
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
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
                  className="bg-gray-900 rounded-lg p-4 flex items-center justify-between border border-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full">
                      <Image
                        src={request.from.image || "/default-avatar.svg"}
                        alt={request.from.username}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/profile/${request.from.username}`}
                        className="font-semibold hover:text-pink-400"
                      >
                        {request.from.displayName || request.from.username}
                      </Link>
                      <div className="text-gray-400">@{request.from.username}</div>
                    </div>
                  </div>
                  <FriendRequestActions requestId={request.id} />
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
                  className="bg-gray-900 rounded-lg p-4 flex items-center justify-between border border-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full">
                      <Image
                        src={request.to.image || "/default-avatar.svg"}
                        alt={request.to.username}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/profile/${request.to.username}`}
                        className="font-semibold hover:text-pink-400"
                      >
                        {request.to.displayName || request.to.username}
                      </Link>
                      <div className="text-gray-400">@{request.to.username}</div>
                    </div>
                  </div>
                  <div className="text-gray-400">Pending...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 