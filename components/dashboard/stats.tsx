"use client";

import { useEffect, useState } from 'react';
import { Building2, Home, Users, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { StatsService } from '@/lib/services';

interface DashboardStats {
  total_immeubles: number;
  total_biens: number;
  biens_vacants: number;
  biens_loues: number;
  total_locataires: number;
  baux_actifs: number;
  revenus_mois: number;
  revenus_annee: number;
  depenses_mois: number;
  benefice_net: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await StatsService.getDashboard();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur technique');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-red-500">
        {error || 'Données non disponibles'}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Immeubles',
      value: stats.total_immeubles,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Biens',
      value: `${stats.biens_loues}/${stats.total_biens}`,
      subtitle: `${stats.biens_vacants} vacants`,
      icon: Home,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Locataires',
      value: stats.total_locataires,
      subtitle: `${stats.baux_actifs} baux actifs`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Revenus du mois',
      value: formatCurrency(stats.revenus_mois),
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Revenus année',
      value: formatCurrency(stats.revenus_annee),
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Dépenses du mois',
      value: formatCurrency(stats.depenses_mois),
      icon: Wallet,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Bénéfice net',
      value: formatCurrency(stats.benefice_net),
      icon: TrendingUp,
      color: stats.benefice_net >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.benefice_net >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
            <div className={`${card.bgColor} p-2 rounded-lg`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          {card.subtitle && (
            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
