"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Bell, Building2, CreditCard, FileText, TrendingUp, TrendingDown, Wallet, Loader2, Plus } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PaiementsList } from '@/components/comptabilite/PaiementsList';
import { DepensesList } from '@/components/comptabilite/DepensesList';
import { BalanceCard } from '@/components/comptabilite/BalanceCard';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { StatsService, DashboardStats } from '@/lib/stats-service';
import { Balance } from '@/types/api';
import { formatCurrency } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const quickLinks = [
  { href: '/owner/properties', label: 'Mes biens', icon: Building2, color: 'bg-blue-50 text-blue-700' },
  { href: '/owner/payments', label: 'Paiements & loyers', icon: CreditCard, color: 'bg-emerald-50 text-emerald-700' },
  { href: '/owner/reports', label: 'Rapports PDF', icon: FileText, color: 'bg-zinc-100 text-zinc-700' },
  { href: '/owner/notifications', label: 'Notifications', icon: Bell, color: 'bg-orange-50 text-orange-700' },
];

export default function OwnerOverviewPage() {
  const { unreadCount } = useNotifications();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement des données depuis le backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger les stats du dashboard et la balance en parallèle
        const [statsResponse, balanceResponse] = await Promise.all([
          StatsService.getDashboard(),
          ComptabiliteService.getBalanceGlobale(),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data);
        }

        if (balanceResponse.success && balanceResponse.data) {
          setBalance(balanceResponse.data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données du dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    // Utiliser les données du dashboard API si disponibles, sinon fallback sur les données comptables
    const total = dashboardStats?.total_biens || 0;
    const occupied = dashboardStats?.biens_loues || 0;
    const collected = dashboardStats?.revenus_mois || balance?.total_global_revenus || 0;
    const depenses = dashboardStats?.depenses_mois || balance?.total_global_depenses || 0;
    const beneficeNet = dashboardStats?.benefice_net || balance?.benefice_net_global || (collected - depenses);
    
    const occupancyRate = total === 0 ? 0 : Math.round((occupied / total) * 100);
    
    return { total, occupied, occupancyRate, collected, depenses, beneficeNet };
  }, [dashboardStats, balance]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Vue d&apos;ensemble</h1>
        <p className="text-sm text-zinc-600">Pilote tes biens, loyers et demandes depuis un tableau de bord unique.</p>
        {unreadCount > 0 && (
          <p className="inline-flex w-fit rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Nombre de biens</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.total}</p>
          <p className="text-xs text-zinc-500">Occupation: {stats.occupancyRate}%</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Revenus totaux</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {isLoading ? '...' : formatCurrency(stats.collected)}
          </p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Loyers perçus
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Dépenses totales</p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {isLoading ? '...' : formatCurrency(stats.depenses)}
          </p>
          <p className="text-xs text-red-600 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Charges & travaux
          </p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bénéfice net</p>
          <p className={`mt-2 text-2xl font-bold ${stats.beneficeNet >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {isLoading ? '...' : formatCurrency(stats.beneficeNet)}
          </p>
          <p className={`text-xs flex items-center gap-1 ${stats.beneficeNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            <Wallet className="w-3 h-3" />
            {stats.beneficeNet >= 0 ? 'Rentable' : 'Déficit'}
          </p>
        </article>
      </section>

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

      {/* Section Balance */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Balance comptable</h2>
          <Link 
            href="/owner/comptabilite/balance" 
            className="text-sm text-blue-600 hover:underline"
          >
            Voir le détail →
          </Link>
        </div>
        <BalanceCard />
      </section>

      {/* Section Paiements récents */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Derniers paiements</h2>
          <Link 
            href="/owner/comptabilite/paiements" 
            className="text-sm text-blue-600 hover:underline"
          >
            Voir tout →
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm">
          <PaiementsList limit={5} />
        </div>
      </section>

      {/* Section Dépenses récentes */}
      <section className="mt-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Dernières dépenses</h2>
          <div className="flex items-center gap-3">
            <Link 
              href="/owner/comptabilite/depenses?action=new" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle dépense
            </Link>
            <Link 
              href="/owner/comptabilite/depenses" 
              className="text-sm text-blue-600 hover:underline"
            >
              Voir tout →
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm">
          <DepensesList limit={5} />
        </div>
      </section>
    </>
  );
}
