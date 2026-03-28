"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Download, Loader2, X } from 'lucide-react';
import { PaiementsList } from '@/components/comptabilite/PaiementsList';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { LocationsService } from '@/lib/locations-service';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { Bail } from '@/types/api';

export default function PaiementsPage() {
  const { addNotification } = useNotifications();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [baux, setBaux] = useState<Bail[]>([]);
  const [bauxLoading, setBauxLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    bail: '',
    intitule: '',
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    mois_concerne: new Date().toISOString().slice(0, 7) + '-01',
  });

  useEffect(() => {
    if (showAddModal) {
      loadBaux();
    }
  }, [showAddModal]);

  const loadBaux = async () => {
    try {
      setBauxLoading(true);
      const response = await LocationsService.getBaux({ actif: true });
      if (response.success && response.data) {
        setBaux(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement baux:', err);
    } finally {
      setBauxLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bail || !formData.intitule || !formData.montant) {
      addNotification({
        type: 'alerte',
        titre: 'Champs obligatoires manquants',
        message: 'Veuillez remplir tous les champs requis.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await ComptabiliteService.createPaiement({
        bail: formData.bail,
        intitule: formData.intitule,
        montant: parseFloat(formData.montant),
        date_paiement: formData.date_paiement,
        mois_concerne: formData.mois_concerne,
      });

      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: 'Erreur de création',
          message: response.message || 'Impossible de créer le paiement.',
        });
        return;
      }

      addNotification({
        type: 'paiement',
        titre: 'Paiement créé',
        message: 'Le paiement manuel a été enregistré avec succès.',
      });

      setShowAddModal(false);
      setFormData({
        bail: '',
        intitule: '',
        montant: '',
        date_paiement: new Date().toISOString().split('T')[0],
        mois_concerne: new Date().toISOString().slice(0, 7) + '-01',
      });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Erreur création paiement:', err);
      addNotification({
        type: 'alerte',
        titre: 'Erreur technique',
        message: 'Une erreur est survenue lors de la création du paiement.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await ComptabiliteService.getPaiements({ page_size: 1000 });
      
      if (!response.success || !response.data) {
        addNotification({
          type: 'alerte',
          titre: 'Erreur d\'export',
          message: 'Impossible de récupérer les données.',
        });
        return;
      }

      const csvContent = [
        ['Intitulé', 'Montant', 'Date paiement', 'Mois concerné', 'Source', 'Statut', 'Référence'].join(','),
        ...response.data.map(p => [
          `"${p.intitule}"`,
          p.montant,
          p.date_paiement,
          p.mois_concerne,
          p.source_paiement,
          p.statut,
          p.transaction_ref || '',
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `paiements_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addNotification({
        type: 'info',
        titre: 'Export réussi',
        message: 'Les paiements ont été exportés en CSV.',
      });
    } catch (err) {
      console.error('Erreur export:', err);
      addNotification({
        type: 'alerte',
        titre: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export.',
      });
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau paiement
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exporter
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Paiements & Loyers</h1>
        <p className="text-sm text-zinc-600 mt-1">Historique complet des paiements reçus</p>
      </div>

      {/* Liste des paiements */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <PaiementsList key={refreshKey} />
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Nouveau paiement manuel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Bail *
                </label>
                {bauxLoading ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </div>
                ) : (
                  <select
                    value={formData.bail}
                    onChange={(e) => setFormData({ ...formData, bail: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  >
                    <option value="">Sélectionner un bail</option>
                    {baux.map((bail) => (
                      <option key={bail.id} value={bail.id}>
                        {bail.bien_adresse || 'Bien inconnu'} - {bail.locataire_nom || 'Locataire inconnu'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Intitulé *
                </label>
                <input
                  type="text"
                  value={formData.intitule}
                  onChange={(e) => setFormData({ ...formData, intitule: e.target.value })}
                  placeholder="Ex: Loyer mars 2026"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Montant (XOF) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Date de paiement *
                </label>
                <input
                  type="date"
                  value={formData.date_paiement}
                  onChange={(e) => setFormData({ ...formData, date_paiement: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Mois concerné *
                </label>
                <input
                  type="month"
                  value={formData.mois_concerne.slice(0, 7)}
                  onChange={(e) => setFormData({ ...formData, mois_concerne: e.target.value + '-01' })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
