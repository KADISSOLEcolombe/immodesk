"use client";

import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import React from 'react';

interface ThemeToggleProps {
  inline?: boolean;
}

export default function ThemeToggle({ inline = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (inline) {
    return (
      <button
        onClick={toggleTheme}
        className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        {theme === 'light' ? (
          <>
            <Moon className="h-4 w-4" />
            <span>Mode sombre</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            <span>Mode clair</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 md:bottom-8 md:right-8 group overflow-hidden"
      aria-label="Changer le thème"
    >
      <div className="relative h-6 w-6 pointer-events-none">
        <Sun className={`absolute inset-0 h-6 w-6 transition-all duration-500 ${theme === 'light' ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`} />
        <Moon className={`absolute inset-0 h-6 w-6 transition-all duration-500 ${theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
      </div>
      
      {/* Tooltip hint on hover */}
      <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
        {theme === 'light' ? 'Passer au sombre' : 'Passer au clair'}
      </span>
    </button>
  );
}
