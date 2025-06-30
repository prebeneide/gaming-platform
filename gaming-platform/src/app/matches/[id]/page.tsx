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

// Helper function to get game rules (copied from match creation)
function getGameRules(game: string, mode: string, competition: string, format: string, matchType: 'versus' | 'coop' | null) {
  if (!game || !mode) return "Please select a game and mode to view the rules.";
  
  // FC25
  if (game === 'FC25') {
    if (format === '1v1') {
      if (matchType === 'versus') {
        if (competition === 'Win' || competition === 'Most Goals') {
          return `You play against each other on separate teams in ${mode}. The player who wins the match (scores the most goals at the end of regular time) is the winner. If the match ends in a draw, play extra time and penalties until a winner is decided. Standard FIFA/EA Sports rules apply. No custom rules or handicaps unless agreed in advance. Fair play is required – no exploiting bugs or glitches.`;
        }
      }
      if (matchType === 'coop') {
        if (competition === 'Most Goals') {
          return `You play together on the same team in ${mode}. The player who scores the most goals during the match is the winner. Standard FIFA/EA Sports rules apply. No custom rules or handicaps unless agreed in advance. Fair play is required – no exploiting bugs or glitches.`;
        }
      }
      return "Please select a match type and competition type.";
    }
    // fallback for other formats
    return `Standard FIFA/EA Sports rules apply.`;
  }
  
  // Rocket League
  if (game === 'Rocket League') {
    if (format === '1v1') {
      if (matchType === 'versus') {
        if (competition === 'Win' || competition === 'Most Goals') {
          return `You play against each other on separate teams in ${mode}. The player/team who wins the match (scores the most goals) is the winner. Standard Rocket League rules apply. No unfair modifications or cheats. Fair play: No griefing or sabotage.`;
        }
      }
      if (matchType === 'coop') {
        if (competition === 'Most Goals') {
          return `You play together on the same team in ${mode}. The player who scores the most goals during the match is the winner. Standard Rocket League rules apply. No unfair modifications or cheats. Fair play: No griefing or sabotage.`;
        }
      }
      return "Please select a match type and competition type.";
    }
    return `Standard Rocket League rules apply.`;
  }
  
  // Other games
  if (game.startsWith('COD')) {
    return `Standard Call of Duty rules apply. The player/team with the most kills, highest K/D, or who wins the round (depending on competition type) wins. No third-party software, cheats, or exploits. Results must be documented if disputed.`;
  }
  if (game === 'Apex Legends') {
    return `Standard Apex Legends rules apply. The player/team with the most kills, most damage, or who survives the longest wins (depending on competition type). No teaming outside your squad. No cheats or exploits.`;
  }
  if (game.startsWith('Battlefield')) {
    return `Standard Battlefield rules apply. The player/team with the most kills, highest score, or who wins the round (depending on competition type) wins. No third-party software, cheats, or exploits.`;
  }
  if (game === 'Fortnite') {
    return `Standard Fortnite rules apply. The player/team who survives the longest or gets the most eliminations (depending on competition type) wins. No teaming with other players. No exploiting glitches or bugs. Play on the specified platform.`;
  }
  
  return `Follow the official rules for ${game}. Play fair. No cheating, exploiting, or unsportsmanlike conduct.`;
}

// Helper function to check if match type should be shown
function shouldShowMatchType(game: string, format: string) {
  return (game === 'FC25' || game === 'Rocket League') && format === '1v1';
}

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
  scheduledAt: string;
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
  const [leaving, setLeaving] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownStarted, setCountdownStarted] = useState<Date | null>(null);
  const [readying, setReadying] = useState(false);
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

  // Countdown timer effect
  useEffect(() => {
    if (!countdownStarted || match?.status !== 'countdown') {
      setCountdown(null);
      return;
    }

    const startTime = countdownStarted.getTime();
    const countdownDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
    const endTime = startTime + countdownDuration;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      if (remaining <= 0) {
        // Timeout - call API to cancel match
        handleTimeout();
        clearInterval(timer);
        setCountdown(null);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownStarted, match?.status]);

  // Effect to start countdown when match status changes to countdown
  useEffect(() => {
    if (match?.status === 'countdown' && match?.scheduledAt && !countdownStarted) {
      const countdownStartTime = new Date(match.scheduledAt);
      setCountdownStarted(countdownStartTime);
    }
  }, [match?.status, match?.scheduledAt, countdownStarted]);

  // Handler for timeout
  async function handleTimeout() {
    try {
      const res = await fetch(`/api/matches/${id}/timeout`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMatch(data.match);
        showPopup({ type: 'error', message: data.message });
        if (data.warning) {
          showPopup({ type: 'info', message: data.warning });
        }
      }
    } catch (err) {
      console.error('Timeout error:', err);
    }
  }

  // Format countdown time
  function formatCountdown(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading match...</div>;
  if (!match) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500">Match not found.</div>;

  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";

  // Helper: Sjekk om bruker kan joine
  const canJoin = match &&
    match.status === "open" &&
    match.currentPlayers < match.maxPlayers &&
    userId &&
    !match.participants.some(p => p.user.id === userId);

  // Helper: Sjekk om join popup kan lukkes (begge bokser avkrysset)
  const canConfirmJoin = termsAccepted && rulesAccepted;

  // Helper: Sjekk om bruker kan forlate matchen
  const canLeave = match &&
    userId &&
    match.participants.some(p => p.user.id === userId) &&
    match.status !== 'in_progress' &&
    match.status !== 'completed' &&
    match.status !== 'cancelled' &&
    match.creator.id !== userId;

  // Helper: Sjekk om bruker er creator og kan lukke matchen
  const canClose = match &&
    userId &&
    match.creator.id === userId &&
    match.status !== 'in_progress' &&
    match.status !== 'completed' &&
    match.status !== 'cancelled';

  // Helper: Sjekk om bruker kan markere seg som klar
  const canReady = match &&
    match.status === 'countdown' &&
    userId &&
    match.participants.some(p => p.user.id === userId && p.status === 'joined');

  // Debug logging
  if (match && userId) {
    console.log('Debug canReady:', {
      matchStatus: match.status,
      userId,
      participants: match.participants.map(p => ({ userId: p.user.id, status: p.status })),
      canReady: match.status === 'countdown' && userId && match.participants.some(p => p.user.id === userId && p.status === 'joined')
    });
  }

  // Helper: Sjekk om bruker allerede er klar
  const isReady = match &&
    userId &&
    match.participants.some(p => p.user.id === userId && p.status === 'ready');

  // Handler for join button click (shows popup)
  function handleJoinClick() {
    if (!canJoin) return;
    setShowJoinPopup(true);
  }

  // Handler for actual join (after confirmation)
  async function handleConfirmJoin() {
    if (!canConfirmJoin) return;
    setShowJoinPopup(false);
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

  // Handler for leave
  async function handleLeave() {
    if (!canLeave) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/matches/${id}/leave`, { method: "POST" });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Leave Match: Non-JSON response:", text);
        showPopup({ type: 'error', message: "Unexpected server response. Please try again or contact support." });
        return;
      }
      if (!res.ok) {
        showPopup({ type: 'error', message: data?.error || "Failed to leave match" });
        return;
      }
      setMatch(data.match);
      showPopup({ type: 'success', message: data.message });
    } catch (err: any) {
      showPopup({ type: 'error', message: err.message || "Failed to leave match" });
    } finally {
      setLeaving(false);
    }
  }

  // Handler for close match
  async function handleClose() {
    if (!canClose) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/matches/${id}/close`, { method: "POST" });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Close Match: Non-JSON response:", text);
        showPopup({ type: 'error', message: "Unexpected server response. Please try again or contact support." });
        return;
      }
      if (!res.ok) {
        showPopup({ type: 'error', message: data?.error || "Failed to close match" });
        return;
      }
      setMatch(data.match);
      showPopup({ type: 'success', message: data.message });
    } catch (err: any) {
      showPopup({ type: 'error', message: err.message || "Failed to close match" });
    } finally {
      setClosing(false);
    }
  }

  // Handler for ready
  async function handleReady() {
    if (!canReady) return;
    setReadying(true);
    try {
      const res = await fetch(`/api/matches/${id}/ready`, { method: "POST" });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Ready Up: Non-JSON response:", text);
        showPopup({ type: 'error', message: "Unexpected server response. Please try again or contact support." });
        return;
      }
      if (!res.ok) {
        showPopup({ type: 'error', message: data?.error || "Failed to ready up" });
        return;
      }
      setMatch(data.match);
      showPopup({ type: 'success', message: data.message });
    } catch (err: any) {
      showPopup({ type: 'error', message: err.message || "Failed to ready up" });
    } finally {
      setReadying(false);
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

        {/* Countdown Timer */}
        {match?.status === 'countdown' && countdown !== null && (
          <div className={`mx-5 mb-4 p-4 rounded-lg text-center ${
            countdown <= 60000 
              ? 'bg-gradient-to-r from-red-600 to-red-800' 
              : 'bg-gradient-to-r from-yellow-600 to-orange-600'
          }`}>
            <div className="text-lg font-bold text-white mb-1">Match Starting Soon!</div>
            <div className="text-3xl font-mono font-bold text-white">
              {formatCountdown(countdown)}
            </div>
            <div className="text-sm text-white/80 mt-1">
              All players must be ready before time runs out
            </div>
          </div>
        )}
        
        {/* Game Image */}
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
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              match.status === 'open' ? 'bg-green-700 text-white' :
              match.status === 'countdown' ? 'bg-orange-600 text-white' :
              match.status === 'ready' ? 'bg-yellow-600 text-white' :
              match.status === 'in_progress' ? 'bg-blue-600 text-white' :
              match.status === 'cancelled' ? 'bg-gray-600 text-white' :
              'bg-gray-700 text-white'
            }`}>{match.status}</div>
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
                  <div className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                    p.status === 'ready' ? 'bg-green-700 text-white' : 
                    p.status === 'joined' ? 'bg-blue-700 text-white' : 
                    'bg-gray-700 text-gray-300'
                  }`}>{p.status}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No participants yet.</div>
            )}
          </div>
          {/* Join Match button */}
          {canJoin && (
            <button
              onClick={handleJoinClick}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={joining}
            >
              {joining ? "Joining..." : `Join Match ($${match.buyIn.toFixed(2)})`}
            </button>
          )}
          {/* Leave Match button */}
          {canLeave && (
            <button
              onClick={handleLeave}
              className="w-full mt-2 bg-gradient-to-r from-gray-700 to-red-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={leaving}
            >
              {leaving ? "Leaving..." : "Leave Match"}
            </button>
          )}
          {/* Ready button */}
          {canReady && (
            <button
              onClick={handleReady}
              className="w-full mt-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={readying}
            >
              {readying ? "Ready..." : "Ready"}
            </button>
          )}
          {/* Ready status message */}
          {match.status === 'countdown' && (
            <div className="mt-2 text-center text-sm text-gray-300">
              {match.participants.filter(p => p.status === 'ready').length} of {match.maxPlayers} players ready
            </div>
          )}
          {/* Close Match button */}
          {canClose && (
            <button
              onClick={handleClose}
              className="w-full mt-2 bg-gradient-to-r from-red-700 to-red-900 text-white font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={closing}
            >
              {closing ? "Closing..." : "Close Match"}
            </button>
          )}
        </div>
      </div>
      {/* Join Confirmation Popup */}
      {showJoinPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-gray-700 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Join Match Confirmation</h2>
            
            {/* Match Info */}
            <div className="bg-neutral-800 rounded-lg p-4 mb-4">
              <div className="text-white font-semibold">{match?.name}</div>
              <div className="text-gray-300 text-sm mt-1">
                {match?.gameName} • {match?.gameMode} • {match?.competitionType}
              </div>
              <div className="text-pink-400 font-bold mt-2">Buy-in: ${match?.buyIn.toFixed(2)}</div>
            </div>

            {/* Game Rules */}
            <div className="mb-4">
              <div className="bg-neutral-800 border border-gray-700 rounded-lg p-4 max-h-32 overflow-y-auto text-sm text-gray-300 mb-2">
                <b>Game Rules:</b>
                <div className="mt-2">
                  {getGameRules(match?.gameName || '', match?.gameMode || '', match?.competitionType || '', match?.competitionFormat || '', match?.matchType as 'versus' | 'coop' | null)}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={e => setRulesAccepted(e.target.checked)}
                  required
                />
                <span className="text-sm text-white">I have read and understand the rules above</span>
              </label>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-4">
              <div className="bg-neutral-800 border border-gray-700 rounded-lg p-4 max-h-32 overflow-y-auto text-sm text-gray-300 mb-2">
                <b>Important: Please read and accept before joining</b>
                <ul className="list-disc ml-5 mt-2">
                  <li>You are at least 18 years old, or of legal age to participate in skill-based competitions with monetary stakes in your jurisdiction.</li>
                  <li>You understand that participating in matches with a buy-in involves financial risk, and you may lose your buy-in amount.</li>
                  <li>You are solely responsible for your actions and any losses incurred.</li>
                  <li>You agree to play fairly and abide by the platform's rules and code of conduct.</li>
                  <li>All buy-ins are final and non-refundable, except in cases of technical error or match cancellation as determined by the platform.</li>
                </ul>
                <div className="mt-2 font-semibold text-pink-400">If you do not agree, do not join this match.</div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  required
                />
                <span className="text-sm text-white">I have read and accept the terms above</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinPopup(false);
                  setTermsAccepted(false);
                  setRulesAccepted(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={!canConfirmJoin}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  canConfirmJoin 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Join Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 