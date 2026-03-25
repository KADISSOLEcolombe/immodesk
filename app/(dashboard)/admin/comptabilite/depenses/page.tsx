"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { Bien, CategorieDepense, Depense } from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';

type ExpenseFormState = {
  bien: string;
  categorie: CategorieDepense;
  intitule: string;
  montant: string;
  description: string;
  date_depense: string;
};

const CATEGORIES: Array<{ value: CategorieDepense; label: string }> = [
  { value: 'travaux', label: 'Travaux' },
  { value: 'taxe', label: 'Taxe' },
  { value: 'frais_agence', label: 'Frais agence' },
  { value: 'copropriete', label: 'Copropriete' },
  { value: 'autre', label: 'Autre' },
];

const EMPTY_FORM: ExpenseFormState = {
  bien: '',
  categorie: 'autre',
  intitule: '',
  montant: '',
  description: '',
  date_depense: new Date().toISOString().slice(0, 10),
};

const toAmountNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function AdminDepensesGlobalesPage() {
  const { addNotification } = useNotifications();

  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'all' | CategorieDepense>('all');
  const [bienFilter, setBienFilter] = useState<'all' | string>('all');
  const [dateDebutFilter, setDateDebutFilter] = useState('');
  const [dateFinFilter, setDateFinFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ExpenseFormState>(EMPTY_FORM);
  const [formFile, setFormFile] = useState<File | null>(null);

  const currentEditingExpense = useMemo(
    () => depenses.find((item) => item.id === editingExpenseId) || null,
    [depenses, editingExpenseId],
  );

  const fetchBiens = async () => {
    try {
      const response = await PatrimoineService.getBiens();
      if (response.success && response.data) {
        setBiens(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement biens:', err);
    }
  };

  const fetchDepenses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ComptabiliteService.getDepenses({
        bien_id: bienFilter === 'all' ? undefined : bienFilter,
        categorie: categoryFilter === 'all' ? undefined : categoryFilter,
        date_debut: dateDebutFilter || undefined,
        date_fin: dateFinFilter || undefined,
      });

      if (!response.success || !response.data) {
        setError(response.message || 'Impossible de charger les depenses.');
        return;
      }

      setDepenses(response.data);
    } catch (err) {
      setError('Erreur de connexion lors du chargement des depenses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBiens();
  }, []);

  useEffect(() => {
    fetchDepenses();
  }, [categoryFilter, bienFilter, dateDebutFilter, dateFinFilter]);

  const resetForm = () => {
    setFormState(EMPTY_FORM);
    setFormFile(null);
    setEditingExpenseId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (depense: Depense) => {
    setEditingExpenseId(depense.id);
    setFormState({
      bien: depense.bien,
      categorie: depense.categorie,
      intitule: depense.intitule,
      montant: String(toAmountNumber(depense.montant)),
      description: depense.description || '',
      date_depense: depense.date_depense,
    });
    setFormFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(formState.montant);
    if (!formState.bien || !formState.intitule.trim() || !formState.date_depense || Number.isNaN(amount) || amount <= 0) {
      addNotification({
        type: 'alerte',
        titre: 'Formulaire invalide',
        message: 'Bien, intitule, date et montant positif sont obligatoires.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payloadWithFile = new FormData();
      payloadWithFile.append('bien', formState.bien);
      payloadWithFile.append('categorie', formState.categorie);
      payloadWithFile.append('intitule', formState.intitule.trim());
      payloadWithFile.append('montant', String(amount));
      payloadWithFile.append('description', formState.description.trim());
      payloadWithFile.append('date_depense', formState.date_depense);
      if (formFile) {
        payloadWithFile.append('justificatif', formFile);
      }

      const payloadWithoutFile: Partial<Depense> = {
        bien: formState.bien,
        categorie: formState.categorie,
        intitule: formState.intitule.trim(),
        montant: amount,
        description: formState.description.trim(),
        date_depense: formState.date_depense,
      };

      const response = editingExpenseId
        ? await ComptabiliteService.updateDepense(editingExpenseId, formFile ? payloadWithFile : payloadWithoutFile)
        : await ComptabiliteService.createDepense(formFile ? payloadWithFile : payloadWithoutFile);

      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: 'Echec de la sauvegarde',
          message: response.message || 'Operation impossible.',
        });
        return;
      }

      addNotification({
        type: 'info',
        titre: editingExpenseId ? 'Depense modifiee' : 'Depense creee',
        message: '',
      });

      closeModal();
      fetchDepenses();
    } catch (err) {
      console.error('Erreur sauvegarde depense:', err);
      addNotification({
        type: 'alerte',
        titre: 'Erreur serveur',
        message: 'Impossible de sauvegarder la depense.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (depenseId: string) => {
    const shouldDelete = window.confirm('Confirmer la suppression de cette depense ?');
    if (!shouldDelete) {
      return;
    }

    setIsDeletingId(depenseId);
    try {
      const response = await ComptabiliteService.deleteDepense(depenseId);
      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: 'Suppression echouee',
          message: response.message || 'Impossible de supprimer la depense.',
        });
        return;
      }

      setDepenses((current) => current.filter((item) => item.id !== depenseId));
      addNotification({
        type: 'info',
        titre: 'Depense supprimee',
        message: '',
      });
    } catch (err) {
      addNotification({
        type: 'alerte',
        titre: 'Erreur serveur',
        message: 'Impossible de supprimer la depense.',
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const resolveBienLabel = (bienId: string) => {
    const target = biens.find((item) => item.id === bienId);
    if (!target) {
      return bienId;
    }

    return target.titre || target.adresse || target.adresse_complete || target.id;
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Depenses globales</h1>
          <p className="text-sm text-zinc-600">Gestion SuperAdmin des depenses de tous les biens.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle depense
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-black/5 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as 'all' | CategorieDepense)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
        >
          <option value="all">Toutes categories</option>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <select
          value={bienFilter}
          onChange={(event) => setBienFilter(event.target.value)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
        >
          <option value="all">Tous les biens</option>
          {biens.map((bien) => (
            <option key={bien.id} value={bien.id}>
              {resolveBienLabel(bien.id)}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateDebutFilter}
          onChange={(event) => setDateDebutFilter(event.target.value)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          placeholder="Date debut"
        />

        <input
          type="date"
          value={dateFinFilter}
          onChange={(event) => setDateFinFilter(event.target.value)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          placeholder="Date fin"
        />

        <button
          type="button"
          onClick={() => {
            setCategoryFilter('all');
            setBienFilter('all');
            setDateDebutFilter('');
            setDateFinFilter('');
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reinitialiser
        </button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && depenses.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500">Aucune depense trouvee avec les filtres actuels.</p>
        )}

        {!isLoading && !error && depenses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Intitule</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Bien</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Categorie</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Montant</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Justificatif</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((depense) => (
                  <tr key={depense.id} className="border-b border-zinc-100">
                    <td className="px-3 py-3 text-sm text-zinc-900">{depense.intitule}</td>
                    <td className="px-3 py-3 text-sm text-zinc-700">{resolveBienLabel(depense.bien)}</td>
                    <td className="px-3 py-3 text-sm text-zinc-700">{depense.categorie}</td>
                    <td className="px-3 py-3 text-sm font-medium text-zinc-900">{formatCurrency(toAmountNumber(depense.montant))}</td>
                    <td className="px-3 py-3 text-sm text-zinc-700">{formatDate(depense.date_depense)}</td>
                    <td className="px-3 py-3 text-sm text-zinc-700">
                      {depense.justificatif ? (
                        <a
                          href={depense.justificatif}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-900 underline underline-offset-2"
                        >
                          Ouvrir
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(depense)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(depense.id)}
                          disabled={isDeletingId === depense.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {isDeletingId === depense.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                          Supprimer
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-black/5 bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingExpenseId ? 'Modifier la depense' : 'Nouvelle depense'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-zinc-600">
                  Bien
                  <select
                    value={formState.bien}
                    onChange={(event) => setFormState((current) => ({ ...current, bien: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                    required
                  >
                    <option value="">Selectionner un bien</option>
                    {biens.map((bien) => (
                      <option key={bien.id} value={bien.id}>
                        {resolveBienLabel(bien.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-zinc-600">
                  Categorie
                  <select
                    value={formState.categorie}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, categorie: event.target.value as CategorieDepense }))
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                    required
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-zinc-600">
                  Intitule
                  <input
                    value={formState.intitule}
                    onChange={(event) => setFormState((current) => ({ ...current, intitule: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                    required
                  />
                </label>

                <label className="text-xs font-medium text-zinc-600">
                  Montant (FCFA)
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formState.montant}
                    onChange={(event) => setFormState((current) => ({ ...current, montant: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                    required
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-zinc-600">
                Date de depense
                <input
                  type="date"
                  value={formState.date_depense}
                  onChange={(event) => setFormState((current) => ({ ...current, date_depense: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                />
              </label>

              <label className="block text-xs font-medium text-zinc-600">
                Description
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </label>

              <label className="block text-xs font-medium text-zinc-600">
                Justificatif (optionnel)
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(event) => setFormFile(event.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-zinc-700"
                />
              </label>

              {editingExpenseId && currentEditingExpense?.justificatif && !formFile && (
                <p className="text-xs text-zinc-500">
                  Justificatif actuel:
                  {' '}
                  <a href={currentEditingExpense.justificatif} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    consulter
                  </a>
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
