"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { AdminOverviewCharts } from '../../../components/dashboard/admin-overview-charts';
import { StatsService, AdminGlobalStats, AdminMonthlyPaymentTrendPoint } from '@/lib/stats-service';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

export default function AdminOverviewPage() {
  const { unreadCount } = useNotifications();
  const [globalStats, setGlobalStats] = useState<AdminGlobalStats | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<AdminMonthlyPaymentTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [globalResponse, trendResponse] = await Promise.all([
          StatsService.getAdminGlobalStats(),
          StatsService.getAdminMonthlyPaymentTrend(6),
        ]);

        if (globalResponse.success && globalResponse.data) {
          setGlobalStats(globalResponse.data);
        } else {
          setError(globalResponse.message || 'Impossible de charger les statistiques admin');
        }

        if (trendResponse.success && trendResponse.data) {
          setMonthlyTrend(trendResponse.data);
        } else {
          setMonthlyTrend([]);
        }
      } catch (err) {
        console.error('Erreur chargement stats admin:', err);
        setError('Impossible de charger les statistiques admin');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const stats = useMemo(() => {
    if (!globalStats) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingSubmissions: 0,
        openPaymentIssues: 0,
        monthlyVolume: 0,
        netCollected: 0,
        totalVisits: 0,
        visitConversionRate: 0,
      };
    }

    const totalUsers = globalStats.utilisateurs.total_utilisateurs;
    const pendingSubmissions = globalStats.soumissions.en_examen;
    const openPaymentIssues = globalStats.paiements.en_attente + globalStats.paiements.echoue;
    const monthlyVolume = Number(globalStats.paiements.montant_total || '0');
    const totalVisits = globalStats.visites.total_visites;
    const visitConversionRate = totalVisits > 0
      ? Math.round((globalStats.visites.utilisees / totalVisits) * 100)
      : 0;

    return {
      totalUsers,
      activeUsers: totalUsers,
      pendingSubmissions,
      openPaymentIssues,
      monthlyVolume,
      netCollected: monthlyVolume,
      totalVisits,
      visitConversionRate,
    };
  }, [globalStats]);

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
        {isLoading && (
          <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-5">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des statistiques réelles...
            </div>
          </article>
        )}
        {!isLoading && error && (
          <article className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm sm:col-span-2 xl:col-span-5">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </article>
        )}
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
            Net validé: {currencyFormatter.format(stats.netCollected)}
          </p>
          <p className="text-xs text-zinc-600">
            Visites virtuelles: {stats.totalVisits} · Conversion: {stats.visitConversionRate}%
          </p>
        </article>
      </section>

      <AdminOverviewCharts globalStats={globalStats} monthlyTrend={monthlyTrend} />
    </>
  );
}
