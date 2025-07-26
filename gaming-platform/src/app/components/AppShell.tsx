"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import { AuthProvider } from "@/components/AuthProvider";
import { useSession } from "next-auth/react";
import SideMenu from "./SideMenu";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiUser, FiCreditCard, FiMenu, FiMessageSquare, FiActivity, FiCompass } from "react-icons/fi";
import { FaTrophy, FaGamepad } from "react-icons/fa";
import io from "socket.io-client";
import Image from "next/image";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );
}

function BottomNavigation({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeMatch, setActiveMatch] = useState<{ id: string; name: string } | null>(null);
  const isChatPage = pathname.startsWith("/chat/");

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

    socket.on("messages read", (data: any) => {
      console.log("[BottomNav] Messages marked as read:", data);
      // Hvis vi er mottakeren av meldingene som ble lest
      if (data.receiverId === session.user.id) {
        fetchUnreadCount(); // Oppdater antall uleste meldinger
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [session]);

  if (!session?.user) return null;

  return (
    <nav className={`fixed ${isChatPage ? 'top-0 border-b' : 'bottom-0 border-t'} left-0 right-0 z-40 bg-black/90 border-neutral-800 flex justify-around items-center py-2 sm:hidden`}>
      <Link href="/messages" aria-label="Messages" className="flex flex-col items-center text-white hover:text-[#00c6fb] transition-colors relative">
        <FiMessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 left-4 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
      <Link href="/matches" aria-label="Match Feed" className="flex flex-col items-center text-white hover:text-[#00c6fb] transition-colors">
        <FiCompass size={24} />
      </Link>
      <Link href="/matches/new" aria-label="Create Match" className="flex flex-col items-center text-white hover:text-[#f6369a] transition-colors">
        <FaGamepad size={24} />
      </Link>
      {activeMatch && (
        <Link href={`/matches/${activeMatch.id}`} aria-label="Active Match" className="flex flex-col items-center text-yellow-300 hover:text-pink-600 transition-colors">
          <FiActivity size={22} />
        </Link>
      )}
      <Link href="/wallet" aria-label="Wallet" className="flex flex-col items-center text-white hover:text-[#8b5cf6] transition-colors">
        <FiCreditCard size={24} />
      </Link>
      <button aria-label="Menu" className="flex flex-col items-center text-white hover:text-[#f6369a] transition-colors bg-transparent border-0 p-0 m-0" onClick={onOpenMenu}>
        <FiMenu size={24} />
      </button>
    </nav>
  );
}



function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isChatPage = pathname.startsWith("/chat/");
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (status === "loading") {
    return <Loader />;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header isLoggedIn={!!session?.user} onOpenMenu={() => setMenuOpen(true)} />

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="pb-16 sm:pb-0">
        {children}
      </div>
      {!isChatPage && <BottomNavigation onOpenMenu={() => setMenuOpen(true)} />}
    </>
  );
} 