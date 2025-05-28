"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import { AuthProvider } from "@/components/AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = pathname.startsWith("/login") || pathname.startsWith("/signup");
  return (
    <>
      {!hideHeader && <Header />}
      <AuthProvider>{children}</AuthProvider>
    </>
  );
} 