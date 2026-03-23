"use client";

import { useEffect, useState } from 'react';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { Balance, BalanceItem } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BalanceCardProps {
  periodeDebut?: string;
  periodeFin?: string;
}

export function BalanceCard({ periodeDebut, periodeFin }: BalanceCardProps) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();
  }, [periodeDebut, periodeFin]);

  const loadBalance = async () => {
    try {
      setIsLoading(true);
      
      // Définir les dates par défaut si non fournies (début et fin du mois courant)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const defaultDebut = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const defaultFin = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      const params: { periode_debut: string; periode_fin: string } = {
        periode_debut: periodeDebut || defaultDebut,
        periode_fin: periodeFin || defaultFin,
      };
      
      const response = await ComptabiliteService.getBalanceGlobale(params);
      
      if (response.success && response.data) {
        setBalance(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement de la balance');
      }
    } catch (err) {
      setError('Erreur technique lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
        <div className="p-4 bg-red-50 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!balance || !balance.items || balance.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Balance</h3>
        <div className="p-8 text-center">
          <p className="text-zinc-500">Aucune donnée comptable pour cette période</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-900">Balance</h3>
        <span className="text-sm text-zinc-500">
          {formatDate(balance.periode_debut)} - {formatDate(balance.periode_fin)}
        </span>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600 mb-1">Total Revenus</p>
          <p className="text-xl font-bold text-green-700">
            {formatCurrency(balance.total_global_revenus)}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm text-red-600 mb-1">Total Dépenses</p>
          <p className="text-xl font-bold text-red-700">
            {formatCurrency(balance.total_global_depenses)}
          </p>
        </div>
        <div className={`rounded-xl p-4 ${balance.benefice_net_global >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className={`text-sm mb-1 ${balance.benefice_net_global >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            Bénéfice Net
          </p>
          <p className={`text-xl font-bold ${balance.benefice_net_global >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(balance.benefice_net_global)}
          </p>
        </div>
      </div>

      {/* Détail par bien */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Bien</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Revenus</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Dépenses</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Bénéfice</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {balance.items.map((item: BalanceItem) => (
              <tr key={item.bien_id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-3 px-4 text-sm text-zinc-900">{item.adresse}</td>
                <td className="py-3 px-4 text-sm font-medium text-green-600">
                  {formatCurrency(item.total_revenus)}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-red-600">
                  {formatCurrency(item.total_depenses)}
                </td>
                <td className={`py-3 px-4 text-sm font-medium ${item.benefice_net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(item.benefice_net)}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-600">
                  {item.nombre_paiements} paiements, {item.nombre_depenses} dépenses
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
