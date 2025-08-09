"use client";

import Image from "next/image";

export type PresenceStatus = "online" | "recent" | "offline";

export default function AvatarPresence({
  src,
  alt,
  size = 48,
  status,
  ring = true,
}: {
  src?: string | null;
  alt: string;
  size?: number; // px
  status?: PresenceStatus;
  ring?: boolean;
}) {
  const dim = size;
  const containerClass = ring
    ? "bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full"
    : "";

  const dotColor = status === "online" ? "bg-green-500"
    : status === "recent" ? "bg-orange-400"
    : status === "offline" ? "bg-gray-500"
    : "";

  return (
    <div className={`relative inline-block ${containerClass}`} style={{ lineHeight: 0 }}>
      <div className="rounded-full overflow-hidden bg-neutral-950" style={{ width: dim, height: dim }}>
        {src ? (
          <Image src={src} alt={alt} width={dim} height={dim} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      {status && (
        <span className={`absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full ring-2 ring-neutral-950 ${dotColor}`} />
      )}
    </div>
  );
} 