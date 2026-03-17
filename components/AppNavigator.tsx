"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
};

const navFlow: NavItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Biens', href: '/properties' },
  { label: 'Connexion', href: '/login' },
  { label: 'Inscription', href: '/register' },
  { label: 'Locataire', href: '/tenant' },
  { label: 'Propriétaire', href: '/owner' },
  { label: 'Admin', href: '/admin' },
  { label: 'Visite', href: '/visit' },
];

function resolveIndex(pathname: string) {
  if (pathname.startsWith('/properties/')) {
    return navFlow.findIndex((item) => item.href === '/properties');
  }

  if (pathname.startsWith('/visit/')) {
    return navFlow.findIndex((item) => item.href === '/visit');
  }

  const index = navFlow.findIndex((item) => item.href === pathname);
  return index;
}

export default function AppNavigator() {
  const pathname = usePathname();
  const currentIndex = resolveIndex(pathname);

  if (currentIndex < 0) {
    return null;
  }

  const prev = currentIndex > 0 ? navFlow[currentIndex - 1] : null;
  const next = currentIndex < navFlow.length - 1 ? navFlow[currentIndex + 1] : null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-2 py-1 shadow-lg backdrop-blur-sm">
        {prev ? (
          <Link
            href={prev.href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            aria-label={`Aller à ${prev.label}`}
            title={`Aller à ${prev.label}`}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)]">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </span>
        )}

        <span className="px-2 text-xs font-medium text-[var(--muted)]">{navFlow[currentIndex].label}</span>

        {next ? (
          <Link
            href={next.href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            aria-label={`Aller à ${next.label}`}
            title={`Aller à ${next.label}`}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)]">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}
