"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import BackButton from "@/components/BackButton";
import UserAvatar from "@/components/UserAvatar";

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
  hasReportedResult?: boolean;
  reportedWinnerId?: string;
  reportedResult?: string;
  proofImageUrl?: string;
  proofUploadedAt?: string;
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
  result?: {
    id: string;
    winnerId?: string;
    resultType: string;
    status: string;
    agreedBy: string[];
    disputedBy: string[];
    payoutAmount?: number;
    createdAt: string;
    completedAt?: string;
  };
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
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { showPopup } = usePopup();
  const [showResultConfirm, setShowResultConfirm] = useState<null | { type: string, winnerId?: string }> (null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Legg til state for progressbar visning og timer
  const [showReportForm, setShowReportForm] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressDuration = 10; // sekunder (reduced for development)

  // Helper: Bestem brukerens rolle i matchen
  const getUserRole = () => {
    if (!match || !userId) return 'spectator';
    if (match.creator.id === userId) return 'creator';
    if (match.participants.some(p => p.user.id === userId)) return 'participant';
    return 'spectator';
  };

  const userRole = getUserRole();
  const isParticipant = userRole === 'participant' || userRole === 'creator';
  const isSpectator = userRole === 'spectator';

  const [activeMatch, setActiveMatch] = useState<{ id: string; name: string } | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);

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

  useEffect(() => {
    // Sjekk om brukeren er deltaker i en aktiv match
    async function checkActiveMatch() {
      try {
        const res = await fetch('/api/matches/active');
        if (res.ok) {
          const data = await res.json();
          if (data.activeMatch) {
            setActiveMatch({ id: data.activeMatch.id, name: data.activeMatch.name });
          }
        }
      } catch (e) {}
      setCheckingActive(false);
    }
    if (userId) checkActiveMatch();
  }, [userId]);

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

  // Polling for real-time updates
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/matches/${id}`);
        const data = await res.json();
        if (data.match) {
          console.log('Polling update - Match status:', data.match.status);
          if (data.match.result) {
            console.log('Match result:', data.match.result);
          }
          setMatch(data.match);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // 2 sekunder
    return () => clearInterval(interval);
  }, [id]);

  // 2. Effekt: Når match.status blir 'in_progress', start progressbar og timer
  useEffect(() => {
    if (match?.status === 'in_progress' && isParticipant) {
      setShowReportForm(false);
      setProgress(0);
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 1;
        setProgress((elapsed / progressDuration) * 100);
        if (elapsed >= progressDuration) {
          setShowReportForm(true);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (match?.status !== 'in_progress') {
      setShowReportForm(false);
      setProgress(0);
    }
  }, [match?.status, isParticipant]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading match...</div>;
  if (!match) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500">Match not found.</div>;

  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";

  // Helper: Sjekk om bruker kan joine
  const canJoin = match &&
    match.status === "open" &&
    match.currentPlayers < match.maxPlayers &&
    userId &&
    !match.participants.some(p => p.user.id === userId)
    && !activeMatch;

  // Helper: Sjekk om join popup kan lukkes (begge bokser avkrysset)
  const canConfirmJoin = termsAccepted && rulesAccepted;

  // Helper: Sjekk om bruker kan forlate matchen
  const canLeave = match &&
    userId &&
    match.participants.some(p => p.user.id === userId) &&
    (match.status === 'open' || match.status === 'countdown') &&
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

  // Handler for leave button click (shows popup)
  function handleLeaveClick() {
    if (!canLeave) return;
    setShowLeavePopup(true);
  }

  // Handler for actual leave (after confirmation)
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

  // Handler for valg av vinner/problem
  function handleResultClick(type: string, winnerId?: string) {
    setShowResultConfirm({ type, winnerId });
  }
  function handleResultCancel() {
    setShowResultConfirm(null);
  }
  async function handleResultConfirm() {
    if (!showResultConfirm || !proofFile || !match) {
      showPopup({ type: 'error', message: 'Please select a proof image first' });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('resultType', showResultConfirm.type);
      if (showResultConfirm.winnerId) {
        formData.append('winnerId', showResultConfirm.winnerId);
      }
      formData.append('proofFile', proofFile);

      const response = await fetch(`/api/matches/${match.id}/report-result`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showPopup({ type: 'success', message: data.message || 'Result reported successfully!' });
        setShowResultConfirm(null);
        setProofFile(null);
        setProofPreview(null);
        if (proofInputRef.current) proofInputRef.current.value = "";
        // Oppdater match-data for å vise at brukeren har rapportert
        const res = await fetch(`/api/matches/${match.id}`);
        const matchData = await res.json();
        if (matchData.match) setMatch(matchData.match);
      } else {
        showPopup({ type: 'error', message: data.error || 'Failed to report result' });
      }
    } catch (error) {
      console.error('Error reporting result:', error);
      showPopup({ type: 'error', message: 'Failed to report result. Please try again.' });
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      {/* Back Button */}
      <div className="w-full max-w-xl mx-auto mb-4">
        <BackButton />
      </div>
      <div className="w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden">
        {/* Creator info */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <UserAvatar 
            user={{
              image: match.creator.image,
              username: match.creator.username,
              displayName: match.creator.displayName
            }}
            size={44}
            ring={true}
          />
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
              {isParticipant 
                ? "All players must be ready before time runs out"
                : "Players are preparing for the match"
              }
            </div>
          </div>
        )}

        {/* Spectator Info for countdown */}
        {match?.status === 'countdown' && isSpectator && (
          <div className="mx-5 mb-4 p-4 rounded-lg text-center bg-neutral-900 border border-blue-700">
            <div className="text-lg font-bold text-blue-400 mb-2">Match Preparation</div>
            <div className="text-gray-200 text-sm">
              Players are getting ready for the match. The match will start automatically once all players are ready.
            </div>
          </div>
        )}

        {/* Spectator Info for open matches */}
        {match?.status === 'open' && isSpectator && (
          <div className="mx-5 mb-4 p-4 rounded-lg text-center bg-neutral-900 border border-green-700">
            <div className="text-lg font-bold text-green-400 mb-2">Match Open</div>
            <div className="text-gray-200 text-sm">
              This match is open for players to join. You can join this match to participate, or watch as a spectator.
            </div>
          </div>
        )}

        {/* Spectator Info for ready matches */}
        {match?.status === 'ready' && isSpectator && (
          <div className="mx-5 mb-4 p-4 rounded-lg text-center bg-neutral-900 border border-yellow-700">
            <div className="text-lg font-bold text-yellow-400 mb-2">Match Ready</div>
            <div className="text-gray-200 text-sm">
              All players are ready! The match will start soon. You can watch the progress as a spectator.
            </div>
          </div>
        )}

        {/* Spectator Info for cancelled matches */}
        {match?.status === 'cancelled' && isSpectator && (
          <div className="mx-5 mb-4 p-4 rounded-lg text-center bg-neutral-900 border border-red-700">
            <div className="text-lg font-bold text-red-400 mb-2">Match Cancelled</div>
            <div className="text-gray-200 text-sm">
              This match has been cancelled. Players have been refunded their buy-ins.
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
            }`}>
              {match.status === 'in_progress' ? 'IN PROGRESS' : match.status.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
          <span className="bg-neutral-800 rounded px-2 py-1">{match.gameMode.charAt(0).toUpperCase() + match.gameMode.slice(1)}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionType.charAt(0).toUpperCase() + match.competitionType.slice(1)}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionFormat.charAt(0).toUpperCase() + match.competitionFormat.slice(1)}</span>
          {match.matchType && <span className="bg-neutral-800 rounded px-2 py-1">{match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1)}</span>}
          <span className="bg-neutral-800 rounded px-2 py-1">{match.platform.charAt(0).toUpperCase() + match.platform.slice(1)}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.visibility.charAt(0).toUpperCase() + match.visibility.slice(1)}</span>
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
        {/* Match Result Section (for completed matches) */}
        {match.status === 'completed' && match.result && (
          <div className="px-5 pb-5">
            <div className="font-semibold text-lg mb-2 text-green-400">Match Result</div>
            <div className="bg-neutral-900 border border-green-700 rounded-lg p-4 mb-4">
              {match.result.resultType === 'win' && match.result.winnerId && (
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400 mb-2">🏆 Winner</div>
                  <div className="text-white font-semibold">
                    {match.participants.find(p => p.user.id === match.result?.winnerId)?.user.displayName || 
                     match.participants.find(p => p.user.id === match.result?.winnerId)?.user.username || 
                     'Unknown Player'}
                  </div>
                  {match.result.payoutAmount && (
                    <div className="text-green-400 font-bold mt-2">
                      Payout: ${match.result.payoutAmount.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
              {match.result.resultType === 'draw' && (
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400 mb-2">🤝 Draw</div>
                  <div className="text-white">The match ended in a draw</div>
                </div>
              )}
              {match.result.resultType === 'problem' && (
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400 mb-2">⚠️ Technical Issue</div>
                  <div className="text-white">Match was cancelled due to technical problems</div>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-3 text-center">
                Completed: {new Date(match.result.completedAt || match.result.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Match Result Section (for disputed matches) */}
        {match.status === 'disputed' && match.result && (
          <div className="px-5 pb-5">
            <div className="font-semibold text-lg mb-2 text-red-400">Match Disputed</div>
            <div className="bg-neutral-900 border border-red-700 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-400 mb-2">⚠️ Under Review</div>
                <div className="text-white">This match has conflicting reports and is being reviewed by an admin.</div>
                <div className="text-xs text-gray-400 mt-2">
                  Disputed: {new Date(match.result.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants section */}
        <div className="px-5 pb-5">
          <div className="font-semibold text-lg mb-2">Participants</div>
          <div className="flex flex-wrap gap-4 mb-4">
            {match.participants && match.participants.length > 0 ? (
              match.participants.map((p) => (
                <div key={p.user.id} className="flex items-center gap-2 bg-neutral-900 rounded-lg px-3 py-2 border border-neutral-800">
                  <UserAvatar 
                    user={{
                      image: p.user.image,
                      username: p.user.username,
                      displayName: p.user.displayName
                    }}
                    size={32}
                    ring={true}
                  />
                  <div className="text-white font-medium text-sm">{p.user.displayName || p.user.username}</div>
                  {/* Status badge - vis Winner/Participant for completed matches, ellers vis status */}
                  {(isParticipant || match.status === 'completed' || match.status === 'disputed') && (
                    match.status === 'completed' ? (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                        match.result?.winnerId === p.user.id 
                          ? 'bg-yellow-600 text-white border border-yellow-400' 
                          : 'bg-gray-600 text-gray-300 border border-gray-500'
                      }`}>
                        {match.result?.winnerId === p.user.id ? 'Winner' : 'Participant'}
                      </span>
                    ) : p.hasReportedResult ? (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold bg-green-600 text-white border border-green-400">Reported</span>
                    ) : (
                      match.status === 'in_progress' ? (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-600 text-white border border-blue-400">IN GAME</span>
                      ) : (
                        <div className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                          p.status === 'ready' ? 'bg-green-700 text-white' : 
                          p.status === 'joined' ? 'bg-blue-700 text-white' : 
                          'bg-gray-700 text-gray-300'
                        }`}>{p.status}</div>
                      )
                    )
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No participants yet.</div>
            )}
          </div>

          {/* Spectator Info Section (for non-participants when match is in progress) */}
          {match.status === 'in_progress' && isSpectator && (
            <div className="w-full bg-neutral-900 border border-blue-700 rounded-2xl shadow-lg p-6 flex flex-col gap-4 mb-4">
              <div className="text-lg font-bold text-blue-400 mb-2">Match in Progress</div>
              <div className="text-gray-200 text-base">
                This match is currently being played. Players are reporting their results and uploading proof.
                The match outcome will be finalized once all participants have submitted their reports.
              </div>
              <div className="text-sm text-gray-400">
                <div className="flex justify-between items-center">
                  <span>Players who have reported:</span>
                  <span className="font-semibold text-green-400">
                    {match.participants.filter(p => p.hasReportedResult).length} / {match.participants.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Report Result Section (kun for deltakere når matchen er in_progress) */}
          {match.status === 'in_progress' && isParticipant && (() => {
            if (!showReportForm) {
              // Vis kun progressbar i rapporteringsboksen
              return (
                <div className="w-full bg-neutral-900 border-2 border-yellow-500 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center gap-6 mb-4 relative overflow-hidden" style={{ minHeight: 260 }}>
                  <div className="text-2xl font-extrabold text-yellow-400 mb-2 drop-shadow-lg" style={{ letterSpacing: 1 }}>Match In Progress</div>
                  <div className="text-gray-200 text-base mb-4 text-center">You can report the result when the match is finished.<br/>Please play fair and do not report before the match is over!</div>
                  {/* 3D Progressbar */}
                  <div className="w-full max-w-md h-10 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-2xl border-4 border-yellow-500 flex items-center relative overflow-hidden" style={{ perspective: 400 }}>
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl shadow-lg"
                      style={{
                        width: `${progress}%`,
                        transition: 'width 1s cubic-bezier(0.4,2,0.2,1)',
                        boxShadow: '0 4px 24px 0 #ff00cc88, 0 1.5px 0 #fff inset',
                        transform: 'skewX(-18deg) scaleY(1.08)',
                        borderRight: progress > 2 ? '6px solid #fff' : 'none',
                      }}
                    />
                    {/* 3D glass shine overlay */}
                    <div className="absolute left-0 top-0 w-full h-full pointer-events-none" style={{
                      background: 'linear-gradient(120deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 100%)',
                      borderRadius: '1rem',
                      mixBlendMode: 'screen',
                    }} />
                    {/* Progress text */}
                    <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
                      <span className="font-extrabold text-lg text-white drop-shadow-lg tracking-widest" style={{ textShadow: '0 2px 8px #000, 0 0 2px #fff' }}>{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Reporting will be available in {progressDuration - Math.floor(progressDuration * progress / 100)} seconds...</div>
                  {/* Cool game-style glow border */}
                  <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-yellow-400 animate-pulse" style={{ boxShadow: '0 0 32px 4px #ff0, 0 0 0 8px #000 inset' }} />
                </div>
              );
            }
            // ... eksisterende rapporteringsskjema ...
            const me = match.participants.find(p => p.user.id === userId);
            if (me?.hasReportedResult) {
              let message = '';
              if (me.reportedResult === 'win' && me.reportedWinnerId === userId) {
                message = "Congratulations on your victory! Your result and proof have been submitted. We are now waiting for all participants to report their results. If there are no disputes, the match outcome will be finalized soon.";
              } else if (me.reportedResult === 'win' && me.reportedWinnerId !== userId) {
                message = "Thank you for reporting your result. Better luck next time! Your response and proof have been submitted. We are now synchronizing results from all participants. If there are no disputes, the match outcome will be finalized soon.";
              } else if (me.reportedResult === 'draw') {
                message = "Your draw result and proof have been submitted. We are now waiting for all participants to report their results. If there are no disputes, the match outcome will be finalized soon.";
              } else if (me.reportedResult === 'problem') {
                message = "Your report has been submitted. An admin will review the evidence and resolve the issue as soon as possible. Please wait for further updates.";
              }
              return (
                <div className="w-full bg-neutral-900 border border-yellow-700 rounded-2xl shadow-lg p-6 flex flex-col gap-4 mb-4">
                  <div className="text-lg font-bold text-yellow-400 mb-2">Result Submitted</div>
                  <div className="text-gray-200 text-base">{message}</div>
                </div>
              );
            }
            return (
              <div className="w-full bg-neutral-900 border border-yellow-700 rounded-2xl shadow-lg p-6 flex flex-col gap-4 mb-4">
                {/* Report Result overskrift øverst */}
                <div className="text-lg font-bold text-yellow-400 mb-2">Report Result</div>
                {/* Bildeopplasting og info */}
                <div className="text-gray-200 text-sm mb-2">
                  All players must upload a screenshot or photo as proof of the result.<br/>
                  <span className="text-yellow-400 font-semibold">If there is a dispute, the admin will review all evidence.</span>
                </div>
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setProofFile(file);
                    setProofPreview(URL.createObjectURL(file));
                  }}
                />
                {proofPreview ? (
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <img src={proofPreview} alt="Proof preview" className="rounded-lg max-h-48 object-contain border border-gray-700" />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition"
                        onClick={() => proofInputRef.current?.click()}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-gray-700 text-white text-xs font-semibold hover:bg-gray-800 transition"
                        onClick={() => { setProofFile(null); setProofPreview(null); if (proofInputRef.current) proofInputRef.current.value = ""; }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition"
                    onClick={() => proofInputRef.current?.click()}
                  >
                    Upload proof (required)
                  </button>
                )}
                {/* Hvem vant seksjonen */}
                <div className="text-gray-300 text-sm mt-2 mb-1">Who won?</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* Knapper for alle deltakere */}
                  {match.participants.map((p) => (
                    <button
                      key={p.user.id}
                      className="px-4 py-2 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 transition"
                      onClick={() => handleResultClick('win', p.user.id)}
                    >
                      {p.user.id === userId ? "I won" : `${p.user.displayName || p.user.username} won`}
                    </button>
                  ))}
                  {/* Draw knapp */}
                  <button className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition" onClick={() => handleResultClick('draw')}>
                    Draw
                  </button>
                  {/* Error/Fail/Problems knapp */}
                  <button className="px-4 py-2 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition" onClick={() => handleResultClick('problem')}>
                    Error / Fail / Problems
                  </button>
                </div>
              </div>
            );
          })()}
          {/* Action Buttons Section */}
          <div className="px-5 pb-5">
            {/* Join Match button - kun for tilskuere */}
            {canJoin && isSpectator && (
              <button
                onClick={handleJoinClick}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={joining || !!activeMatch || checkingActive}
              >
                {joining ? "Joining..." : `Join Match ($${match.buyIn.toFixed(2)})`}
              </button>
            )}
            {/* Hvis bruker ikke kan joine pga aktiv match, vis melding */}
            {!canJoin && isSpectator && activeMatch && (
              <div className="mb-4 p-4 bg-yellow-900/60 border border-yellow-600 rounded-lg text-yellow-300 text-center">
                <b>You are already a participant in an active match:</b><br />
                <span className="font-semibold">{activeMatch.name}</span><br />
                <a href={`/matches/${activeMatch.id}`} className="underline text-yellow-200">Go to match</a><br />
                <span className="block mt-2">You must leave this match before joining a new one.</span>
              </div>
            )}

            {/* Participant Actions - kun for deltakere */}
            {isParticipant && (
              <>
                {/* Leave Match button */}
                {canLeave && (
                  <button
                    onClick={handleLeaveClick}
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
                {/* Close Match button - kun for creator */}
                {canClose && (
                  <button
                    onClick={handleClose}
                    className="w-full mt-2 bg-gradient-to-r from-red-700 to-red-900 text-white font-bold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={closing}
                  >
                    {closing ? "Closing..." : "Close Match"}
                  </button>
                )}
              </>
            )}

            {/* Ready status message - kun for deltakere */}
            {match.status === 'countdown' && isParticipant && (
              <div className="mt-2 text-center text-sm text-gray-300">
                {match.participants.filter(p => p.status === 'ready').length} of {match.maxPlayers} players ready
              </div>
            )}

            {/* Spectator Info for countdown */}
            {match.status === 'countdown' && isSpectator && (
              <div className="mt-2 text-center text-sm text-gray-300">
                Match starting soon! {match.participants.filter(p => p.status === 'ready').length} of {match.maxPlayers} players are ready.
              </div>
            )}
          </div>
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
      {/* Leave Confirmation Popup */}
      {showLeavePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-gray-700 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Are you sure you want to leave this match?</h2>
            <div className="text-gray-300 mb-4">
              If you leave now, your spot will be lost and your buy-in will be refunded.<br/>
              <span className="text-yellow-400 font-semibold">If other players have already joined, leaving may ruin the experience for them.</span><br/>
              Please only leave if you are certain you cannot participate.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeavePopup(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLeavePopup(false);
                  await handleLeave();
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={leaving}
              >
                {leaving ? "Leaving..." : "Leave Match"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Result Confirmation Popup */}
      {showResultConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-gray-700 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Confirm your choice</h2>
            <div className="text-gray-300 mb-4">
              {showResultConfirm.type === 'win' && (
                <>
                  {showResultConfirm.winnerId === userId
                    ? 'Are you absolutely sure you won this match?'
                    : `Are you sure ${match.participants.find(p => p.user.id === showResultConfirm.winnerId)?.user.displayName || 'this player'} won this match?`}
                </>
              )}
              {showResultConfirm.type === 'draw' && (
                <>Are you sure the match ended in a draw?</> )}
              {showResultConfirm.type === 'problem' && (
                <>Are you sure there was a technical problem or error?</> )}
              <div className="mt-3 text-red-400 font-semibold">False reporting may result in suspension or ban.</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResultCancel}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResultConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:opacity-90 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 