"use client";

import { useState } from "react";
import SocialListModal, { SocialListType } from "./SocialListModal";

export default function SocialCounts({
  username,
  counts,
  condensed,
}: {
  username: string;
  counts: { followers: number; following: number; friends: number };
  condensed?: boolean; // smaller text on tight spaces
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SocialListType>("followers");

  const labelClass = condensed ? "text-pink-400 text-xs" : "text-pink-400 text-sm";
  const numberClass = condensed ? "text-xl" : "text-2xl";

  return (
    <>
      <div className="flex justify-center items-center gap-8">
        <button
          className="flex flex-col items-center focus:outline-none group"
          onClick={() => {
            setType("followers");
            setOpen(true);
          }}
          aria-label="View followers"
        >
          <span className={`${numberClass} font-bold text-white group-hover:text-pink-300 transition`}>{counts.followers}</span>
          <span className={labelClass}>Followers</span>
        </button>
        <button
          className="flex flex-col items-center focus:outline-none group"
          onClick={() => {
            setType("following");
            setOpen(true);
          }}
          aria-label="View following"
        >
          <span className={`${numberClass} font-bold text-white group-hover:text-pink-300 transition`}>{counts.following}</span>
          <span className={labelClass}>Following</span>
        </button>
        <button
          className="flex flex-col items-center focus:outline-none group"
          onClick={() => {
            setType("friends");
            setOpen(true);
          }}
          aria-label="View friends"
        >
          <span className={`${numberClass} font-bold text-white group-hover:text-pink-300 transition`}>{counts.friends}</span>
          <span className={labelClass}>Friends</span>
        </button>
      </div>
      <SocialListModal
        isOpen={open}
        onClose={() => setOpen(false)}
        username={username}
        type={type}
      />
    </>
  );
} 