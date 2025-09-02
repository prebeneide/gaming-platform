import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  user: {
    image?: string | null;
    username?: string | null;
    displayName?: string | null;
  };
  size?: number;
  showPresence?: boolean;
  presenceStatus?: "online" | "recent" | "offline";
  className?: string;
  ring?: boolean; // Add gradient ring like AvatarPresence
}

export default function UserAvatar({ 
  user, 
  size = 40, 
  showPresence = false, 
  presenceStatus = "offline",
  className = "",
  ring = false
}: UserAvatarProps) {
  const dim = size;

  // Get initials from username or displayName
  const getInitials = (text: string): string => {
    if (!text) return "?";
    
    // Handle camelCase names (e.g., "MarcellaGirl" -> "MG")
    const camelCaseMatches = text.match(/[A-Z][a-z]*/g);
    if (camelCaseMatches && camelCaseMatches.length >= 2) {
      return (camelCaseMatches[0][0] + camelCaseMatches[1][0]).toUpperCase();
    }
    
    // Handle space/hyphen/underscore separated names
    const words = text.split(/[\s\-_]+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    
    // Handle single words - take first two characters if available
    if (text.length >= 2) {
      return text.substring(0, 2).toUpperCase();
    }
    
    // Fallback to first character
    return text[0]?.toUpperCase() || "?";
  };

  // Determine what to display
  const hasImage = !!user.image;
  const username = user.username || user.displayName || "User";
  const initials = getInitials(username);

  // Get presence dot color
  const getPresenceDotColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "recent": return "bg-orange-400";
      case "offline": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  // Container with optional gradient ring
  const containerClass = ring
    ? "bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full"
    : "";

  return (
    <div className={`relative inline-block ${containerClass} ${className}`} style={{ lineHeight: 0 }}>
      <div className="rounded-full overflow-hidden bg-neutral-950" style={{ width: dim, height: dim }}>
        {hasImage ? (
          <Image 
            src={user.image!} 
            alt={`${username} avatar`} 
            width={dim} 
            height={dim} 
            className="object-cover w-full h-full" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-800">
            <span 
              className="text-white font-semibold select-none"
              style={{ 
                fontSize: Math.max(12, Math.floor(size * 0.3))
              }}
            >
              {initials}
            </span>
          </div>
        )}
      </div>
      
      {showPresence && (
        <span 
          className={`absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full ring-2 ring-neutral-950 ${getPresenceDotColor(presenceStatus)}`} 
        />
      )}
    </div>
  );
} 