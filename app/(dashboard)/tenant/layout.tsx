"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Building2, CreditCard, FileText, LayoutDashboard, Mail } from 'lucide-react';

const tenantNav = [
  { href: '/tenant', label: 'Mon bail', icon: LayoutDashboard, exact: true },
  { href: '/tenant/payment', label: 'Payer mon loyer', icon: CreditCard, exact: false },
  { href: '/tenant/history', label: 'Historique', icon: FileText, exact: false },
  { href: '/tenant/notifications', label: 'Notifications', icon: Bell, exact: false },
  { href: '/tenant/contact', label: 'Contact', icon: Mail, exact: false },
  { href: '/properties', label: 'Catalogue des biens', icon: Building2, exact: false },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 lg:flex">
      <aside className="border-b border-black/5 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
          <div className="mb-4 border-b border-zinc-100 pb-4 lg:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">ImmoDesk</p>
            <h1 className="mt-1 text-lg font-bold text-zinc-900">Espace locataire</h1>
            <p className="mt-1 text-sm text-zinc-500">Paiements, historique et contact centralisés.</p>
          </div>

          <nav className="flex gap-1 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-visible">
            {tenantNav.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
