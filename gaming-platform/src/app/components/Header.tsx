import Link from "next/link";
import SearchBar from "../dashboard/SearchBar";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full bg-black/80 backdrop-blur border-b border-gray-800 shadow-sm flex items-center relative px-0 header-main">
      <div className="w-full flex items-center h-full px-0 header-inner">
        {/* Logo helt til venstre eller midtstilt på mobil */}
        <div className="flex items-center h-full px-4 min-w-0 flex-shrink-0 logo-wrapper">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            <span>GameChallenger</span>
          </Link>
        </div>
        {/* Spacer for å skyve søkefeltet til høyre på små skjermer */}
        <div className="flex-1 hidden sm:block" />
        {/* Søkefeltet */}
        <div className="searchbar-wrapper">
          <SearchBar />
        </div>
      </div>
      <style jsx>{`
        @media (min-width: 651px) {
          .header-main {
            height: 80px !important;
            min-height: 80px !important;
            max-height: 80px !important;
          }
        }
        @media (max-width: 950px) {
          .header-inner {
            flex-direction: row !important;
            align-items: center !important;
          }
          .searchbar-wrapper {
            position: static !important;
            transform: none !important;
            width: 100%;
            max-width: 420px;
            min-width: 140px;
            margin-left: auto;
            margin-right: 1rem;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }
          .flex-1 {
            display: block !important;
          }
        }
        @media (min-width: 951px) {
          .searchbar-wrapper {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 420px;
            min-width: 140px;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            margin-left: 0;
            margin-right: 0;
          }
          .flex-1 {
            display: none !important;
          }
        }
        @media (max-width: 650px) {
          .header-main {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
          }
          .header-inner {
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            height: auto !important;
            padding: 0 !important;
          }
          .logo-wrapper {
            justify-content: center !important;
            width: 100%;
            padding: 0.5rem 0 0.5rem 0 !important;
            display: flex !important;
            margin-bottom: 0.5rem !important;
            margin-top: 1rem !important;
          }
          .searchbar-wrapper {
            width: 100% !important;
            max-width: 420px !important;
            min-width: 140px !important;
            margin: 0 auto 1rem auto !important;
            padding: 0 1rem !important;
            position: static !important;
            transform: none !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
          .flex-1 {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
} 