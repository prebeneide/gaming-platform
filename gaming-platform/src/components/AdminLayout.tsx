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
  FiMessageCircle,
  FiGlobe
} from "react-icons/fi";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: FiHome, href: "/admin" },
  { id: "users", label: "User Management", icon: FiUsers, href: "/admin/users" },
  { id: "support", label: "Support", icon: FiMessageCircle, href: "/admin/support" },
  { id: "disputes", label: "Disputes", icon: FiAlertTriangle, href: "/admin/disputes" },
  { id: "geolocation", label: "Geolocation", icon: FiGlobe, href: "/admin/geolocation" },
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
  const [prefs, setPrefs] = useState<{ locale: string; timezone: string; timeFormat: string; dateFormat: string } | null>(null);
  const [kycEnabled, setKycEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/user/preferences?userId=${session.user.id}`);
        const data = await res.json();
        if (data?.preferences) {
          setPrefs({
            locale: data.preferences.locale || 'en-US',
            timezone: data.preferences.timezone || 'UTC',
            timeFormat: data.preferences.timeFormat || '12',
            dateFormat: data.preferences.dateFormat || 'MM/DD/YYYY',
          });
        }
      } catch {}
    })();
  }, [session]);

  // Detect if KYC is enabled to show/hide menu item
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/kyc/providers');
        const d = await r.json();
        setKycEnabled(!!d?.enabled);
      } catch {
        setKycEnabled(false);
      }
    })();
  }, []);

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
    <div className="min-h-screen bg-neutral-900 text-white relative lg:flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`z-30 w-64 bg-neutral-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen flex flex-col ${
        sidebarOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0'
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
            <Link
              href="/admin/kyc"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname === '/admin/kyc' ? 'bg-purple-600 text-white' : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
              }`}
              title={kycEnabled ? 'KYC Queue' : 'KYC is currently disabled (click to view)'}
            >
              <FiActivity className={`text-lg flex-shrink-0 ${kycEnabled ? '' : 'opacity-60'}`} />
              <span className="font-medium">KYC</span>
              {!kycEnabled && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-neutral-700 text-neutral-300 border border-neutral-600">disabled</span>
              )}
            </Link>
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
      <div className="relative z-10 flex-1 lg:ml-0 lg:pl-0">
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
            {prefs && (
              <span
                title={`Locale: ${prefs.locale}\nTimezone: ${prefs.timezone}\nTime: ${prefs.timeFormat}-hour\nDate: ${prefs.dateFormat}`}
                className="hidden md:inline-flex items-center gap-2 px-3 py-1 bg-neutral-700 text-neutral-300 rounded text-xs border border-neutral-600"
              >
                <span>{prefs.locale}</span>
                <span className="opacity-60">•</span>
                <span className="truncate max-w-[12rem]" style={{direction:'ltr'}}>{prefs.timezone}</span>
                <span className="opacity-60">•</span>
                <span>{prefs.timeFormat}h</span>
                <span className="opacity-60">•</span>
                <span>{prefs.dateFormat}</span>
              </span>
            )}
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
