"use client";

import { useEffect, useState } from 'react';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { Depense, CategorieDepense } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DepensesListProps {
  bienId?: string;
  limit?: number;
}

const categorieLabels: Record<CategorieDepense, string> = {
  travaux: 'Travaux',
  taxe: 'Taxe',
  frais_agence: 'Frais d\'agence',
  copropriete: 'Copropriété',
  autre: 'Autre',
};

const categorieStyles: Record<CategorieDepense, string> = {
  travaux: 'bg-blue-100 text-blue-700',
  taxe: 'bg-red-100 text-red-700',
  frais_agence: 'bg-purple-100 text-purple-700',
  copropriete: 'bg-orange-100 text-orange-700',
  autre: 'bg-gray-100 text-gray-700',
};

export function DepensesList({ bienId, limit }: DepensesListProps) {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepenses();
  }, [bienId]);

  const loadDepenses = async () => {
    try {
      setIsLoading(true);
      const params = bienId ? { bien: bienId } : undefined;
      const response = await ComptabiliteService.getDepenses(params);
      
      if (response.success && response.data) {
        const data = limit ? response.data.slice(0, limit) : response.data;
        setDepenses(data);
      } else {
        setError(response.message || 'Erreur lors du chargement des dépenses');
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

  if (depenses.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Aucune dépense enregistrée</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Intitulé</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Catégorie</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Montant</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Date</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">Description</th>
          </tr>
        </thead>
        <tbody>
          {depenses.map((depense) => (
            <tr key={depense.id} className="border-b border-zinc-100 hover:bg-zinc-50">
              <td className="py-3 px-4 text-sm text-zinc-900">{depense.intitule}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categorieStyles[depense.categorie]}`}>
                  {categorieLabels[depense.categorie]}
                </span>
              </td>
              <td className="py-3 px-4 text-sm font-medium text-zinc-900">
                {formatCurrency(depense.montant)}
              </td>
              <td className="py-3 px-4 text-sm text-zinc-600">{formatDate(depense.date_depense)}</td>
              <td className="py-3 px-4 text-sm text-zinc-600 max-w-xs truncate">
                {depense.description || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
