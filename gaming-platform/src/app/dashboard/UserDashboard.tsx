"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UserDashboard({ user }: { user: { email: string; username: string; id: string } }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="bg-gray-900 p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col gap-6 border border-gray-800">
      <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
        Welcome, {user.username || user.email}!
      </h1>
      <div className="text-lg text-gray-300 text-center">
        <div><b>Email:</b> {user.email}</div>
        <div><b>Username:</b> {user.username}</div>
        <div><b>User ID:</b> {user.id}</div>
      </div>
      <div className="text-center mt-4">
        <button
          onClick={handleSignOut}
          className="text-pink-400 hover:underline"
        >
          Log out
        </button>
      </div>
    </div>
  );
} 