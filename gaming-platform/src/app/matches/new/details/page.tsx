"use client";

import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState, useRef } from 'react';

const games = [
  {
    id: 1,
    name: 'FC25',
    image: '/Images/FC25/98678603c00b2f99573ac233ce0e1780.jpg',
  },
  {
    id: 2,
    name: 'Fortnite',
    image: '/Images/Fortnite/c3c2a2242cc7e196f639bd78bc8bacfa.jpg',
  },
  {
    id: 3,
    name: 'Rocket League',
    image: '/Images/RocketLeague/d37e92eaeab39c4e1cb20495cb903bb7.jpg',
  },
  {
    id: 4,
    name: 'COD:MW2',
    image: '/Images/COD-ModernWarfare2/aa11186dc69287ff7192992845d8585b.jpg',
  },
  {
    id: 5,
    name: 'COD:MW3',
    image: '/Images/COD-ModernWarfare3/b248a47671cc9b3d3f7c1fdd23a0a8a5.jpg',
  },
  {
    id: 6,
    name: 'Apex Legends',
    image: '/Images/ApexLegends/45e8fbf182fa6f0e180a02793180f91e.jpg',
  },
  {
    id: 7,
    name: 'Battlefield V',
    image: '/Images/BattlefieldV/battlefield-5-pc-game-ea-app-cover.jpg',
  },
  {
    id: 8,
    name: 'Battlefield 2042',
    image: '/Images/Battlefield2042/Battlefield_2042_cover_art.jpg',
  },
  {
    id: 9,
    name: 'COD: Black Ops 6',
    image: '/Images/COD-BlackOps6/BO6_KA_SECONDARY_240724_16x9_Trio_B.jpg',
  },
];

const gameModes: Record<string, string[]> = {
  'FC25': ['Ultimate Team', 'Seasons', 'Kick Off', 'Pro Clubs', 'VOLTA Football', 'Career Mode'],
  'Fortnite': ['Battle Royale', 'Zero Build', 'Creative', 'Team Rumble', 'Save the World'],
  'Rocket League': ['Soccar', 'Rumble', 'Dropshot', 'Hoops', 'Snow Day', 'Tournament'],
  'COD:MW2': ['Team Deathmatch', 'Domination', 'Search and Destroy', 'Free-for-All', 'Hardpoint', 'Kill Confirmed', 'Warzone', 'Ground War'],
  'COD:MW3': ['Team Deathmatch', 'Domination', 'Search and Destroy', 'Free-for-All', 'Hardpoint', 'Kill Confirmed', 'Warzone', 'Ground War'],
  'Apex Legends': ['Battle Royale', 'Ranked', 'Arenas', 'LTMs'],
  'Battlefield V': ['Conquest', 'Team Deathmatch', 'Breakthrough', 'Grand Operations', 'Frontlines', 'Domination'],
  'Battlefield 2042': ['Conquest', 'Breakthrough', 'Hazard Zone', 'Portal'],
  'COD: Black Ops 6': ['Team Deathmatch', 'Domination', 'Search and Destroy', 'Free-for-All', 'Hardpoint', 'Kill Confirmed', 'Zombies', 'Warzone'],
};

const competitionTypes: Record<string, Record<string, string[]>> = {
  'FC25': {
    'Ultimate Team': ['Win', 'Most Goals', 'Most Assists', 'Most Shots', 'Most Possession', 'Highest Pass Accuracy'],
    'Seasons': ['Win', 'Most Goals', 'Most Assists', 'Most Shots', 'Most Possession', 'Highest Pass Accuracy'],
    'Kick Off': ['Win', 'Most Goals', 'Most Assists', 'Most Shots', 'Most Possession', 'Highest Pass Accuracy'],
    'Pro Clubs': ['Win', 'Most Goals', 'Most Assists', 'Most Shots', 'Most Possession', 'Highest Pass Accuracy', 'Most Tackles', 'Most Interceptions'],
    'VOLTA Football': ['Win', 'Most Goals', 'Most Assists', 'Most Skills', 'Most Possession', 'Highest Pass Accuracy'],
    'Career Mode': ['Win', 'Most Goals', 'Most Assists', 'Most Shots', 'Most Possession', 'Highest Pass Accuracy', 'Highest Rating'],
  },
  'Fortnite': {
    'Battle Royale': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Longest Survival', 'Most Builds', 'Most Materials Gathered'],
    'Zero Build': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Longest Survival'],
    'Creative': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Most Builds'],
    'Team Rumble': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Most Builds'],
    'Save the World': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Resources Gathered', 'Most Buildings Constructed'],
  },
  'Rocket League': {
    'Soccar': ['Win', 'Most Goals', 'Most Assists', 'Most Saves', 'Most Shots', 'Most Aerial Goals', 'Most Demolitions', 'Highest Score'],
    'Rumble': ['Win', 'Most Goals', 'Most Assists', 'Most Saves', 'Most Power-ups Used', 'Most Demolitions', 'Highest Score'],
    'Dropshot': ['Win', 'Most Goals', 'Most Assists', 'Most Saves', 'Most Damage', 'Most Demolitions', 'Highest Score'],
    'Hoops': ['Win', 'Most Goals', 'Most Assists', 'Most Saves', 'Most Dunks', 'Most Demolitions', 'Highest Score'],
    'Snow Day': ['Win', 'Most Goals', 'Most Assists', 'Most Saves', 'Most Shots', 'Most Demolitions', 'Highest Score'],
    'Tournament': ['Win', 'Most Goals', 'Most Assists', 'Most Saves', 'Most Shots', 'Most Demolitions', 'Highest Score'],
  },
  'COD:MW2': {
    'Team Deathmatch': ['Win', 'Most Kills', 'Highest K/D', 'Most Assists', 'Most Headshots', 'Most Scorestreaks', 'Most Objectives'],
    'Domination': ['Win', 'Most Kills', 'Highest K/D', 'Most Captures', 'Most Defends', 'Most Scorestreaks', 'Most Objectives'],
    'Search and Destroy': ['Win', 'Most Kills', 'Most Plants', 'Most Defuses', 'Most Scorestreaks', 'Most Objectives'],
    'Free-for-All': ['Win', 'Most Kills', 'Highest K/D', 'Most Headshots', 'Most Scorestreaks'],
    'Hardpoint': ['Win', 'Most Kills', 'Most Time in Hardpoint', 'Most Scorestreaks', 'Most Objectives'],
    'Kill Confirmed': ['Win', 'Most Kills', 'Most Tags Collected', 'Most Scorestreaks', 'Most Objectives'],
    'Warzone': ['Win', 'Most Kills', 'Highest K/D', 'Most Damage', 'Most Contracts', 'Most Cash Collected', 'Longest Survival'],
    'Ground War': ['Win', 'Most Kills', 'Most Captures', 'Most Defends', 'Most Scorestreaks', 'Most Objectives'],
  },
  'COD:MW3': {
    'Team Deathmatch': ['Win', 'Most Kills', 'Highest K/D', 'Most Assists', 'Most Headshots', 'Most Scorestreaks', 'Most Objectives'],
    'Domination': ['Win', 'Most Kills', 'Highest K/D', 'Most Captures', 'Most Defends', 'Most Scorestreaks', 'Most Objectives'],
    'Search and Destroy': ['Win', 'Most Kills', 'Most Plants', 'Most Defuses', 'Most Scorestreaks', 'Most Objectives'],
    'Free-for-All': ['Win', 'Most Kills', 'Highest K/D', 'Most Headshots', 'Most Scorestreaks'],
    'Hardpoint': ['Win', 'Most Kills', 'Most Time in Hardpoint', 'Most Scorestreaks', 'Most Objectives'],
    'Kill Confirmed': ['Win', 'Most Kills', 'Most Tags Collected', 'Most Scorestreaks', 'Most Objectives'],
    'Warzone': ['Win', 'Most Kills', 'Highest K/D', 'Most Damage', 'Most Contracts', 'Most Cash Collected', 'Longest Survival'],
    'Ground War': ['Win', 'Most Kills', 'Most Captures', 'Most Defends', 'Most Scorestreaks', 'Most Objectives'],
  },
  'Apex Legends': {
    'Battle Royale': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Most Revives', 'Most Respawns', 'Longest Survival'],
    'Ranked': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Most Revives', 'Most Respawns', 'Longest Survival'],
    'Arenas': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Most Revives', 'Most Respawns'],
    'LTMs': ['Win', 'Most Kills', 'Most Damage', 'Most Assists', 'Most Headshots', 'Most Revives', 'Most Respawns', 'Longest Survival'],
  },
  'Battlefield V': {
    'Conquest': ['Win', 'Most Kills', 'Most Captures', 'Most Defends', 'Most Revives', 'Most Heals', 'Most Repairs'],
    'Team Deathmatch': ['Win', 'Most Kills', 'Highest K/D', 'Most Headshots', 'Most Revives', 'Most Heals'],
    'Breakthrough': ['Win', 'Most Kills', 'Most Objectives', 'Most Revives', 'Most Heals', 'Most Repairs'],
    'Grand Operations': ['Win', 'Most Kills', 'Most Objectives', 'Most Revives', 'Most Heals', 'Most Repairs'],
    'Frontlines': ['Win', 'Most Kills', 'Most Objectives', 'Most Revives', 'Most Heals', 'Most Repairs'],
    'Domination': ['Win', 'Most Kills', 'Most Captures', 'Most Defends', 'Most Revives', 'Most Heals'],
  },
  'Battlefield 2042': {
    'Conquest': ['Win', 'Most Kills', 'Most Captures', 'Most Defends', 'Most Revives', 'Most Heals', 'Most Repairs'],
    'Breakthrough': ['Win', 'Most Kills', 'Most Objectives', 'Most Revives', 'Most Heals', 'Most Repairs'],
    'Hazard Zone': ['Win', 'Most Kills', 'Most Data Drives', 'Most Revives', 'Most Heals', 'Most Repairs', 'Longest Survival'],
    'Portal': ['Win', 'Most Kills', 'Most Objectives', 'Most Revives', 'Most Heals', 'Most Repairs'],
  },
  'COD: Black Ops 6': {
    'Team Deathmatch': ['Win', 'Most Kills', 'Highest K/D', 'Most Assists', 'Most Headshots', 'Most Scorestreaks', 'Most Objectives'],
    'Domination': ['Win', 'Most Kills', 'Highest K/D', 'Most Captures', 'Most Defends', 'Most Scorestreaks', 'Most Objectives'],
    'Search and Destroy': ['Win', 'Most Kills', 'Most Plants', 'Most Defuses', 'Most Scorestreaks', 'Most Objectives'],
    'Free-for-All': ['Win', 'Most Kills', 'Highest K/D', 'Most Headshots', 'Most Scorestreaks'],
    'Hardpoint': ['Win', 'Most Kills', 'Most Time in Hardpoint', 'Most Scorestreaks', 'Most Objectives'],
    'Kill Confirmed': ['Win', 'Most Kills', 'Most Tags Collected', 'Most Scorestreaks', 'Most Objectives'],
    'Zombies': ['Win', 'Most Kills', 'Most Revives', 'Most Doors Opened', 'Most Power Ups', 'Most Objectives', 'Longest Survival'],
    'Warzone': ['Win', 'Most Kills', 'Highest K/D', 'Most Damage', 'Most Contracts', 'Most Cash Collected', 'Longest Survival'],
  },
};

const competitionFormats: Record<string, Record<string, string[]>> = {
  'FC25': {
    'Ultimate Team': ['1v1', '1v1v1', '1v1v1v1'],
    'Seasons': ['1v1', '1v1v1', '1v1v1v1'],
    'Kick Off': ['1v1', '1v1v1', '1v1v1v1'],
    'Pro Clubs': ['1v1', '1v1v1', '1v1v1v1'],
    'VOLTA Football': ['1v1', '1v1v1', '1v1v1v1'],
    'Career Mode': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'Fortnite': {
    'Battle Royale': ['1v1', '1v1v1', '1v1v1v1'],
    'Zero Build': ['1v1', '1v1v1', '1v1v1v1'],
    'Creative': ['1v1', '1v1v1', '1v1v1v1'],
    'Team Rumble': ['1v1', '1v1v1', '1v1v1v1'],
    'Save the World': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'Rocket League': {
    'Soccar': ['1v1', '1v1v1', '1v1v1v1'],
    'Rumble': ['1v1', '1v1v1', '1v1v1v1'],
    'Dropshot': ['1v1', '1v1v1', '1v1v1v1'],
    'Hoops': ['1v1', '1v1v1', '1v1v1v1'],
    'Snow Day': ['1v1', '1v1v1', '1v1v1v1'],
    'Tournament': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'COD:MW2': {
    'Team Deathmatch': ['1v1', '1v1v1', '1v1v1v1'],
    'Domination': ['1v1', '1v1v1', '1v1v1v1'],
    'Search and Destroy': ['1v1', '1v1v1', '1v1v1v1'],
    'Free-for-All': ['1v1', '1v1v1', '1v1v1v1'],
    'Hardpoint': ['1v1', '1v1v1', '1v1v1v1'],
    'Kill Confirmed': ['1v1', '1v1v1', '1v1v1v1'],
    'Warzone': ['1v1', '1v1v1', '1v1v1v1'],
    'Ground War': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'COD:MW3': {
    'Team Deathmatch': ['1v1', '1v1v1', '1v1v1v1'],
    'Domination': ['1v1', '1v1v1', '1v1v1v1'],
    'Search and Destroy': ['1v1', '1v1v1', '1v1v1v1'],
    'Free-for-All': ['1v1', '1v1v1', '1v1v1v1'],
    'Hardpoint': ['1v1', '1v1v1', '1v1v1v1'],
    'Kill Confirmed': ['1v1', '1v1v1', '1v1v1v1'],
    'Warzone': ['1v1', '1v1v1', '1v1v1v1'],
    'Ground War': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'Apex Legends': {
    'Battle Royale': ['1v1', '1v1v1', '1v1v1v1'],
    'Ranked': ['1v1', '1v1v1', '1v1v1v1'],
    'Arenas': ['1v1', '1v1v1', '1v1v1v1'],
    'LTMs': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'Battlefield V': {
    'Conquest': [],
    'Team Deathmatch': ['1v1', '1v1v1', '1v1v1v1'],
    'Breakthrough': [],
    'Grand Operations': [],
    'Frontlines': [],
    'Domination': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'Battlefield 2042': {
    'Conquest': [],
    'Breakthrough': [],
    'Hazard Zone': ['1v1', '1v1v1', '1v1v1v1'],
    'Portal': ['1v1', '1v1v1', '1v1v1v1'],
  },
  'COD: Black Ops 6': {
    'Team Deathmatch': ['1v1', '1v1v1', '1v1v1v1'],
    'Domination': ['1v1', '1v1v1', '1v1v1v1'],
    'Search and Destroy': ['1v1', '1v1v1', '1v1v1v1'],
    'Free-for-All': ['1v1', '1v1v1', '1v1v1v1'],
    'Hardpoint': ['1v1', '1v1v1', '1v1v1v1'],
    'Kill Confirmed': ['1v1', '1v1v1', '1v1v1v1'],
    'Zombies': [],
    'Warzone': ['1v1', '1v1v1', '1v1v1v1'],
  },
};

const formats = {
  'FC25': [
    { id: '1v1', name: '1v1' },
    { id: '2v2', name: '2v2' },
    { id: '3v3', name: '3v3' },
    { id: '4v4', name: '4v4' }
  ],
  'Rocket League': [
    { id: '1v1', name: '1v1' },
    { id: '2v2', name: '2v2' },
    { id: '3v3', name: '3v3' },
    { id: '4v4', name: '4v4' }
  ],
  'COD': [
    { id: 'solo', name: 'Solo' },
    { id: 'duos', name: 'Duos' },
    { id: 'trios', name: 'Trios' },
    { id: 'quads', name: 'Quads' }
  ],
  'Apex Legends': [
    { id: 'solo', name: 'Solo' },
    { id: 'duos', name: 'Duos' },
    { id: 'trios', name: 'Trios' }
  ],
  'Battlefield': [
    { id: 'solo', name: 'Solo' },
    { id: 'squads', name: 'Squads' }
  ]
};

const gamePlatforms: Record<string, string[]> = {
  'FC25': ['PC', 'Xbox', 'PlayStation', 'Nintendo', 'Cross-Gen'],
  'Fortnite': ['PC', 'Xbox', 'PlayStation', 'Nintendo', 'Mobile', 'Cross-Gen'],
  'Rocket League': ['PC', 'Xbox', 'PlayStation', 'Nintendo', 'Cross-Gen'],
  'COD:MW2': ['PC', 'Xbox', 'PlayStation', 'Cross-Gen'],
  'COD:MW3': ['PC', 'Xbox', 'PlayStation', 'Cross-Gen'],
  'Apex Legends': ['PC', 'Xbox', 'PlayStation', 'Nintendo', 'Mobile', 'Cross-Gen'],
  'Battlefield V': ['PC', 'Xbox', 'PlayStation', 'Cross-Gen'],
  'Battlefield 2042': ['PC', 'Xbox', 'PlayStation', 'Cross-Gen'],
  'COD: Black Ops 6': ['PC', 'Xbox', 'PlayStation', 'Cross-Gen'],
};

const buyInOptions = [0.5, 1, 2.5, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 500, 750, 1000];

// Helper to check for repeated/identical characters
function isRepetitive(str: string) {
  if (str.length < 2) return false;
  // Check if all characters are the same
  if (/^([a-zA-Z0-9])\1+$/.test(str)) return true;
  // Check if all characters are the same ignoring case
  if (/^([a-zA-Z])\1+$/i.test(str)) return true;
  // Check if all are numbers and the same
  if (/^([0-9])\1+$/.test(str)) return true;
  return false;
}

// Add enum/constant for match visibility
const MATCH_VISIBILITY = {
  PUBLIC: "public",
  FRIENDS: "friends",
  INVITE_ONLY: "invite_only",
} as const;

export default function MatchDetailsPage() {
  const searchParams = useSearchParams();
  const gameId = Number(searchParams.get('gameId'));
  const selectedGame = games.find((g) => g.id === gameId);
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [buyIn, setBuyIn] = useState<string>("");
  const [customBuyIn, setCustomBuyIn] = useState<string>("");
  const [matchName, setMatchName] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [visibility, setVisibility] = useState<typeof MATCH_VISIBILITY[keyof typeof MATCH_VISIBILITY]>(MATCH_VISIBILITY.PUBLIC);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]); // usernames or ids
  const [acknowledged, setAcknowledged] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rulesAcknowledged, setRulesAcknowledged] = useState(false);
  const [matchType, setMatchType] = useState<'versus' | 'coop' | null>(null);
  // Dummy friend list for autocomplete (replace with real data)
  const friendList = [
    { username: "alice" },
    { username: "bob" },
    { username: "charlie" },
  ];

  if (!selectedGame) {
    return <div className="text-center text-red-500 mt-10">Game not found.</div>;
  }

  // Calculate number of players based on selectedFormat
  let numPlayers = 0;
  if (selectedFormat === '1v1') numPlayers = 2;
  else if (selectedFormat === '1v1v1') numPlayers = 3;
  else if (selectedFormat === '1v1v1v1') numPlayers = 4;
  // Add more logic if you add more formats later

  // Determine buy-in value
  const buyInValue = buyIn === 'custom' ? parseFloat(customBuyIn) : parseFloat(buyIn);
  const isValidBuyIn = !isNaN(buyInValue) && buyInValue > 0;

  // Calculate potential winnings
  const totalPot = isValidBuyIn && numPlayers > 0 ? numPlayers * buyInValue : 0;
  const fee = totalPot * 0.10;
  const potentialWinnings = totalPot - fee;

  // Filter game modes to only those that have at least one competition type and one competition format
  const availableModes = gameModes[selectedGame.name]?.filter(
    mode =>
      competitionTypes[selectedGame.name]?.[mode]?.length > 0 &&
      competitionFormats[selectedGame.name]?.[mode]?.length > 0
  );

  // Reset dependent fields when parent field changes
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    setSelectedCompetition("");
    setSelectedFormat("");
    setMatchType(null);
  };

  const handleCompetitionChange = (competition: string) => {
    setSelectedCompetition(competition);
    setSelectedFormat("");
    setMatchType(null);
  };

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    setMatchType(null);
  };

  // Get available competition types for current mode
  const availableCompetitions = selectedMode ? competitionTypes[selectedGame.name]?.[selectedMode] || [] : [];

  // Get available formats for current mode and competition
  const availableFormats = selectedMode && selectedCompetition ? 
    competitionFormats[selectedGame.name]?.[selectedMode] || [] : [];

  // Get available platforms for current game
  const availablePlatforms = gamePlatforms[selectedGame.name] || [];

  // Helper: should show match type selector?
  function shouldShowMatchType(game: string, format: string) {
    // Only for games where both versus and co-op are possible (e.g., FC25, Rocket League)
    // and only for 1v1, 1v1v1, 1v1v1v1
    const gamesWithBoth = ['FC25', 'Rocket League'];
    return gamesWithBoth.includes(game) && ['1v1'].includes(format);
  }

  // Game rules text generator (now uses matchType)
  function getGameRules(game: string, mode: string, competition: string, format: string, matchType: 'versus' | 'coop' | null) {
    if (!game || !mode) return "Please select a game and mode to view the rules.";
    // FC25
    if (game === 'FC25') {
      if (shouldShowMatchType(game, format)) {
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
    // Rocket League (similar logic)
    if (game === 'Rocket League') {
      if (shouldShowMatchType(game, format)) {
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
    // Other games (simplified)
    // ... (keep previous logic for other games)
    if (game.startsWith('COD')) {
      return `Standard Call of Duty rules apply. The player/team with the most kills, highest K/D, or who wins the round (depending on competition type) wins. No third-party software, cheats, or exploits. Results must be documented if disputed.`;
    }
    if (game === 'Apex Legends') {
      return `Standard Apex Legends rules apply. The player/team with the most kills, most damage, or who survives the longest wins (depending on competition type). No teaming outside your squad. No cheats or exploits.`;
    }
    if (game.startsWith('Battlefield')) {
      return `Standard Battlefield rules apply. The player/team with the most kills, highest score, or who wins the round (depending on competition type) wins. No third-party software, cheats, or exploits.`;
    }
    return `Follow the official rules for ${game}. Play fair. No cheating, exploiting, or unsportsmanlike conduct.`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mt-10 mb-8 text-white drop-shadow-lg">
        Match Details
      </h1>
      <div className="bg-neutral-950 p-8 rounded-xl shadow-xl flex flex-col items-center gap-6">
        {/* Game Image and Name */}
        <div className="flex flex-col items-center gap-2">
          {/* Show uploaded media preview if available, else fallback to game image */}
          {mediaPreview ? (
            mediaType === "image" ? (
              <img src={mediaPreview} alt="Match media" className="rounded-lg max-h-48 object-contain border border-gray-700" />
            ) : (
              <video src={mediaPreview} controls className="rounded-lg max-h-48 object-contain border border-gray-700" />
            )
          ) : (
            <Image
              src={selectedGame.image}
              alt={selectedGame.name}
              width={200}
              height={200}
              className="rounded-lg"
            />
          )}
          <h2 className="text-2xl font-bold text-white">{selectedGame.name}</h2>
        </div>

        {/* Game Settings Section */}
        <div className="w-full max-w-xs space-y-6 bg-neutral-900 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-center mb-4">Game Settings</h3>
          
          {/* Game Mode dropdown */}
          <div>
            <label htmlFor="gameMode" className="block mb-2 text-lg font-semibold">Game Mode <span className="text-pink-500">*</span></label>
            <select
              id="gameMode"
              value={selectedMode}
              onChange={e => handleModeChange(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 focus:border-pink-500 focus:outline-none text-white"
              required
            >
              <option value="">Select a game mode</option>
              {availableModes?.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          {/* Competition Type dropdown */}
          <div>
            <label htmlFor="competitionType" className="block mb-2 text-lg font-semibold">Competition Type <span className="text-pink-500">*</span></label>
            <select
              id="competitionType"
              value={selectedCompetition}
              onChange={e => handleCompetitionChange(e.target.value)}
              className={`w-full p-3 rounded-lg border focus:border-pink-500 focus:outline-none text-white ${
                !selectedMode 
                  ? 'bg-neutral-700 border-gray-600 cursor-not-allowed' 
                  : 'bg-neutral-800 border-gray-700'
              }`}
              required
              disabled={!selectedMode}
            >
              <option value="">Select a competition type</option>
              {availableCompetitions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Competition Format dropdown */}
          <div>
            <label htmlFor="competitionFormat" className="block mb-2 text-lg font-semibold">Competition Format <span className="text-pink-500">*</span></label>
            <select
              id="competitionFormat"
              value={selectedFormat}
              onChange={e => handleFormatChange(e.target.value)}
              className={`w-full p-3 rounded-lg border focus:border-pink-500 focus:outline-none text-white ${
                !selectedCompetition 
                  ? 'bg-neutral-700 border-gray-600 cursor-not-allowed' 
                  : 'bg-neutral-800 border-gray-700'
              }`}
              required
              disabled={!selectedCompetition}
            >
              <option value="">Select a competition format</option>
              {availableFormats.map((format) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          {/* Match Type selector (only for relevant games and formats) */}
          {shouldShowMatchType(selectedGame.name, selectedFormat) && (
            <div>
              <label className="block mb-2 text-lg font-semibold">Match Type <span className="text-pink-500">*</span></label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="matchType"
                    value="versus"
                    checked={matchType === 'versus'}
                    onChange={() => setMatchType('versus')}
                    required
                  />
                  <span>Versus <span className="text-gray-400 text-sm">(Each player on their own team)</span></span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="matchType"
                    value="coop"
                    checked={matchType === 'coop'}
                    onChange={() => setMatchType('coop')}
                    required
                  />
                  <span>Co-op <span className="text-gray-400 text-sm">(All players on the same team, compete for stats)</span></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Platform and Buy-in Section */}
        <div className="w-full max-w-xs space-y-6 bg-neutral-900 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-center mb-4">Match Settings</h3>

          {/* Platform dropdown */}
          <div>
            <label htmlFor="platform" className="block mb-2 text-lg font-semibold">Platform <span className="text-pink-500">*</span></label>
            <select
              id="platform"
              value={selectedPlatform}
              onChange={e => setSelectedPlatform(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 focus:border-pink-500 focus:outline-none text-white"
              required
            >
              <option value="">Select a platform</option>
              {availablePlatforms.map((platform) => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>

          {/* Buy-in field */}
          <div>
            <label htmlFor="buyIn" className="block mb-2 text-lg font-semibold">Buy-in <span className="text-pink-500">*</span></label>
            <select
              id="buyIn"
              value={buyIn}
              onChange={e => setBuyIn(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 focus:border-pink-500 focus:outline-none text-white"
              required
            >
              <option value="">Select a buy-in amount</option>
              {buyInOptions.map((amount) => (
                <option key={amount} value={amount}>${amount}</option>
              ))}
              <option value="custom">Custom amount</option>
            </select>
            {buyIn === 'custom' && (
              <input
                type="number"
                value={customBuyIn}
                onChange={e => setCustomBuyIn(e.target.value)}
                placeholder="Enter custom amount"
                className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 focus:border-pink-500 focus:outline-none text-white mt-2"
                required
                min="0.01"
                step="0.01"
              />
            )}
          </div>

          {/* Potential winnings display */}
          {isValidBuyIn && numPlayers > 0 && (
            <div className="mt-4 bg-neutral-800 rounded-lg p-4 text-center border border-pink-500">
              <div className="text-lg font-semibold mb-1">Potential Winnings</div>
              <div className="text-2xl font-bold text-pink-400">${potentialWinnings.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-1">(10% fee: ${fee.toFixed(2)} from total pot: {numPlayers} × ${buyInValue.toFixed(2)})</div>
            </div>
          )}
        </div>

        {/* Game Rules section */}
        <div className="w-full max-w-xs space-y-6 bg-neutral-900 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-center mb-4">Game Rules</h3>
          <div className="bg-neutral-800 border border-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto text-sm text-gray-300 mb-2 whitespace-pre-line">
            <div className="mt-2">{getGameRules(selectedGame.name, selectedMode, selectedCompetition, selectedFormat, matchType)}</div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rulesAcknowledged}
              onChange={e => setRulesAcknowledged(e.target.checked)}
              required
            />
            <span className="text-sm">I have read and understand the rules above</span>
          </label>
        </div>

        {/* Match Visibility section */}
        <div className="w-full max-w-xs">
          <label className="block mb-2 text-lg font-semibold">Visibility <span className="text-pink-500">*</span></label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value={MATCH_VISIBILITY.PUBLIC}
                checked={visibility === MATCH_VISIBILITY.PUBLIC}
                onChange={() => setVisibility(MATCH_VISIBILITY.PUBLIC)}
              />
              <span>Public <span className="text-gray-400 text-sm">(Everyone can join)</span></span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value={MATCH_VISIBILITY.FRIENDS}
                checked={visibility === MATCH_VISIBILITY.FRIENDS}
                onChange={() => setVisibility(MATCH_VISIBILITY.FRIENDS)}
              />
              <span>Friends <span className="text-gray-400 text-sm">(Only your friends can join)</span></span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value={MATCH_VISIBILITY.INVITE_ONLY}
                checked={visibility === MATCH_VISIBILITY.INVITE_ONLY}
                onChange={() => setVisibility(MATCH_VISIBILITY.INVITE_ONLY)}
              />
              <span>Invite Only <span className="text-gray-400 text-sm">(Only invited users can join)</span></span>
            </label>
          </div>
        </div>
        {/* Invite users autocomplete (only if Invite Only) */}
        {visibility === MATCH_VISIBILITY.INVITE_ONLY && (
          <div className="w-full max-w-xs mt-2">
            <label className="block mb-2 text-lg font-semibold">Invite Friends</label>
            <input
              type="text"
              placeholder="Type to search friends..."
              className="w-full p-3 rounded-lg bg-neutral-900 border border-gray-700 focus:border-pink-500 focus:outline-none text-white"
              onChange={e => {
                // For demo: filter friendList and show suggestions (implement real autocomplete later)
                // You can add a dropdown/autocomplete here in the future
              }}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {invitedUsers.map(user => (
                <span key={user} className="bg-pink-500 text-white rounded-full px-3 py-1 text-sm">{user}</span>
              ))}
            </div>
            {/* For demo: show all friends as clickable to add/remove */}
            <div className="flex flex-wrap gap-2 mt-2">
              {friendList.map(friend => (
                <button
                  type="button"
                  key={friend.username}
                  className={`px-3 py-1 rounded-full border ${invitedUsers.includes(friend.username) ? 'bg-pink-500 text-white' : 'bg-neutral-800 text-pink-400 border-pink-400'}`}
                  onClick={() => {
                    setInvitedUsers(prev =>
                      prev.includes(friend.username)
                        ? prev.filter(u => u !== friend.username)
                        : prev.length < (numPlayers - 1) // Only allow up to numPlayers-1 invites
                          ? [...prev, friend.username]
                          : prev
                    );
                  }}
                  disabled={
                    !invitedUsers.includes(friend.username) && invitedUsers.length >= (numPlayers - 1)
                  }
                >
                  {friend.username}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-1">You can invite up to {numPlayers - 1} friends.</div>
          </div>
        )}
        {/* Terms and acknowledgement section */}
        <div className="w-full max-w-xs mt-4">
          <div className="bg-neutral-900 border border-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto text-sm text-gray-300 mb-2">
            <b>Important: Please read and accept before creating a match</b>
            <ul className="list-disc ml-5 mt-2">
              <li>You are at least 18 years old, or of legal age to participate in skill-based competitions with monetary stakes in your jurisdiction.</li>
              <li>You understand that participating in matches with a buy-in involves financial risk, and you may lose your buy-in amount.</li>
              <li>You are solely responsible for your actions and any losses incurred.</li>
              <li>You agree to play fairly and abide by the platform's rules and code of conduct.</li>
              <li>All buy-ins are final and non-refundable, except in cases of technical error or match cancellation as determined by the platform.</li>
              <li>You have read and agree to the platform's <a href="/terms" className="underline text-pink-400" target="_blank">Terms of Service</a> and <a href="/responsible-gaming" className="underline text-pink-400" target="_blank">Responsible Gaming Policy</a>.</li>
            </ul>
            <div className="mt-2 font-semibold text-pink-400">If you do not agree, do not create a match with a buy-in.</div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              required
            />
            <span className="text-sm">I have read and accept the terms above</span>
          </label>
        </div>
        {/* Media upload section */}
        <div className="w-full max-w-xs flex flex-col items-center gap-2">
          <label className="block text-lg font-semibold mb-1">Match Image or Video</label>
          {mediaPreview ? (
            <div className="relative w-full flex flex-col items-center">
              {mediaType === "image" ? (
                <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-48 object-contain border border-gray-700" />
              ) : (
                <video src={mediaPreview} controls className="rounded-lg max-h-48 object-contain border border-gray-700" />
              )}
              <div className="flex gap-2 mt-2">
                <button type="button" className="px-3 py-1 rounded bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition" onClick={() => fileInputRef.current?.click()}>
                  Change
                </button>
                <button type="button" className="px-3 py-1 rounded bg-gray-700 text-white text-xs font-semibold hover:bg-gray-800 transition" onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border-2 border-dashed border-pink-400 text-pink-400 bg-neutral-800 hover:bg-neutral-700 transition text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload image or short video (max 6 sec)
              </button>
              <span className="text-xs text-gray-400">Accepted: JPG, PNG, GIF, MP4, MOV, WebM</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              // Check file type
              if (file.type.startsWith("image/")) {
                setMediaType("image");
                setMediaFile(file);
                setMediaPreview(URL.createObjectURL(file));
              } else if (file.type.startsWith("video/")) {
                // Check video duration (after loading)
                const url = URL.createObjectURL(file);
                const video = document.createElement("video");
                video.preload = "metadata";
                video.onloadedmetadata = () => {
                  window.URL.revokeObjectURL(url);
                  if (video.duration > 6) {
                    alert("Video must be 6 seconds or less.");
                    setMediaFile(null);
                    setMediaPreview(null);
                    setMediaType(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  } else {
                    setMediaType("video");
                    setMediaFile(file);
                    setMediaPreview(url);
                  }
                };
                video.src = url;
              } else {
                alert("Unsupported file type.");
                setMediaFile(null);
                setMediaPreview(null);
                setMediaType(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          />
        </div>
        {/* Match Name field - moved to bottom */}
        <div className="w-full max-w-xs">
          <label htmlFor="matchName" className="block mb-2 text-lg font-semibold">Name <span className="text-pink-500">*</span></label>
          <input
            id="matchName"
            type="text"
            value={matchName}
            onChange={e => {
              setMatchName(e.target.value);
              const val = e.target.value.trim();
              if (val.length < 6) {
                setNameError("Name must be at least 6 characters.");
              } else if (isRepetitive(val)) {
                setNameError("Name cannot be just repeated or identical characters, e.g., 'aaaaaa' or '111111'.");
              } else {
                setNameError("");
              }
            }}
            placeholder="Give your match a fun name!"
            className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 focus:border-pink-500 focus:outline-none text-white"
            required
            minLength={6}
          />
          {nameError && <div className="text-red-500 text-sm mt-1">{nameError}</div>}
        </div>
        <button
          type="submit"
          className={`w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 rounded-lg mt-6 transition hover:opacity-90 ${
            !!nameError ||
            matchName.trim().length < 6 ||
            !selectedMode ||
            !selectedCompetition ||
            !selectedFormat ||
            !selectedPlatform ||
            !isValidBuyIn ||
            (visibility === MATCH_VISIBILITY.INVITE_ONLY && invitedUsers.length !== numPlayers - 1) ||
            !acknowledged ||
            !rulesAcknowledged ||
            (shouldShowMatchType(selectedGame.name, selectedFormat) && !matchType)
              ? 'opacity-50 cursor-not-allowed grayscale' : ''
          }`}
          disabled={
            !!nameError ||
            matchName.trim().length < 6 ||
            !selectedMode ||
            !selectedCompetition ||
            !selectedFormat ||
            !selectedPlatform ||
            !isValidBuyIn ||
            (visibility === MATCH_VISIBILITY.INVITE_ONLY && invitedUsers.length !== numPlayers - 1) ||
            !acknowledged ||
            !rulesAcknowledged ||
            (shouldShowMatchType(selectedGame.name, selectedFormat) && !matchType)
          }
        >
          Create Match
        </button>
      </div>
    </div>
  );
} 