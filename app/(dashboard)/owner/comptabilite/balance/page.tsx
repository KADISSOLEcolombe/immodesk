"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { BalanceCard } from '@/components/comptabilite/BalanceCard';
import { ComptabiliteService } from '@/lib/comptabilite-service';

export default function BalancePage() {
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport2044 = async () => {
    try {
      setIsExporting(true);
      const annee = new Date().getFullYear();
      const response = await ComptabiliteService.export2044({ annee });
      
      if (response.success) {
        // Créer un blob et télécharger le fichier
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `declaration_2044_${annee}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/owner" 
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport2044}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Export en cours...' : 'Déclaration 2044'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Balance Comptable</h1>
        <p className="text-sm text-zinc-600 mt-1">Vue d&apos;ensemble de vos revenus et dépenses</p>
      </div>

      {/* Filtres de période */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Date début</label>
            <input 
              type="date" 
              value={periodeDebut}
              onChange={(e) => setPeriodeDebut(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Date fin</label>
            <input 
              type="date" 
              value={periodeFin}
              onChange={(e) => setPeriodeFin(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <button 
            onClick={() => {setPeriodeDebut(''); setPeriodeFin('');}}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <BalanceCard 
        periodeDebut={periodeDebut || undefined} 
        periodeFin={periodeFin || undefined} 
      />

      {/* Informations fiscales */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="text-base font-semibold text-blue-900 mb-2">Information fiscale</h3>
        <p className="text-sm text-blue-700">
          La déclaration 2044 permet de déclarer vos revenus fonciers à l&apos;administration fiscale. 
          Cette déclaration doit être effectuée annuellement et inclut l&apos;ensemble de vos revenus locatifs 
          ainsi que les charges déductibles (travaux, taxes, frais d&apos;agence, etc.).
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
          <FileText className="w-4 h-4" />
          <span>Format d&apos;export compatible avec le portail des impôts</span>
        </div>
      </div>
    </div>
  );
}
