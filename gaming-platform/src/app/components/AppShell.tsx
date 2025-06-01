"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import { AuthProvider } from "@/components/AuthProvider";
import { useSession } from "next-auth/react";
import SideMenu from "./SideMenu";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <span className="loader-gradient"></span>
      <style jsx>{`
        .loader-gradient {
          display: inline-block;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 6px solid transparent;
          border-top: 6px solid #00c6fb;
          border-right: 6px solid #8b5cf6;
          border-bottom: 6px solid #f6369a;
          border-left: 6px solid #8b5cf6;
          animation: spin 1.1s cubic-bezier(0.4,0.2,0.2,1) infinite;
          box-shadow: 0 0 32px 0 #00c6fb80, 0 0 32px 0 #f6369a80;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
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
      {children}
    </>
  );
} 