"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { PropsWithChildren } from 'react';

const links = [{ href: '/properties', label: 'Catalogue des biens', exact: false }];

export default function PropertiesLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-screen bg-zinc-50 lg:flex">
      <aside className="border-b border-black/5 bg-white/95 px-4 py-4 backdrop-blur-sm lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="mb-5 flex items-center gap-2 text-zinc-900">
          <Building2 className="h-5 w-5" aria-hidden="true" />
          <h2 className="text-base font-semibold">Espace biens</h2>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Navigation biens">
          {links.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-10 shrink-0 items-center rounded-xl px-3 text-sm font-medium transition ${
                  active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
