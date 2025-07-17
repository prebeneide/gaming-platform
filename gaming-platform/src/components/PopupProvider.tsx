"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for popup
export type PopupType = 'error' | 'success' | 'info';
export interface PopupState {
  type: PopupType;
  message: string;
}

interface PopupContextType {
  showPopup: (popup: PopupState) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error('usePopup must be used within a PopupProvider');
  return ctx;
}

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [popup, setPopup] = useState<PopupState | null>(null);

  const showPopup = (popup: PopupState) => {
    setPopup(popup);
  };

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}
      {popup && (
        <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-6 rounded-xl shadow-2xl text-lg font-semibold transition-all
          ${popup.type === 'error' ? 'bg-red-600 text-white' : popup.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
        >
          <div>{popup.message}</div>
          {/* If error is about active match, show Go to match link */}
          {popup.type === 'error' && (
            // Try to parse activeMatchId from the message if present (assume JSON string if so)
            (() => {
              let activeMatchId = null;
              let matchName = null;
              // Try to parse JSON if message is an object (for future-proofing)
              if (typeof popup === 'object' && 'activeMatchId' in popup) {
                activeMatchId = (popup as any).activeMatchId;
              }
              // Fallback: try to parse from message string
              if (!activeMatchId && typeof popup.message === 'string') {
                const idMatch = popup.message.match(/activeMatchId: ([a-zA-Z0-9-]+)/);
                if (idMatch && idMatch[1]) activeMatchId = idMatch[1];
                // Regex to extract match name in parentheses: ("MatchName") or ('MatchName')
                const nameMatch = popup.message.match(/another active match \(["'](.+?)["']\)/);
                if (nameMatch && nameMatch[1]) matchName = nameMatch[1];
              }
              if (activeMatchId) {
                return (
                  <a
                    href={`/matches/${activeMatchId}`}
                    className="block mt-4 px-4 py-2 rounded bg-yellow-300 text-black font-bold text-center hover:bg-yellow-400 transition"
                    style={{ textDecoration: 'none' }}
                  >
                    Go to match
                  </a>
                );
              } else if (matchName) {
                return (
                  <a
                    href={"/matches"}
                    className="block mt-4 px-4 py-2 rounded bg-yellow-300 text-black font-bold text-center hover:bg-yellow-400 transition"
                    style={{ textDecoration: 'none' }}
                  >
                    Go to match: {matchName}
                  </a>
                );
              }
              return null;
            })()
          )}
          <div className="flex justify-center mt-8">
            <button
              className="px-6 py-3 rounded bg-black bg-opacity-30 hover:bg-opacity-50 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              onClick={() => setPopup(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}; 