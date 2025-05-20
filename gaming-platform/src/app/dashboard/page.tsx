import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserDashboard from "./UserDashboard";

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <UserDashboard user={userDb} />
    </div>
  );
} 