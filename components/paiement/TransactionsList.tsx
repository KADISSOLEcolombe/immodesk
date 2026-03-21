"use client";

import { useEffect, useState } from 'react';
import { PaiementEnLigneService } from '@/lib/paiement-en-ligne-service';
import { TransactionPaiement, StatutTransaction, MoyenPaiement } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Check, X, Clock, AlertCircle, CreditCard, Smartphone, Wallet } from 'lucide-react';

interface TransactionsListProps {
  bailId?: string;
  limit?: number;
}

const statusConfig: Record<StatutTransaction, { label: string; className: string; icon: any }> = {
  en_attente: { 
    label: 'En attente', 
    className: 'bg-yellow-100 text-yellow-700',
    icon: Clock
  },
  valide: { 
    label: 'Validé', 
    className: 'bg-green-100 text-green-700',
    icon: Check
  },
  echoue: { 
    label: 'Échoué', 
    className: 'bg-red-100 text-red-700',
    icon: X
  },
  annule: { 
    label: 'Annulé', 
    className: 'bg-gray-100 text-gray-700',
    icon: AlertCircle
  },
};

const moyenConfig: Record<MoyenPaiement, { label: string; icon: any }> = {
  moov_money: { label: 'Moov Money', icon: Smartphone },
  mixx_by_yas: { label: 'Mixx by Yas', icon: Wallet },
  carte_bancaire: { label: 'Carte Bancaire', icon: CreditCard },
};

export function TransactionsList({ bailId, limit }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<TransactionPaiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [bailId]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = bailId 
        ? await PaiementEnLigneService.getHistoriqueParBail(bailId)
        : await PaiementEnLigneService.getHistoriqueTransactions();
      
      if (response.success && response.data) {
        const data = limit ? response.data.slice(0, limit) : response.data;
        setTransactions(data);
      } else {
        setError(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur technique');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Aucune transaction</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Référence</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Moyen</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Montant</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Mois</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Date</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Statut</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const status = statusConfig[transaction.statut];
            const StatusIcon = status.icon;
            const moyen = moyenConfig[transaction.moyen_paiement];
            const MoyenIcon = moyen.icon;

            return (
              <tr key={transaction.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-3 px-4 text-sm font-mono text-zinc-600">
                  {transaction.reference}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <MoyenIcon className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-700">{moyen.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-zinc-900">
                  {formatCurrency(transaction.montant)}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-600">
                  {new Date(transaction.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-600">
                  {formatDate(transaction.date_initiation)}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
