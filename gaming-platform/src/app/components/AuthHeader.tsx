"use client";

import Link from "next/link";
import Image from "next/image";

export default function AuthHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 p-6">
      <Link href="/" className="inline-flex items-center gap-3 group">
        <Image
          src="/logo.svg"
          alt="Gaming Platform Logo"
          width={40}
          height={40}
          className="transition-transform group-hover:scale-105"
        />
        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Gaming Platform
        </span>
      </Link>
    </header>
  );
} 