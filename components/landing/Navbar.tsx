
import Link from 'next/link';
import { Menu, Home } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 text-white bg-transparent">
      {/* Logo */}
      <div className="flex items-center gap-2 group cursor-pointer">
        <Home className="w-6 h-6 text-amber-200 transition-transform group-hover:scale-110" strokeWidth={1.5} />
        <div className="text-2xl font-serif tracking-widest font-bold">IMMODESK</div>
      </div>

      {/* Desktop Menu */}
      
      {/* Reservation Button */}
      <div className="hidden md:block mr-16">
        <Link
          href="/login"
          className="px-6 py-2 border border-amber-200 text-amber-100 text-xs font-medium tracking-widest uppercase hover:bg-amber-200 hover:text-black transition-colors"
        >
          Connexion
        </Link>
      </div>

      {/* Mobile Menu Icon */}
      <div className="md:hidden">
        <Menu className="w-6 h-6" />
      </div>
    </nav>
  );
}
