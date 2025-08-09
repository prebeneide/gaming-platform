import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import FriendsList, { FriendUser } from "./FriendsList";

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
    where: { status: "accepted", OR: [{ fromId: session.user.id }, { toId: session.user.id }] },
    select: {
      from: { select: { id: true, username: true, displayName: true, image: true } },
      to: { select: { id: true, username: true, displayName: true, image: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const friends: FriendUser[] = friendships.map((fr) => (fr.from.id === session.user.id ? fr.to : fr.from));

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4"><BackButton /></div>
        <h1 className="text-3xl font-bold mb-4 text-center">Friends</h1>
        <FriendsList users={friends} />
      </div>
    </main>
  );
} 