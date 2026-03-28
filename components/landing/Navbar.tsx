"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, Home, X, Eye } from 'lucide-react';

const navLinks = [
  { href: '#accueil', label: 'Accueil' },
  { href: '/properties', label: 'Nos Biens' },
  { href: '#apropos', label: 'À Propos' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${
        scrolled
          ? 'bg-white/90 dark:bg-[#020617]/90 backdrop-blur-xl border-zinc-200/50 dark:border-white/5 py-3 shadow-lg shadow-black/5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Home className="w-6 h-6 text-blue-500 dark:text-amber-300 transition-transform group-hover:scale-110 group-hover:rotate-6" strokeWidth={1.5} />
          <span className={`text-[10px] font-bold tracking-widest uppercase transition-all duration-300 hover:text-amber-500 hover:scale-105 ${
            scrolled ? 'text-zinc-600 dark:text-zinc-400' : 'text-white/90'
          }`}>IMMODESK</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleSmoothScroll(e, href)}
              className="text-xs font-semibold tracking-widest uppercase text-zinc-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-amber-200 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-blue-600 dark:after:bg-amber-300 hover:after:w-full after:transition-all after:duration-300"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login?tab=visite"
            className="flex items-center gap-2 px-5 py-2 text-xs font-medium tracking-widest uppercase text-amber-200 border border-amber-200/30 hover:bg-amber-200/10 transition-all rounded-full"
          >
            <Eye className="w-3.5 h-3.5" />
            Visite Virtuelle
          </Link>
          <Link
            href="/login"
            className="px-6 py-2 bg-amber-200 text-zinc-900 text-xs font-bold tracking-widest uppercase hover:bg-amber-100 transition-all rounded-full shadow-lg shadow-amber-200/20"
          >
            Connexion
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-6 space-y-4">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => handleSmoothScroll(e, href)}
              className="block text-sm font-medium tracking-widest uppercase text-gray-300 hover:text-amber-200 transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link href="/login?tab=visite" className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-medium tracking-widest uppercase text-amber-200 border border-amber-200/30 rounded-full">
              <Eye className="w-3.5 h-3.5" /> Visite Virtuelle
            </Link>
            <Link href="/login" className="text-center px-6 py-3 bg-amber-200 text-zinc-900 text-xs font-bold tracking-widest uppercase rounded-full">
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
