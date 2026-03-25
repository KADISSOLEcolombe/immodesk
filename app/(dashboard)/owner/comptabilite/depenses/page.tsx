"use client";


import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Download, Pencil, Trash2, Loader2 } from 'lucide-react';
import { DepensesList } from '@/components/comptabilite/DepensesList';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { Bien, Depense, CategorieDepense } from '@/types/api';


const CATEGORIES: Array<{ value: CategorieDepense; label: string }> = [
  { value: 'travaux', label: 'Travaux' },
  { value: 'taxe', label: 'Taxe' },
  { value: 'frais_agence', label: 'Frais agence' },
  { value: 'copropriete', label: 'Copropriété' },
  { value: 'autre', label: 'Autre' },
];

const EMPTY_FORM = {
  bien: '',
  categorie: 'autre',
  intitule: '',
  montant: '',
  description: '',
  date_depense: new Date().toISOString().slice(0, 10),
};

export default function DepensesPage() {
  const { addNotification } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Depense | null>(null);
  const [formState, setFormState] = useState({ ...EMPTY_FORM });
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    PatrimoineService.getBiens().then((res) => {
      if (res.success && res.data) setBiens(res.data);
    });
  }, []);

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormState({ ...EMPTY_FORM });
    setFormFile(null);
    setShowModal(true);
  };

  const openEditModal = (depense: Depense) => {
    setEditingExpense(depense);
    setFormState({
      bien: depense.bien,
      categorie: depense.categorie,
      intitule: depense.intitule,
      montant: String(depense.montant),
      description: depense.description || '',
      date_depense: depense.date_depense,
    });
    setFormFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormState({ ...EMPTY_FORM });
    setFormFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const amount = Number(formState.montant);
      if (!formState.bien || !formState.intitule.trim() || !formState.date_depense || Number.isNaN(amount) || amount <= 0) {
        addNotification({
          type: 'alerte',
          titre: 'Formulaire invalide',
          message: 'Bien, intitulé, date et montant positif sont obligatoires.',
        });
        setIsSubmitting(false);
        return;
      }
      const payloadWithFile = new FormData();
      payloadWithFile.append('bien', formState.bien);
      payloadWithFile.append('categorie', formState.categorie);
      payloadWithFile.append('intitule', formState.intitule.trim());
      payloadWithFile.append('montant', String(amount));
      payloadWithFile.append('description', formState.description.trim());
      payloadWithFile.append('date_depense', formState.date_depense);
      if (formFile) payloadWithFile.append('justificatif', formFile);

      const payloadWithoutFile = {
        bien: formState.bien,
        categorie: formState.categorie,
        intitule: formState.intitule.trim(),
        montant: amount,
        description: formState.description.trim(),
        date_depense: formState.date_depense,
      };

      let response;
      if (editingExpense) {
        response = await ComptabiliteService.updateDepense(editingExpense.id, formFile ? payloadWithFile : payloadWithoutFile);
      } else {
        response = await ComptabiliteService.createDepense(formFile ? payloadWithFile : payloadWithoutFile);
      }

      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: 'Erreur',
          message: response.message || 'Impossible de sauvegarder la dépense.',
        });
        setIsSubmitting(false);
        return;
      }
      addNotification({
        type: 'info',
        titre: editingExpense ? 'Dépense modifiée' : 'Dépense créée',
        message: '',
      });
      setRefreshKey((k) => k + 1);
      closeModal();
    } catch (err) {
      addNotification({
        type: 'alerte',
        titre: 'Erreur serveur',
        message: 'Impossible de sauvegarder la dépense.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (depense: Depense) => {
    if (!window.confirm('Confirmer la suppression de cette dépense ?')) return;
    setIsDeletingId(depense.id);
    try {
      const response = await ComptabiliteService.deleteDepense(depense.id);
      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: 'Suppression échouée',
          message: response.message || 'Impossible de supprimer la dépense.',
        });
        setIsDeletingId(null);
        return;
      }
      addNotification({
        type: 'info',
        titre: 'Dépense supprimée',
        message: '',
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      addNotification({
        type: 'alerte',
        titre: 'Erreur serveur',
        message: 'Impossible de supprimer la dépense.',
      });
    } finally {
      setIsDeletingId(null);
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
            onClick={openCreateModal}
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
        <DepensesList key={refreshKey} />
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">{editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs font-medium text-zinc-600">
                Bien
                <select
                  value={formState.bien}
                  onChange={(e) => setFormState((f) => ({ ...f, bien: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                >
                  <option value="">Sélectionner un bien</option>
                  {biens.map((bien) => (
                    <option key={bien.id} value={bien.id}>{bien.titre || bien.adresse || bien.id}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-zinc-600">
                Catégorie
                <select
                  value={formState.categorie}
                  onChange={(e) => setFormState((f) => ({ ...f, categorie: e.target.value as CategorieDepense }))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-zinc-600">
                Intitulé
                <input
                  value={formState.intitule}
                  onChange={(e) => setFormState((f) => ({ ...f, intitule: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-zinc-600">
                Montant (FCFA)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formState.montant}
                  onChange={(e) => setFormState((f) => ({ ...f, montant: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-zinc-600">
                Date de dépense
                <input
                  type="date"
                  value={formState.date_depense}
                  onChange={(e) => setFormState((f) => ({ ...f, date_depense: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-zinc-600">
                Description
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </label>
              <label className="block text-xs font-medium text-zinc-600">
                Justificatif (PDF/image, optionnel)
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-zinc-700"
                />
              </label>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (editingExpense ? 'Modification...' : 'Création...') : (editingExpense ? 'Enregistrer' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
