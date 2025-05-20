"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function EditProfilePage() {
  const [profileImage, setProfileImage] = useState("/default-avatar.svg");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [discord, setDiscord] = useState("");
  const [twitter, setTwitter] = useState("");
  const [twitch, setTwitch] = useState("");
  const [steam, setSteam] = useState("");
  const [psn, setPsn] = useState("");
  const [xbox, setXbox] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [challengeNotif, setChallengeNotif] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customGames, setCustomGames] = useState([
    { game: "", username: "" }
  ]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok && data.user) {
          setProfileImage(data.user.image || "/default-avatar.svg");
          setUsername(data.user.username || "");
          setDisplayName(data.user.displayName || "");
          setEmail(data.user.email || "");
          setBio(data.user.bio || "");
          setDiscord(data.user.discord || "");
          setTwitter(data.user.twitter || "");
          setTwitch(data.user.twitch || "");
          setSteam(data.user.steam || "");
          setPsn(data.user.psn || "");
          setXbox(data.user.xbox || "");
          if (data.user.customGames) {
            setCustomGames(data.user.customGames.length > 0 ? data.user.customGames : [{ game: "", username: "" }]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    }
    fetchUserData();
  }, []);

  const addGameRow = () => {
    if (customGames.length < 5) {
      setCustomGames([...customGames, { game: "", username: "" }]);
    }
  };

  const removeGameRow = (index: number) => {
    setCustomGames(customGames.filter((_, idx) => idx !== index));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImage,
          displayName,
          bio,
          discord,
          twitter,
          twitch,
          steam,
          psn,
          xbox,
          customGames,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Oppdater state hvis ønskelig, f.eks. setProfileImage(data.user.image)
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      alert("Update failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  }

  async function autoSaveProfileImage(newImage: string) {
    setProfileImage(newImage);
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImage: newImage,
          displayName,
          bio,
          discord,
          twitter,
          twitch,
          steam,
          psn,
          xbox,
          customGames,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      alert("Update failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          await autoSaveProfileImage(data.url);
        } else {
          alert(data.error || "Upload failed");
        }
      } catch (err) {
        alert("Upload failed");
      }
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-none md:w-11/12 lg:w-10/12 xl:w-9/12 mx-auto mb-4 flex justify-start">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-2 px-6 rounded-lg transition">
            ← Back to Dashboard
          </button>
        </Link>
      </div>
      <div className={
        "bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col gap-8 border border-gray-800 w-full max-w-none md:w-11/12 lg:w-10/12 xl:w-9/12 mx-auto"
      }>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
          Edit Profile
        </h1>
        {/* Profilbilde */}
        <section className="flex flex-col items-center gap-2">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full w-24 h-24 flex items-center justify-center">
            <div className="bg-gray-900 rounded-full w-22 h-22 flex items-center justify-center">
              <Image src={profileImage} alt="Profile" width={88} height={88} className="rounded-full object-cover w-22 h-22" />
            </div>
          </div>
          <label className="mt-2 cursor-pointer text-pink-400 hover:underline">
            Change profile picture
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          <button className="text-xs text-gray-400 hover:underline mt-1" onClick={() => autoSaveProfileImage("/default-avatar.svg")}>Use default avatar</button>
        </section>
        {/* Brukerinformasjon */}
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Username</label>
              <input value={username} disabled className="w-full rounded-lg bg-gray-800 text-gray-400 px-3 py-2 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm mb-1">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Email</label>
              <input value={email} disabled className="w-full rounded-lg bg-gray-800 text-gray-400 px-3 py-2 cursor-not-allowed" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" rows={2} />
            </div>
          </section>
          {/* Sosiale lenker */}
          <section>
            <h2 className="text-lg font-semibold mb-2 text-pink-400">Social Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-sm mb-1">Discord</label>
                <input placeholder="Discord" value={discord} onChange={e => setDiscord(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2" />
              </div>
              <div className="w-full">
                <label className="block text-sm mb-1">Twitter</label>
                <input placeholder="Twitter" value={twitter} onChange={e => setTwitter(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2" />
              </div>
              <div className="w-full">
                <label className="block text-sm mb-1">Twitch</label>
                <input placeholder="Twitch" value={twitch} onChange={e => setTwitch(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2" />
              </div>
              <div className="w-full">
                <label className="block text-sm mb-1">Steam</label>
                <input placeholder="Steam" value={steam} onChange={e => setSteam(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2" />
              </div>
              <div className="w-full">
                <label className="block text-sm mb-1">PlayStation Network</label>
                <input placeholder="PlayStation Network" value={psn} onChange={e => setPsn(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2" />
              </div>
              <div className="w-full">
                <label className="block text-sm mb-1">Xbox</label>
                <input placeholder="Xbox" value={xbox} onChange={e => setXbox(e.target.value)} className="w-full rounded-lg bg-gray-800 text-white px-3 py-2" />
              </div>
            </div>
          </section>
          {/* Custom Games */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-pink-400">Custom Games</h2>
              <button
                type="button"
                onClick={addGameRow}
                disabled={customGames.length >= 5}
                className="text-sm bg-pink-500 hover:bg-pink-600 text-white font-semibold py-1 px-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Game
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {customGames.map((row, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-center w-full">
                  <input
                    type="text"
                    placeholder="Custom Game"
                    value={row.game}
                    onChange={e => {
                      const updated = [...customGames];
                      updated[idx].game = e.target.value;
                      setCustomGames(updated);
                    }}
                    className="flex-1 min-w-0 w-full rounded-lg bg-gray-800 text-white px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={row.username}
                    onChange={e => {
                      const updated = [...customGames];
                      updated[idx].username = e.target.value;
                      setCustomGames(updated);
                    }}
                    className="flex-1 min-w-0 w-full rounded-lg bg-gray-800 text-white px-3 py-2"
                  />
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeGameRow(idx)}
                      className="text-red-400 hover:text-red-300 p-2"
                      aria-label="Remove game"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
          {/* Lagre-knapp */}
          <div className="flex justify-end mt-4">
            <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-8 rounded-lg transition disabled:opacity-50" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {success && <div className="text-green-400 text-center font-semibold">Profile updated!</div>}
        </form>
      </div>
    </main>
  );
} 