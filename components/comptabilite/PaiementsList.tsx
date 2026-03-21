"use client";

import { useEffect, useState } from 'react';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { Paiement, StatutPaiement } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaiementsListProps {
  bailId?: string;
  limit?: number;
}

const statusStyles: Record<StatutPaiement, { label: string; className: string }> = {
  paye: { label: 'Payé', className: 'bg-green-100 text-green-700' },
  en_retard: { label: 'En retard', className: 'bg-red-100 text-red-700' },
  impaye: { label: 'Impayé', className: 'bg-orange-100 text-orange-700' },
};

const sourceLabels: Record<string, string> = {
  manuel: 'Manuel',
  mixx_by_yas: 'Mixx by Yas',
  moov_money: 'Moov Money',
  carte_bancaire: 'Carte bancaire',
};

export function PaiementsList({ bailId, limit }: PaiementsListProps) {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaiements();
  }, [bailId]);

  const loadPaiements = async () => {
    try {
      setIsLoading(true);
      const response = bailId 
        ? await ComptabiliteService.getHistoriquePaiements(bailId)
        : await ComptabiliteService.getPaiements();
      
      if (response.success && response.data) {
        const data = limit ? response.data.slice(0, limit) : response.data;
        setPaiements(data);
      } else {
        setError(response.message || 'Erreur lors du chargement des paiements');
      }
    } catch (err) {
      setError('Erreur technique lors du chargement');
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

  if (paiements.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Aucun paiement enregistré</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Intitulé</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Montant</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Date</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Mois concerné</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Source</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Statut</th>
          </tr>
        </thead>
        <tbody>
          {paiements.map((paiement) => (
            <tr key={paiement.id} className="border-b border-zinc-100 hover:bg-zinc-50">
              <td className="py-3 px-4 text-sm text-zinc-900">{paiement.intitule}</td>
              <td className="py-3 px-4 text-sm font-medium text-zinc-900">
                {formatCurrency(paiement.montant)}
              </td>
              <td className="py-3 px-4 text-sm text-zinc-600">{formatDate(paiement.date_paiement)}</td>
              <td className="py-3 px-4 text-sm text-zinc-600">
                {new Date(paiement.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </td>
              <td className="py-3 px-4 text-sm text-zinc-600">
                {sourceLabels[paiement.source_paiement] || paiement.source_paiement}
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[paiement.statut].className}`}>
                  {statusStyles[paiement.statut].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
