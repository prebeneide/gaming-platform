"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FiHome, 
  FiUsers, 
  FiAlertTriangle, 
  FiActivity, 
  FiDollarSign, 
  FiAward, 
  FiSettings,
  FiMenu,
  FiX,
  FiMessageCircle
} from "react-icons/fi";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: FiHome, href: "/admin" },
  { id: "users", label: "User Management", icon: FiUsers, href: "/admin/users" },
  { id: "support", label: "Support", icon: FiMessageCircle, href: "/admin/support" },
  { id: "disputes", label: "Disputes", icon: FiAlertTriangle, href: "/admin/disputes" },
  { id: "activity", label: "All Activity", icon: FiActivity, href: "/admin/activity" },
  { id: "transactions", label: "All Transactions", icon: FiDollarSign, href: "/admin/transactions" },
  { id: "matches", label: "All Matches", icon: FiAward, href: "/admin/matches" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/admin/settings" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-neutral-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-700 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto mt-6 px-3 pb-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="text-lg flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info - Fixed at bottom */}
        <div className="border-t border-neutral-700 p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {session.user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user.email}
              </p>
              <p className="text-xs text-neutral-400">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 relative z-10">
        {/* Top bar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-neutral-400 hover:text-white"
          >
            <FiMenu className="text-xl" />
          </button>
          
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
