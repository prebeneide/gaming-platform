"use client";
import Link from "next/link";
import Image from "next/image";
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
  participants?: Array<{
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
  }>;
  result?: {
    id: string;
    winnerId?: string;
    resultType: string;
    status: string;
    payoutAmount?: number;
    createdAt: string;
    completedAt?: string;
  };
}

interface MatchCardProps {
  match: Match;
  className?: string;
}

export default function MatchCard({ match, className = "" }: MatchCardProps) {
  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";
  
  // Helper: Format visibility for display
  const formatVisibility = (visibility: string) => {
    switch (visibility) {
      case 'invite_only':
        return 'Invite Only';
      case 'friends':
        return 'Friends Only';
      case 'public':
        return 'Public';
      default:
        return visibility.charAt(0).toUpperCase() + visibility.slice(1);
    }
  };
  
  return (
    <div className={`w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden ${className}`}>
      {/* Top: Creator info */}
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
      {/* Media section */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {/* User-uploaded media if exists, else game image */}
        {match.mediaUrl ? (
          match.mediaType === "video" ? (
            <video src={match.mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <Image src={match.mediaUrl} alt="Match media" fill className="object-cover" />
          )
        ) : (
          <Image src={gameImg} alt={match.gameName} fill className="object-cover opacity-80" />
        )}
        {/* Game logo overlay */}
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
          <span className="bg-neutral-800 rounded px-2 py-1">{formatVisibility(match.visibility)}</span>
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

        {/* Match Result Section - Only show if completed */}
        {match.status === 'completed' && match.result && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
            <div className="text-green-400 font-bold text-sm mb-2">🏆 Winner</div>
            {match.participants && match.result.winnerId && (
              <div className="text-white font-semibold">
                {match.participants.find(p => p.user.id === match.result?.winnerId)?.user.displayName || 
                 match.participants.find(p => p.user.id === match.result?.winnerId)?.user.username}
              </div>
            )}
            <div className="text-xs text-green-300 mt-1">
              Completed: {new Date(match.result.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Participants Section - Only show if completed */}
        {match.status === 'completed' && match.participants && (
          <div className="mt-3">
            <div className="text-white font-semibold text-sm mb-2">Participants</div>
            <div className="space-y-2">
              {match.participants.map((participant) => {
                const isWinner = match.result?.winnerId === participant.user.id;
                return (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar 
                        user={{
                          image: participant.user.image,
                          username: participant.user.username,
                          displayName: participant.user.displayName
                        }}
                        size={24}
                        ring={true}
                      />
                      <span className="text-sm text-gray-300">
                        {participant.user.displayName || participant.user.username}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isWinner 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {isWinner ? 'Winner' : 'Participant'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <Link href={`/matches/${match.id}`} className="mt-4 w-full block text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition">
          View Details
        </Link>
      </div>
    </div>
  );
}

export type { Match };
