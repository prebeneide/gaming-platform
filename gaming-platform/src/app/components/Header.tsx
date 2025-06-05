import Link from "next/link";
import SearchBar from "../dashboard/SearchBar";
import { FiUser, FiCreditCard, FiMenu, FiMessageSquare } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";

interface HeaderProps {
  isLoggedIn?: boolean;
  onOpenMenu?: () => void;
}

interface MessagesReadData {
  senderId: string;
  receiverId: string;
  count: number;
  timestamp: string;
}

export default function Header({ isLoggedIn = false, onOpenMenu }: HeaderProps) {
  const [iconSize, setIconSize] = useState(24);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    function handleResize() {
      setIconSize(window.innerWidth <= 380 ? 16 : 24);
    }
    handleResize(); // Set initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Hent antall uleste meldinger
  useEffect(() => {
    if (!session?.user) return;

    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/messages/unread");
        if (!res.ok) throw new Error("Failed to fetch unread count");
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    }

    fetchUnreadCount();

    // Koble til Socket.IO for sanntidsoppdateringer
    const socket = io("http://localhost:4000");

    socket.on("chat message", () => {
      fetchUnreadCount(); // Oppdater når ny melding kommer
    });

    socket.on("messages read", (data: MessagesReadData) => {
      console.log("[Header] Messages marked as read:", data);
      // Hvis vi er mottakeren av meldingene som ble lest
      if (data.receiverId === session.user.id) {
        fetchUnreadCount(); // Oppdater antall uleste meldinger
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [session]);

  return (
    <header className="sticky top-0 z-30 w-full bg-black/80 backdrop-blur shadow-sm flex px-0 header-main border-b-0" style={{position: 'sticky', top: 0, zIndex: 30, width: '100%'}}>
      <div className="flex w-full items-center header-flex-wrap">
        <div className="header-row-1 w-full">
          <div className="flex items-center px-4 flex-shrink-0 logo-wrapper header-logo">
            <Link
              href={isLoggedIn ? "/dashboard" : "/"}
              className="flex items-center gap-2"
            >
              <span className="logo-animated-gradient text-xl font-bold bg-clip-text text-transparent select-none">
                GameChallenger
              </span>
            </Link>
          </div>
          {isLoggedIn && (
            <div className="header-searchbar-desktop">
              <div className="w-full max-w-xl mx-auto">
                <SearchBar />
              </div>
            </div>
          )}
          {isLoggedIn ? (
            <div className="flex items-center gap-4 pr-4 flex-shrink-0 header-buttons">
              <Link href="/messages" aria-label="Messages" className="text-white hover:text-[#00c6fb] transition-colors relative">
                <FiMessageSquare size={iconSize} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/profile" aria-label="Profile" className="text-white hover:text-[#00c6fb] transition-colors">
                <FiUser size={iconSize} />
              </Link>
              <Link href="/wallet" aria-label="Wallet" className="text-white hover:text-[#8b5cf6] transition-colors">
                <FiCreditCard size={iconSize} />
              </Link>
              <button aria-label="Menu" className="text-white hover:text-[#f6369a] transition-colors bg-transparent border-0 p-0 m-0" onClick={onOpenMenu}>
                <FiMenu size={iconSize} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pr-4 flex-shrink-0 header-buttons">
              <Link href="/login" className="text-pink-500 hover:text-pink-600 font-semibold px-3 py-2 rounded transition">
                Login
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 signup-gradient-btn rounded-lg text-white font-semibold transition">
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
        {isLoggedIn && (
          <div className="header-row-2 w-full">
            <div className="header-searchbar-mobile w-full max-w-xl mx-auto px-2">
              <SearchBar />
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .header-main::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: linear-gradient(90deg, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb);
          background-size: 1000% 100%;
          animation: borderGradientMove 32s linear infinite alternate;
          border-radius: 2px;
        }
        @keyframes borderGradientMove {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        .logo-animated-gradient {
          background: linear-gradient(90deg, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb, #8b5cf6, #ec4899, #8b5cf6, #00c6fb);
          background-size: 1000% 100%;
          animation: borderGradientMove 32s linear infinite alternate;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
        }
        .header-flex-wrap {
          flex-direction: column;
        }
        .header-row-1 {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
        .header-row-2 {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }
        .header-searchbar-desktop {
          display: flex;
        }
        .header-searchbar-mobile {
          display: none;
        }
        @media (min-width: 751px) {
          .header-flex-wrap {
            flex-direction: row;
            align-items: center;
          }
          .header-row-1 {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            justify-content: center;
            width: 100%;
            gap: 0;
          }
          .header-searchbar-desktop {
            justify-self: center;
            width: 100%;
            max-width: 420px;
            margin-left: auto;
            margin-right: auto;
          }
          .header-buttons {
            justify-self: end;
          }
          .header-row-2 {
            display: none;
          }
          .header-main {
            height: 80px;
            min-height: 80px;
            max-height: 80px;
          }
        }
        @media (max-width: 750px) {
          .header-main {
            flex-direction: column;
            align-items: stretch;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
          }
          .header-flex-wrap {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          .header-row-1 {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 1.2rem 0 1.2rem 0;
          }
          .header-row-2 {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 1.2rem 0 1.2rem 0;
          }
          .header-searchbar-desktop {
            display: none;
          }
          .header-searchbar-mobile {
            display: flex;
            width: 100%;
            max-width: 100%;
            margin: 0 0.5rem;
          }
        }
        @media (max-width: 380px) {
          .logo-animated-gradient {
            font-size: 1rem !important;
            padding: 0 !important;
          }
          .header-logo {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .header-buttons a,
          .header-buttons button {
            padding: 0.3rem 0.7rem !important;
          }
        }
        .signup-gradient-btn {
          background: linear-gradient(90deg, #00c6fb, #8b5cf6, #f6369a);
          transition: filter 0.2s, box-shadow 0.2s;
        }
        .signup-gradient-btn:hover, .signup-gradient-btn:focus {
          filter: brightness(1.15) saturate(1.2);
          box-shadow: 0 2px 16px 0 #8b5cf6cc;
        }
      `}</style>
    </header>
  );
} 