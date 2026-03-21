"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Download } from 'lucide-react';
import { DepensesList } from '@/components/comptabilite/DepensesList';

export default function DepensesPage() {
  const [showAddModal, setShowAddModal] = useState(false);

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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle dépense
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dépenses</h1>
        <p className="text-sm text-zinc-600 mt-1">Suivi des charges et dépenses par bien</p>
      </div>

      {/* Liste des dépenses */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <DepensesList />
      </div>

      {/* Modal d'ajout (placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Nouvelle dépense</h2>
            <p className="text-sm text-zinc-600 mb-4">
              Cette fonctionnalité permettra d&apos;enregistrer une nouvelle dépense.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Annuler
              </button>
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
