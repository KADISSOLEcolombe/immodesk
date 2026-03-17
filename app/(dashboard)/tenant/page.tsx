"use client";

import Link from 'next/link';
import { Bell, CreditCard, FileText, Mail } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';

const tenantName = 'Kossi Mensah';
const propertyTitle = 'Appartement meublé à Bè';

const quickLinks = [
  { href: '/tenant/payment', label: 'Payer mon loyer', icon: CreditCard, color: 'bg-emerald-50 text-emerald-700' },
  { href: '/tenant/history', label: 'Historique des paiements', icon: FileText, color: 'bg-zinc-100 text-zinc-700' },
  { href: '/tenant/notifications', label: 'Notifications', icon: Bell, color: 'bg-orange-50 text-orange-700' },
  { href: '/tenant/contact', label: 'Contact', icon: Mail, color: 'bg-blue-50 text-blue-700' },
];

export default function TenantOverviewPage() {
  const { unreadCount } = useNotifications();

  return (
    <>
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Mon bail</h1>
        <p className="text-sm text-zinc-600">Paiement, historique complet et reçus centralisés.</p>
        {unreadCount > 0 && (
          <p className="inline-flex w-fit rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Bail */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 inline-flex items-center gap-2 text-zinc-900">
          <FileText className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-base font-semibold">Vue du bail</h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 p-3"><dt className="text-zinc-500">Locataire</dt><dd className="mt-1 font-medium text-zinc-900">{tenantName}</dd></div>
          <div className="rounded-xl bg-zinc-50 p-3"><dt className="text-zinc-500">Bien</dt><dd className="mt-1 font-medium text-zinc-900">{propertyTitle}</dd></div>
          <div className="rounded-xl bg-zinc-50 p-3"><dt className="text-zinc-500">Début</dt><dd className="mt-1 font-medium text-zinc-900">01 janvier 2026</dd></div>
          <div className="rounded-xl bg-zinc-50 p-3"><dt className="text-zinc-500">Fin</dt><dd className="mt-1 font-medium text-zinc-900">31 décembre 2026</dd></div>
        </dl>
        <Link href="/properties/prop-1?role=tenant" className="mt-4 inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
          Voir le détail du bien
        </Link>
      </section>

      {/* Accès rapides */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Accès rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickLinks.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-zinc-900 group-hover:underline">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
