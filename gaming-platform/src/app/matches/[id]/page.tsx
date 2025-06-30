"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";

const gameImages: Record<string, string> = {
  "FC25": "/Images/FC25/98678603c00b2f99573ac233ce0e1780.jpg",
  "Fortnite": "/Images/Fortnite/c3c2a2242cc7e196f639bd78bc8bacfa.jpg",
  "Rocket League": "/Images/RocketLeague/d37e92eaeab39c4e1cb20495cb903bb7.jpg",
  "COD:MW2": "/Images/COD-ModernWarfare2/aa11186dc69287ff7192992845d8585b.jpg",
  "COD:MW3": "/Images/COD-ModernWarfare3/b248a47671cc9b3d3f7c1fdd23a0a8a5.jpg",
  "Apex Legends": "/Images/ApexLegends/45e8fbf182fa6f0e180a02793180f91e.jpg",
  "Battlefield V": "/Images/BattlefieldV/battlefield-5-pc-game-ea-app-cover.jpg",
  "Battlefield 2042": "/Images/Battlefield2042/Battlefield_2042_cover_art.jpg",
  "COD: Black Ops 6": "/Images/COD-BlackOps6/BO6_KA_SECONDARY_240724_16x9_Trio_B.jpg",
};

interface Participant {
  id: string;
  status: string;
  buyInPaid?: boolean;
  user: {
    id: string;
    username: string;
    displayName?: string;
    image?: string;
  };
}

interface Match {
  id: string;
  name: string;
  gameName: string;
  gameMode: string;
  competitionType: string;
  competitionFormat: string;
  matchType?: string;
  platform: string;
  buyIn: number;
  totalPot: number;
  potentialWinnings: number;
  visibility: string;
  status: string;
  maxPlayers: number;
  currentPlayers: number;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName?: string;
    image?: string;
  };
  participants: Participant[];
}

// Helper to ensure Cloudinary videos use f_auto,vc_auto for max compatibility
function getCloudinaryVideoUrl(url: string) {
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/f_auto,vc_auto/');
}

export default function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { showPopup } = usePopup();

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        const res = await fetch(`/api/matches/${id}`);
        const data = await res.json();
        setMatch(data.match || null);
      } catch (err) {
        setMatch(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMatch();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading match...</div>;
  if (!match) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500">Match not found.</div>;

  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";

  // Helper: Sjekk om bruker kan joine
  const canJoin = match &&
    match.status === "open" &&
    match.currentPlayers < match.maxPlayers &&
    userId &&
    !match.participants.some(p => p.user.id === userId);

  // Handler for join
  async function handleJoin() {
    if (!canJoin) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/matches/${id}/join`, { method: "POST" });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Join Match: Non-JSON response:", text);
        showPopup({ type: 'error', message: "Unexpected server response. Please try again or contact support." });
        return;
      }
      if (!res.ok) {
        showPopup({ type: 'error', message: data?.error || "Failed to join match" });
        return;
      }
      setMatch(data.match);
      showPopup({ type: 'success', message: 'You have successfully joined the match!' });
    } catch (err: any) {
      showPopup({ type: 'error', message: err.message || "Failed to join match" });
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden">
        {/* Creator info */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-500 flex-shrink-0">
            <Image
              src={match.creator.image || "/Images/default-avatar.png"}
              alt={match.creator.displayName || match.creator.username}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="font-bold text-lg text-white">{match.creator.displayName || match.creator.username}</div>
            <div className="text-xs text-gray-400">Created {new Date(match.createdAt).toLocaleString()}</div>
          </div>
        </div>
        {/* Media section */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {match.mediaUrl ? (
            match.mediaType === "video" ? (
              <video src={getCloudinaryVideoUrl(match.mediaUrl)} controls className="w-full h-full object-cover" />
            ) : (
              <Image src={match.mediaUrl} alt="Match media" fill className="object-cover" />
            )
          ) : (
            <Image src={gameImg} alt={match.gameName} fill className="object-cover opacity-80" />
          )}
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 rounded-lg px-3 py-1 text-xs font-bold text-pink-400">
            {match.gameName}
          </div>
        </div>
        {/* Match info */}
        <div className="p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-white">{match.name}</div>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-700 text-white uppercase">{match.status}</div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-gray-300">
            <span className="bg-neutral-800 rounded px-2 py-1">{match.gameMode}</span>
            <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionType}</span>
            <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionFormat}</span>
            {match.matchType && <span className="bg-neutral-800 rounded px-2 py-1">{match.matchType}</span>}
            <span className="bg-neutral-800 rounded px-2 py-1">{match.platform}</span>
            <span className="bg-neutral-800 rounded px-2 py-1">{match.visibility}</span>
          </div>
          <div className="flex items-center gap-6 mt-2">
            <div>
              <div className="text-pink-400 font-bold text-lg">${match.buyIn.toFixed(2)}</div>
              <div className="text-xs text-gray-400">Buy-in</div>
            </div>
            <div>
              <div className="text-yellow-400 font-bold text-lg">${match.potentialWinnings.toFixed(2)}</div>
              <div className="text-xs text-gray-400">To Winner</div>
            </div>
            <div>
              <div className="text-white font-bold text-lg">{match.currentPlayers}/{match.maxPlayers}</div>
              <div className="text-xs text-gray-400">Players</div>
            </div>
          </div>
        </div>
        {/* Participants section */}
        <div className="px-5 pb-5">
          <div className="font-semibold text-lg mb-2">Participants</div>
          <div className="flex flex-wrap gap-4 mb-4">
            {match.participants && match.participants.length > 0 ? (
              match.participants.map((p) => (
                <div key={p.user.id} className="flex items-center gap-2 bg-neutral-900 rounded-lg px-3 py-2 border border-neutral-800">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-pink-400">
                    <Image
                      src={p.user.image || "/Images/default-avatar.png"}
                      alt={p.user.displayName || p.user.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-white font-medium text-sm">{p.user.displayName || p.user.username}</div>
                  <div className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === 'joined' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'}`}>{p.status}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No participants yet.</div>
            )}
          </div>
          {/* Join Match button */}
          {canJoin && (
            <button
              onClick={handleJoin}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={joining}
            >
              {joining ? "Joining..." : `Join Match ($${match.buyIn.toFixed(2)})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 