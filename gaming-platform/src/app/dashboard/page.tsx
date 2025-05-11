import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import UserDashboard from "./UserDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  // Sikre at props alltid er string
  const user = {
    email: session.user.email ?? "",
    username: session.user.username ?? "",
    id: session.user.id ?? "",
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <UserDashboard user={user} />
    </div>
  );
} 