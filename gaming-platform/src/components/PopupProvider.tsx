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
          {popup.message}
          <button
            className="ml-6 px-4 py-2 rounded bg-black bg-opacity-30 hover:bg-opacity-50 text-white text-base font-bold"
            onClick={() => setPopup(null)}
          >
            OK
          </button>
        </div>
      )}
    </PopupContext.Provider>
  );
}; 