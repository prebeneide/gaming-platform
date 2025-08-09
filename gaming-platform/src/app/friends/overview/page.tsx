import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { FiUser } from "react-icons/fi";

export default async function FriendsOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view friends</h1>
          <Link href="/api/auth/signin" className="text-pink-500 hover:text-pink-400">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  const friendships = await prisma.friendRequest.findMany({
    where: {
      status: "accepted",
      OR: [{ fromId: session.user.id }, { toId: session.user.id }],
    },
    select: {
      from: { select: { id: true, username: true, displayName: true, image: true } },
      to: { select: { id: true, username: true, displayName: true, image: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const friends = friendships.map((fr) => (fr.from.id === session.user.id ? fr.to : fr.from));

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4"><BackButton /></div>
        <h1 className="text-3xl font-bold mb-6 text-center">Friends</h1>

        {friends.length === 0 ? (
          <div className="text-center text-gray-400">You have no friends yet</div>
        ) : (
          <ul className="grid gap-3">
            {friends.map((u) => (
              <li key={u.id} className="bg-neutral-950 rounded-lg p-3 sm:p-4 border border-gray-800">
                <Link href={`/profile/${u.username}`} className="flex items-center gap-3 sm:gap-4 hover:opacity-90 transition">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-neutral-950">
                      {u.image ? (
                        <Image src={u.image} alt={u.username} width={48} height={48} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiUser color="#9ca3af" size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.displayName || u.username}</div>
                    <div className="text-gray-400 text-sm truncate">@{u.username}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
} 