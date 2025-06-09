"use client";
import { useState } from "react";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSuccess(true);
        setEmail("");
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      setError("Server error");
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
          Create your account
        </h1>
        {error && <div className="text-red-500 text-center">{error}</div>}
        {success && (
          <div className="text-green-500 text-center">Account created! You can now log in.</div>
        )}
        <input
          type="email"
          placeholder="Email"
              className="px-4 py-3 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Username"
              className="px-4 py-3 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          value={username}
          onChange={e => setUsername(e.target.value)}
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <div className="text-center text-gray-400 text-sm mt-2">
          Already have an account? <a href="/login" className="text-pink-400 hover:underline">Log in</a>
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