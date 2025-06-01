"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // e-post eller brukernavn
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email/username or password");
      } else {
        router.push("/dashboard"); // Redirect til dashboard etter innlogging
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <Link href="/" className="flex items-center gap-2">
            <span className="logo-animated-gradient text-3xl font-bold bg-clip-text text-transparent select-none">
              GameChallenger
            </span>
          </Link>
          <form
            onSubmit={handleSubmit}
            className="bg-neutral-950 p-8 rounded-xl shadow-xl w-full flex flex-col gap-6"
          >
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
              Log in to your account
            </h1>
            {error && <div className="text-red-500 text-center">{error}</div>}
            <input
              type="text"
              placeholder="Email or Username"
              className="px-4 py-3 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="px-4 py-3 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 rounded-lg mt-2 hover:opacity-90 transition"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
            <div className="text-center text-gray-400 text-sm mt-2">
              Don't have an account? <a href="/signup" className="text-pink-400 hover:underline">Sign up</a>
            </div>
          </form>
        </div>
      </div>
      <style jsx>{`
        .logo-animated-gradient {
          background: linear-gradient(90deg, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb);
          background-size: 1000% 100%;
          animation: borderGradientMove 32s linear infinite alternate;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
        }
        @keyframes borderGradientMove {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </div>
  );
} 