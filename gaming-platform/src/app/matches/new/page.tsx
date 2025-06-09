"use client";

import Image from 'next/image';
import { useState } from 'react';

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
    image: '/Images/Rocket League/d37e92eaeab39c4e1cb20495cb903bb7.jpg',
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

export default function CreateMatchPage() {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mt-10 mb-8 text-white drop-shadow-lg">
        Create a new match
      </h1>
      <div className="bg-neutral-950 p-8 rounded-xl shadow-xl w-full max-w-none md:w-11/12 lg:w-10/12 xl:w-9/12 mx-auto flex flex-col gap-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow">
          Pick a game
        </h2>
        <div className="flex flex-row gap-8 overflow-x-auto pb-2 px-6 hide-scrollbar scroll-smooth snap-x snap-mandatory">
          <div className="min-w-[12px] md:min-w-[32px] snap-start" aria-hidden="true" />
          {games.map((game) => (
            <div
              key={game.id}
              className={`flex flex-col items-center snap-start transition-transform`}
            >
              <button
                type="button"
                onClick={() => setSelectedGame(game.id)}
                className={`w-[160px] h-[220px] relative rounded-xl overflow-hidden mt-2 transition-all duration-200 focus:outline-none
                  ${selectedGame === game.id ? 'ring-4 ring-pink-500 ring-offset-2 ring-offset-neutral-950' : 'hover:scale-105'}
                `}
                aria-pressed={selectedGame === game.id}
              >
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-xl"
                  sizes="160px"
                />
              </button>
              <h2 className="text-base font-semibold mt-4 text-center mb-2 px-2 break-words w-full text-white drop-shadow-lg">
                {game.name}
              </h2>
            </div>
          ))}
          <div className="min-w-[12px] md:min-w-[32px] snap-end" aria-hidden="true" />
        </div>
        <div className="flex justify-center mt-4">
          <button
            className={`font-semibold py-2 px-6 rounded-lg transition text-white
              ${selectedGame ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
            disabled={!selectedGame}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
} 