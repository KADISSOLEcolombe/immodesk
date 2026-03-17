"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, CreditCard, FileText, Settings2, Users, Video } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { usePayments } from '@/components/payments/PaymentProvider';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const initialUsers = [
  { id: 'u-1', role: 'tenant' as const, active: true },
  { id: 'u-2', role: 'tenant' as const, active: true },
  { id: 'u-3', role: 'owner' as const, active: true },
  { id: 'u-4', role: 'admin' as const, active: true },
];

const initialSubmissions = [
  { id: 's-1', status: 'pending' as const, rentAmount: 320000 },
  { id: 's-2', status: 'pending' as const, rentAmount: 85000 },
  { id: 's-3', status: 'approved' as const, rentAmount: 130000 },
];

const initialPaymentIssues = [
  { id: 'p-1', amount: 75000, status: 'open' as const },
  { id: 'p-2', amount: 180000, status: 'open' as const },
  { id: 'p-3', amount: 110000, status: 'resolved' as const },
];

const quickLinks = [
  { href: '/admin/users', label: 'Gérer les utilisateurs', icon: Users, color: 'bg-blue-50 text-blue-700' },
  { href: '/admin/submissions', label: 'Valider les soumissions', icon: CheckCircle2, color: 'bg-orange-50 text-orange-700' },
  { href: '/admin/payments', label: 'Vue globale paiements', icon: CreditCard, color: 'bg-emerald-50 text-emerald-700' },
  { href: '/admin/virtual-visits', label: 'Visites virtuelles 360°', icon: Video, color: 'bg-purple-50 text-purple-700' },
  { href: '/admin/reports', label: 'Rapports PDF', icon: FileText, color: 'bg-zinc-100 text-zinc-700' },
  { href: '/admin/settings', label: 'Configuration système', icon: Settings2, color: 'bg-zinc-100 text-zinc-700' },
  { href: '/admin/stats', label: 'Statistiques globales', icon: BarChart3, color: 'bg-zinc-100 text-zinc-700' },
];

export default function AdminOverviewPage() {
  const { unreadCount } = useNotifications();
  const { filterPayments, getNetAmount, getOwnerBalance } = usePayments();
  const { getVisitStats } = useVirtualVisits();

  const [users] = useState(initialUsers);
  const [submissions] = useState(initialSubmissions);
  const [paymentIssues] = useState(initialPaymentIssues);

  const globalPayments = useMemo(() => filterPayments({ status: 'all', channel: 'all' }), [filterPayments]);
  const visitStats = useMemo(() => getVisitStats(), [getVisitStats]);

  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.active).length;
    const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length;
    const openPaymentIssues = paymentIssues.filter((p) => p.status === 'open').length;
    const monthlyVolume = paymentIssues.reduce((sum, item) => sum + item.amount, 0);
    const refundedTotal = globalPayments.reduce((sum, item) => sum + item.refundedAmount, 0);
    const netCollected = globalPayments.reduce((sum, item) => sum + getNetAmount(item), 0);
    return { totalUsers: users.length, activeUsers, pendingSubmissions, openPaymentIssues, monthlyVolume, refundedTotal, netCollected };
  }, [users, submissions, paymentIssues, globalPayments, getNetAmount]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Dashboard super admin</h1>
        <p className="text-sm text-zinc-600 sm:text-base">Administration complète de la plateforme ImmoDesk Togo.</p>
        {unreadCount > 0 && (
          <p className="inline-flex w-fit rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Utilisateurs</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.totalUsers}</p>
          <p className="text-xs text-zinc-500">Actifs: {stats.activeUsers}</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Soumissions en attente</p>
          <p className="mt-2 text-2xl font-bold text-orange-700">{stats.pendingSubmissions}</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Paiements à traiter</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.openPaymentIssues}</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Volume monitoré (mois)</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{currencyFormatter.format(stats.monthlyVolume)}</p>
          <p className="text-xs text-zinc-600">
            Remboursé: {currencyFormatter.format(stats.refundedTotal)} · Net: {currencyFormatter.format(stats.netCollected)}
          </p>
          <p className="text-xs text-zinc-600">Solde propriétaire: {currencyFormatter.format(getOwnerBalance())}</p>
          <p className="text-xs text-zinc-600">
            Visites virtuelles: {visitStats.totalVisits} · Conversion: {visitStats.conversionRate}%
          </p>
        </article>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Accès rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
