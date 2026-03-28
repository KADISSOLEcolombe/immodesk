"use client";


import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Download, Pencil, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { DepensesList } from '@/components/comptabilite/DepensesList';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { Bien, Depense, CategorieDepense } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';


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
  const searchParams = useSearchParams();
  const { addNotification } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Depense | null>(null);
  const [formState, setFormState] = useState({ ...EMPTY_FORM });
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategorieDepense>('all');
  const [bienFilter, setBienFilter] = useState<'all' | string>('all');
  const [dateDebutFilter, setDateDebutFilter] = useState('');
  const [dateFinFilter, setDateFinFilter] = useState('');

  useEffect(() => {
    PatrimoineService.getBiens().then((res) => {
      if (res.success && res.data) setBiens(res.data);
    });
  }, []);

  useEffect(() => {
    fetchDepenses();
  }, [categoryFilter, bienFilter, dateDebutFilter, dateFinFilter]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }
  }, [searchParams]);

  const fetchDepenses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ComptabiliteService.getDepenses({
        bien: bienFilter === 'all' ? undefined : bienFilter,
        categorie: categoryFilter === 'all' ? undefined : categoryFilter,
        date_debut: dateDebutFilter || undefined,
        date_fin: dateFinFilter || undefined,
      });

      if (response.success && response.data) {
        setDepenses(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement des dépenses');
      }
    } catch (err) {
      setError('Erreur technique lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

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
        categorie: formState.categorie as CategorieDepense,
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
      fetchDepenses();
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
      fetchDepenses();
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

  const resolveBienLabel = (bienId: string) => {
    const target = biens.find((item) => item.id === bienId);
    return target ? (target.titre || target.adresse || bienId) : bienId;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-black/5 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'all' | CategorieDepense)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <select
          value={bienFilter}
          onChange={(e) => setBienFilter(e.target.value)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
        >
          <option value="all">Tous les biens</option>
          {biens.map((bien) => (
            <option key={bien.id} value={bien.id}>{resolveBienLabel(bien.id)}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateDebutFilter}
          onChange={(e) => setDateDebutFilter(e.target.value)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
        />

        <input
          type="date"
          value={dateFinFilter}
          onChange={(e) => setDateFinFilter(e.target.value)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
        />

        <button
          onClick={() => {
            setCategoryFilter('all');
            setBienFilter('all');
            setDateDebutFilter('');
            setDateFinFilter('');
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Réinitialiser
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : depenses.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">Aucune dépense trouvée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Intitulé</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Bien</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Catégorie</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Montant</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((depense) => (
                  <tr key={depense.id} className="border-b border-zinc-100 hover:bg-zinc-50 group">
                    <td className="px-3 py-4 text-sm text-zinc-900 font-medium">{depense.intitule}</td>
                    <td className="px-3 py-4 text-sm text-zinc-600">{resolveBienLabel(depense.bien)}</td>
                    <td className="px-3 py-4 text-sm text-zinc-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                        {CATEGORIES.find(c => c.value === depense.categorie)?.label || depense.categorie}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-zinc-900">{formatCurrency(depense.montant)}</td>
                    <td className="px-3 py-4 text-sm text-zinc-600">{formatDate(depense.date_depense)}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(depense)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(depense)}
                          disabled={isDeletingId === depense.id}
                          className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {isDeletingId === depense.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Floating Action Button for New Expense */}
      <button
        type="button"
        onClick={openCreateModal}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-110 hover:bg-zinc-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
        title="Nouvelle dépense"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}
