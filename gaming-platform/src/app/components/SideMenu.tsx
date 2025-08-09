import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FiUser, FiCreditCard, FiSettings, FiLogOut, FiHome, FiUsers } from "react-icons/fi";
import { signOut, useSession } from "next-auth/react";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: <FiHome /> },
  { href: "/profile", label: "Profile", icon: <FiUser /> },
  { href: "/friends", label: "Friend Requests", icon: <FiUsers /> },
  { href: "/friends/overview", label: "Friends", icon: <FiUsers /> },
  { href: "/wallet", label: "Wallet", icon: <FiCreditCard /> },
];

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const { data: session } = useSession();
  
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-xs z-50 flex flex-col bg-neutral-950 shadow-2xl rounded-l-2xl border-l border-neutral-900 transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Side menu"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-500 p-[2px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-neutral-950">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiUser color="#9ca3af" size={20} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm">
                {(session?.user as any)?.displayName || session?.user?.username || 'User'}
              </span>
              <span className="text-gray-400 text-xs">
                {session?.user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-3xl text-pink-500 hover:text-pink-400 transition-colors focus:outline-none"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex flex-col divide-y divide-neutral-900">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-4 px-6 py-4 text-white text-base font-semibold hover:bg-neutral-800 transition-colors group"
              >
                <span className="w-6 h-6 flex items-center justify-center text-pink-400 group-hover:text-pink-500 transition-colors">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="h-px bg-neutral-800 mx-4 my-2" />
          <div className="flex flex-col divide-y divide-neutral-900">
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-4 px-6 py-4 text-white text-base font-semibold hover:bg-neutral-800 transition-colors group"
            >
              <span className="w-6 h-6 flex items-center justify-center text-pink-400 group-hover:text-pink-500 transition-colors">
                <FiSettings />
              </span>
              <span className="flex-1">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-6 py-4 text-white text-base font-semibold hover:bg-neutral-800 transition-colors group w-full text-left"
            >
              <span className="w-6 h-6 flex items-center justify-center text-pink-400 group-hover:text-pink-500 transition-colors">
                <FiLogOut />
              </span>
              <span className="flex-1">Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
} 