import React from "react";
import { FiUser, FiCreditCard, FiSettings, FiLogOut, FiHome } from "react-icons/fi";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: <FiHome /> },
  { href: "/profile", label: "Profile", icon: <FiUser /> },
  { href: "/wallet", label: "Wallet", icon: <FiCreditCard /> },
];
const secondaryItems = [
  { href: "/settings", label: "Settings", icon: <FiSettings /> },
  { href: "/logout", label: "Log out", icon: <FiLogOut /> },
];

export default function SideMenu({ open, onClose }: SideMenuProps) {
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
        <div className="flex items-center justify-end px-6 py-5 border-b border-neutral-800">
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
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-6 py-4 text-white text-base font-semibold hover:bg-neutral-800 transition-colors group"
              >
                <span className="w-6 h-6 flex items-center justify-center text-pink-400 group-hover:text-pink-500 transition-colors">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </a>
            ))}
          </div>
          <div className="h-px bg-neutral-800 mx-4 my-2" />
          <div className="flex flex-col divide-y divide-neutral-900">
            {secondaryItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-6 py-4 text-white text-base font-semibold hover:bg-neutral-800 transition-colors group"
              >
                <span className="w-6 h-6 flex items-center justify-center text-pink-400 group-hover:text-pink-500 transition-colors">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
} 