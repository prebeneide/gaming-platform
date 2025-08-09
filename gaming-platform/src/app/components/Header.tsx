import Link from "next/link";
import SearchBar from "../dashboard/SearchBar";
import { FiUser, FiCreditCard, FiMenu, FiMessageSquare, FiArrowLeft, FiBell, FiCompass, FiActivity } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
import { FaGamepad } from "react-icons/fa";
import { usePathname } from "next/navigation";
import Image from "next/image";

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
  const [notificationCount, setNotificationCount] = useState(0);
  const { data: session } = useSession();
  const [activeMatch, setActiveMatch] = useState<{ id: string; name: string } | null>(null);
  const pathname = usePathname();
  const isChatPage = pathname.startsWith("/chat/");
  const [otherUser, setOtherUser] = useState<{ username: string; displayName?: string; image?: string } | null>(null);

  useEffect(() => {
    function handleResize() {
      setIconSize(window.innerWidth <= 380 ? 16 : 24);
    }
    handleResize(); // Set initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Hent aktiv match for snarvei
  useEffect(() => {
    if (!session?.user) return;
    async function fetchActiveMatch() {
      try {
        const res = await fetch("/api/matches/active");
        if (res.ok) {
          const data = await res.json();
          if (data.activeMatch) {
            setActiveMatch({ id: data.activeMatch.id, name: data.activeMatch.name });
          } else {
            setActiveMatch(null);
          }
        }
      } catch (e) {
        setActiveMatch(null);
      }
    }
    fetchActiveMatch();
  }, [session]);

  // Hent antall uleste meldinger og notifications
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

    async function fetchNotificationCount() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) {
          console.log("Notifications API not ready yet, setting count to 0");
          setNotificationCount(0);
          return;
        }
        const data = await res.json();
        const unreadNotifications = data.notifications?.filter((n: any) => !n.isRead) || [];
        setNotificationCount(unreadNotifications.length);
      } catch (error) {
        console.error("Error fetching notification count:", error);
        setNotificationCount(0);
      }
    }

    fetchUnreadCount();
    fetchNotificationCount();

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

  // Hent brukerinfo for chat-sider
  useEffect(() => {
    if (!isChatPage) return;
    
    const username = pathname.split('/')[2]; // /chat/[username] -> username
    if (username) {
      fetch(`/api/search-users?query=${username}`)
        .then(res => res.json())
        .then(users => {
          if (users.length > 0) {
            setOtherUser(users[0]);
          }
        })
        .catch(err => console.error('Error fetching user:', err));
    }
  }, [pathname, isChatPage]);

  useEffect(() => {
    let timer: any;
    const ping = async () => {
      try {
        await fetch("/api/heartbeat", { method: "POST" });
      } catch {}
    };
    ping();
    timer = setInterval(ping, 60_000);
    return () => clearInterval(timer);
  }, []);

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
          {/* Header buttons (right side) */}
          {isLoggedIn ? (
            <div className="flex items-center gap-4 pr-4 flex-shrink-0 header-buttons">
              {activeMatch && (
                <Link
                  href={`/matches/${activeMatch.id}`}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-yellow-200/60 transition relative group"
                  style={{ minWidth: 0 }}
                  title={`Go to your active match: ${activeMatch.name}`}
                >
                  <FiActivity color="rgb(219, 39, 119)" size={iconSize - 2} />
                  <span className="hidden md:inline truncate max-w-[90px] text-xs font-semibold text-yellow-300 group-hover:text-pink-600 transition">{activeMatch.name}</span>
                  {/* Tooltip for mobile */}
                  <span className="md:hidden absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-black text-yellow-200 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-yellow-400">{activeMatch.name}</span>
                </Link>
              )}
              <Link href="/messages" aria-label="Messages" className="text-white hover:text-[#00c6fb] transition-colors relative hidden sm:block">
                <FiMessageSquare size={iconSize} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/notifications" aria-label="Notifications" className="text-white hover:text-[#f6369a] transition-colors relative">
                <FiBell size={iconSize} />
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
              {/* Match Feed */}
              <Link href="/matches" aria-label="Match Feed" className="text-white hover:text-[#00c6fb] transition-colors hidden sm:block" title="Match Feed">
                <FiCompass size={iconSize} />
              </Link>
              {/* Create Match */}
              <Link href="/matches/new" aria-label="Create Match" className="text-white hover:text-[#f6369a] transition-colors hidden sm:block" title="Create Match">
                <FaGamepad size={iconSize} />
              </Link>
              <Link href="/wallet" aria-label="Wallet" className="text-white hover:text-[#8b5cf6] transition-colors hidden sm:block">
                <FiCreditCard size={iconSize} />
              </Link>
              <Link href="/dashboard" aria-label="Profile" className="flex items-center gap-2 text-white hover:text-[#00c6fb] transition-colors">
                {session?.user?.image ? (
                  <>
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-pink-500">
                      <Image
                        src={session.user.image}
                        alt={(session.user as any)?.displayName || session.user.username || "Profile"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {(session.user as any)?.displayName || session.user.username}
                    </span>
                  </>
                ) : (
                  <FiUser size={iconSize} />
                )}
              </Link>
              <button aria-label="Menu" className="text-white hover:text-[#f6369a] transition-colors bg-transparent border-0 p-0 m-0" onClick={onOpenMenu}>
                <FiMenu size={iconSize} />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pr-4 flex-shrink-0 header-buttons">
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
        {isChatPage && otherUser && (
          <div className="header-row-3 w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900 bg-neutral-950 w-full">
              <div className="flex items-center gap-4">
                <Image
                  src={otherUser.image || "/default-avatar.svg"}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="rounded-full aspect-square object-cover w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-lg">{otherUser.displayName || otherUser.username}</span>
                  <span className="text-xs text-gray-400">@{otherUser.username}</span>
                </div>
              </div>
              <Link href="/messages" className="text-white hover:text-[#00c6fb] transition-colors">
                <FiArrowLeft size={24} />
              </Link>
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
        .header-row-3::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
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
        .header-row-3 {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          position: relative;
        }
        .header-searchbar-desktop {
          display: flex;
        }
        .header-searchbar-mobile {
          display: none;
        }
        @media (min-width: 751px) {
          .header-flex-wrap {
            flex-direction: column;
            align-items: stretch;
          }
          .header-row-1 {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            justify-content: center;
            width: 100%;
            gap: 0;
            padding: 1rem 0;
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
          .header-row-3 {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            padding: 0;
          }
          .header-main {
            height: auto;
            min-height: 80px;
            max-height: none;
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
          .header-row-3 {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            padding: 0;
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
        @media (max-width: 640px) {
          .header-buttons {
            gap: 0.5rem !important;
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