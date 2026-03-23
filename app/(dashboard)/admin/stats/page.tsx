"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, Building, CreditCard, Loader2, TrendingUp, Users, Video } from 'lucide-react';
import { AdminGlobalStats, StatsService } from '@/lib/stats-service';

interface StatsData {
  global: AdminGlobalStats | null;
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData>({
    global: null,
  });

  const currencyFormatter = new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const globalRes = await StatsService.getAdminGlobalStats();

      setStats({
        global: globalRes.success ? globalRes.data || null : null,
      });

      if (!globalRes.success) {
        setError(globalRes.message || 'Erreur lors du chargement des statistiques');
      }
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
    const g = stats.global;
    if (!g) return null;

    const montantTotal = Number(g.paiements.montant_total || '0');
    const paymentIssueCount = g.paiements.en_attente + g.paiements.echoue;
    const conversionVisites = g.visites.total_visites > 0
      ? (g.visites.utilisees / g.visites.total_visites) * 100
      : 0;

    return {
      totalUtilisateurs: g.utilisateurs.total_utilisateurs,
      totalProprietaires: g.utilisateurs.proprietaires,
      totalLocataires: g.utilisateurs.locataires,
      nouveauxUtilisateurs: g.utilisateurs.nouveaux_ce_mois,
      totalTransactions: g.paiements.total_transactions,
      paiementsValides: g.paiements.valide,
      paiementsEnAttente: g.paiements.en_attente,
      paiementsEchoues: g.paiements.echoue,
      paiementsAnnules: g.paiements.annule,
      paiementsManuels: g.paiements.total_manuel,
      montantTransactions: montantTotal,
      paymentIssuesCount: paymentIssueCount,
      totalVisites: g.visites.total_visites,
      visitesUtilisees: g.visites.utilisees,
      visitesNonUtilisees: g.visites.non_utilisees,
      conversionVisites,
      totalSoumissions: g.soumissions.total_soumissions,
      soumissionsEnExamen: g.soumissions.en_examen,
      soumissionsPubliees: g.soumissions.publie,
      soumissionsRefusees: g.soumissions.refuse,
    };
  }, [stats]);

  // Stat cards configuration
  const statCards = useMemo(() => {
    if (!derivedStats) return [];

    return [
      {
        label: 'Utilisateurs actifs',
        value: derivedStats.totalUtilisateurs,
        sub: `${derivedStats.totalProprietaires} propriétaires · ${derivedStats.totalLocataires} locataires`,
        icon: Users,
      },
      {
        label: 'Nouveaux utilisateurs (mois)',
        value: derivedStats.nouveauxUtilisateurs,
        sub: 'Créés ce mois-ci',
        icon: TrendingUp,
      },
      {
        label: 'Transactions',
        value: derivedStats.totalTransactions,
        sub: `${derivedStats.paiementsValides} validées`,
        icon: CreditCard,
      },
      {
        label: 'Montant validé',
        value: currencyFormatter.format(derivedStats.montantTransactions),
        sub: `${derivedStats.paiementsManuels} paiements manuels`,
        icon: CreditCard,
      },
      {
        label: 'Incidents paiement',
        value: derivedStats.paymentIssuesCount,
        sub: `${derivedStats.paiementsEchoues} échoués · ${derivedStats.paiementsEnAttente} en attente`,
        highlight: true,
        icon: AlertCircle,
      },
      {
        label: 'Visites virtuelles',
        value: derivedStats.totalVisites,
        sub: `${derivedStats.visitesUtilisees} utilisées`,
        icon: Video,
      },
      {
        label: 'Conversion visites',
        value: `${derivedStats.conversionVisites.toFixed(1)}%`,
        sub: `${derivedStats.visitesNonUtilisees} non utilisées`,
        icon: Building,
      },
      {
        label: 'Soumissions à traiter',
        value: derivedStats.soumissionsEnExamen,
        sub: `${derivedStats.totalSoumissions} au total`,
        icon: Users,
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

      {/* Paiements */}
      {!loading && !error && derivedStats && (
        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Détail transactions</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Paiements validés</span>
              <span className="text-sm text-green-700">{derivedStats.paiementsValides}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Paiements en attente</span>
              <span className="text-sm text-orange-700">{derivedStats.paiementsEnAttente}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Paiements échoués</span>
              <span className="text-sm text-red-700">{derivedStats.paiementsEchoues}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Paiements annulés</span>
              <span className="text-sm text-zinc-700">{derivedStats.paiementsAnnules}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Montant total validé</span>
              <span className="text-sm font-semibold text-zinc-900">{currencyFormatter.format(derivedStats.montantTransactions)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Soumissions */}
      {!loading && !error && derivedStats && (
        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Détail soumissions</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Total</span>
              <span className="text-sm text-zinc-900">{derivedStats.totalSoumissions}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">En examen</span>
              <span className="text-sm text-orange-700">{derivedStats.soumissionsEnExamen}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Publiées</span>
              <span className="text-sm text-green-700">{derivedStats.soumissionsPubliees}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Refusées</span>
              <span className="text-sm text-red-700">{derivedStats.soumissionsRefusees}</span>
            </div>
          </div>
        </section>
      )}

      {/* Visites */}
      {!loading && !error && derivedStats && (
        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Détail visites virtuelles</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Total visites</span>
              <span className="text-sm text-zinc-900">{derivedStats.totalVisites}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Visites utilisées</span>
              <span className="text-sm text-green-700">{derivedStats.visitesUtilisees}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Visites non utilisées</span>
              <span className="text-sm text-zinc-700">{derivedStats.visitesNonUtilisees}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
              <span className="text-sm font-medium text-zinc-900">Taux de conversion</span>
              <span className="text-sm font-semibold text-zinc-900">{derivedStats.conversionVisites.toFixed(1)}%</span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
