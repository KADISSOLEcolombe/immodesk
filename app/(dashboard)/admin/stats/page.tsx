"use client";

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, AlertCircle, TrendingUp, Home, Users, DollarSign, Building } from 'lucide-react';
import { StatsService, DashboardStats, MonthlyRevenue, OccupationRate, FinancialMetrics } from '@/lib/stats-service';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { Paiement } from '@/types/api';

interface StatsData {
  dashboard: DashboardStats | null;
  monthlyRevenue: MonthlyRevenue[];
  occupationRates: OccupationRate[];
  financialMetrics: FinancialMetrics | null;
  payments: Paiement[];
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData>({
    dashboard: null,
    monthlyRevenue: [],
    occupationRates: [],
    financialMetrics: null,
    payments: [],
  });

  const currencyFormatter = new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all stats in parallel
      const [dashboardRes, monthlyRes, occupationRes, financialRes, paymentsRes] = await Promise.all([
        StatsService.getDashboard(),
        StatsService.getMonthlyRevenue(new Date().getFullYear()),
        StatsService.getOccupationRates(),
        StatsService.getFinancialMetrics(),
        ComptabiliteService.getPaiements(),
      ]);

      setStats({
        dashboard: dashboardRes.success ? dashboardRes.data || null : null,
        monthlyRevenue: monthlyRes.success ? monthlyRes.data || [] : [],
        occupationRates: occupationRes.success ? occupationRes.data || [] : [],
        financialMetrics: financialRes.success ? financialRes.data || null : null,
        payments: paymentsRes.success ? paymentsRes.data || [] : [],
      });
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate derived stats
  const derivedStats = useMemo(() => {
    const d = stats.dashboard;
    if (!d) return null;

    // Count payment issues from real payments
    const latePayments = stats.payments.filter(p => p.statut === 'en_retard');
    const unpaidPayments = stats.payments.filter(p => p.statut === 'impaye');
    const paymentIssues = [...latePayments, ...unpaidPayments];
    const paymentIssuesVolume = paymentIssues.reduce((sum, p) => sum + p.montant, 0);

    // Calculate occupancy rate
    const occupancyRate = d.total_biens > 0 ? (d.biens_loues / d.total_biens) * 100 : 0;

    return {
      totalBiens: d.total_biens,
      biensLoues: d.biens_loues,
      biensVacants: d.biens_vacants,
      totalLocataires: d.total_locataires,
      bauxActifs: d.baux_actifs,
      revenusMois: d.revenus_mois,
      revenusAnnee: d.revenus_annee,
      depensesMois: d.depenses_mois,
      beneficeNet: d.benefice_net,
      tauxOccupation: occupancyRate,
      paymentIssuesCount: paymentIssues.length,
      paymentIssuesVolume,
      loyerMoyen: stats.financialMetrics?.loyer_moyen || 0,
      tauxImpayes: stats.financialMetrics?.taux_impayes || 0,
    };
  }, [stats]);

  // Stat cards configuration
  const statCards = useMemo(() => {
    if (!derivedStats) return [];

    return [
      {
        label: 'Total Biens',
        value: derivedStats.totalBiens,
        sub: `${derivedStats.biensLoues} loués, ${derivedStats.biensVacants} vacants`,
        icon: Home,
      },
      {
        label: 'Total Locataires',
        value: derivedStats.totalLocataires,
        sub: `${derivedStats.bauxActifs} baux actifs`,
        icon: Users,
      },
      {
        label: "Taux d'occupation",
        value: `${derivedStats.tauxOccupation.toFixed(1)}%`,
        sub: 'Biens actuellement loués',
        icon: Building,
      },
      {
        label: 'Revenus mensuels',
        value: currencyFormatter.format(derivedStats.revenusMois),
        sub: `Loyer moyen: ${currencyFormatter.format(derivedStats.loyerMoyen)}`,
        icon: DollarSign,
      },
      {
        label: 'Revenus annuels',
        value: currencyFormatter.format(derivedStats.revenusAnnee),
        sub: 'Cette année',
        icon: TrendingUp,
      },
      {
        label: 'Bénéfice net',
        value: currencyFormatter.format(derivedStats.beneficeNet),
        sub: 'Après dépenses',
        icon: DollarSign,
      },
      {
        label: 'Dépenses mensuelles',
        value: currencyFormatter.format(derivedStats.depensesMois),
        sub: 'Ce mois',
        icon: DollarSign,
      },
      {
        label: 'Incidents paiement',
        value: derivedStats.paymentIssuesCount,
        sub: `Volume: ${currencyFormatter.format(derivedStats.paymentIssuesVolume)}`,
        highlight: true,
        icon: AlertCircle,
      },
      {
        label: "Taux d'impayés",
        value: `${(derivedStats.tauxImpayes * 100).toFixed(1)}%`,
        sub: 'Des paiements',
        icon: TrendingUp,
      },
    ];
  }, [derivedStats]);

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <BarChart3 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Statistiques globales</h1>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mb-6 flex items-center justify-center rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="ml-3 text-sm text-zinc-500">Chargement des statistiques...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Stats grid */}
      {!loading && !error && derivedStats && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
                  <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <p className={`mt-2 text-2xl font-bold ${card.highlight ? 'text-orange-700' : 'text-zinc-900'}`}>
                  {card.value}
                </p>
                {card.sub && <p className="mt-0.5 text-xs text-zinc-500">{card.sub}</p>}
              </article>
            );
          })}
        </section>
      )}

      {/* Monthly Revenue Chart */}
      {!loading && !error && stats.monthlyRevenue.length > 0 && (
        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Évolution mensuelle</h2>
          <div className="space-y-2">
            {stats.monthlyRevenue.map((month) => (
              <div key={month.mois} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
                <span className="text-sm font-medium text-zinc-900">{month.mois}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-500">
                    Revenus: {currencyFormatter.format(month.revenus)}
                  </span>
                  <span className="text-sm text-zinc-500">
                    Dépenses: {currencyFormatter.format(month.depenses)}
                  </span>
                  <span className={`text-sm font-medium ${month.benefice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.benefice >= 0 ? '+' : '-'}{currencyFormatter.format(Math.abs(month.benefice))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Occupation Rates */}
      {!loading && !error && stats.occupationRates.length > 0 && (
        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Taux d'occupation par bien</h2>
          <div className="space-y-2">
            {stats.occupationRates.slice(0, 5).map((rate) => (
              <div key={rate.bien_id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{rate.adresse}</p>
                  <p className="text-xs text-zinc-500">{rate.jours_loues} jours loués / {rate.jours_vacants} jours vacants</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-zinc-200 overflow-hidden">
                    <div
                      className="h-full bg-zinc-700 transition-all"
                      style={{ width: `${rate.taux_occupation}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-zinc-900">{rate.taux_occupation.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Financial Metrics */}
      {!loading && !error && stats.financialMetrics && (
        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Métriques financières</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Loyer moyen</p>
              <p className="text-lg font-bold text-zinc-900">{currencyFormatter.format(stats.financialMetrics.loyer_moyen)}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Durée moyenne bail</p>
              <p className="text-lg font-bold text-zinc-900">{stats.financialMetrics.duree_moyenne_bail} mois</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Taux impayés</p>
              <p className="text-lg font-bold text-orange-600">{(stats.financialMetrics.taux_impayes * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Retard moyen paiement</p>
              <p className="text-lg font-bold text-zinc-900">{stats.financialMetrics.retard_moyen_paiement} jours</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
