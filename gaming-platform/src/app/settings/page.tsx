"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [challengeNotif, setChallengeNotif] = useState(true);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-2">
      <div className={
        "bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col gap-8 border border-gray-800 w-full max-w-none md:w-11/12 lg:w-10/12 xl:w-9/12 mx-auto"
      }>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        {/* Change Password */}
        <section>
          <h2 className="text-lg font-semibold mb-2 text-pink-400">Change Password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-lg bg-gray-800 text-white px-3 py-2" />
            <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-lg bg-gray-800 text-white px-3 py-2" />
          </div>
        </section>
        {/* Notifications */}
        <section>
          <h2 className="text-lg font-semibold mb-2 text-pink-400">Notifications</h2>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
              Receive newsletter
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={challengeNotif} onChange={e => setChallengeNotif(e.target.checked)} />
              Notify me about new challenges
            </label>
          </div>
        </section>
        {/* Delete Account */}
        <section className="mt-4 border-t border-gray-800 pt-4">
          <h2 className="text-lg font-semibold mb-2 text-red-400">Delete Account</h2>
          <p className="text-sm text-gray-400 mb-2">This action is irreversible. All your data will be lost.</p>
          <button type="button" className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition">Delete Account</button>
        </section>
      </div>
    </main>
  );
} 