"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2, PlusCircle, Tags, Trash2, X } from 'lucide-react';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { Categorie } from '@/types/api';

type CategoryForm = {
  nom: string;
  type_detail: string;
};

const INITIAL_FORM: CategoryForm = {
  nom: '',
  type_detail: '',
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CategoryForm>(INITIAL_FORM);
  const [editForm, setEditForm] = useState<CategoryForm>(INITIAL_FORM);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })),
    [categories],
  );

  const clearMessages = () => {
    setError(null);
    setSuccessMessage('');
  };

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      clearMessages();
      const response = await PatrimoineService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.message || 'Impossible de charger les catégories.');
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      setError('Erreur technique lors du chargement des catégories.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!createForm.nom.trim()) {
      setError('Le nom de la catégorie est obligatoire.');
      return;
    }

    try {
      setIsCreating(true);
      const response = await PatrimoineService.createCategory({
        nom: createForm.nom.trim(),
        type_detail: createForm.type_detail.trim(),
      });

      if (!response.success || !response.data) {
        setError(response.message || 'Échec de la création de la catégorie.');
        return;
      }

      setCreateForm(INITIAL_FORM);
      setSuccessMessage('Catégorie créée avec succès.');
      await loadCategories();
    } catch (err) {
      console.error('Erreur création catégorie:', err);
      setError('Erreur technique lors de la création de la catégorie.');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (category: Categorie) => {
    clearMessages();
    setEditingCategoryId(category.id);
    setEditForm({ nom: category.nom, type_detail: category.type_detail || '' });
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditForm(INITIAL_FORM);
  };

  const handleUpdate = async (categoryId: string) => {
    clearMessages();

    if (!editForm.nom.trim()) {
      setError('Le nom de la catégorie est obligatoire.');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await PatrimoineService.updateCategory(categoryId, {
        nom: editForm.nom.trim(),
        type_detail: editForm.type_detail.trim(),
      });

      if (!response.success) {
        setError(response.message || 'Échec de la mise à jour.');
        return;
      }

      setSuccessMessage('Catégorie mise à jour avec succès.');
      cancelEdit();
      await loadCategories();
    } catch (err) {
      console.error('Erreur update catégorie:', err);
      setError('Erreur technique lors de la mise à jour.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (category: Categorie) => {
    clearMessages();

    const isConfirmed = window.confirm(
      `Voulez-vous vraiment supprimer la catégorie "${category.nom}" ?`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setDeletingCategoryId(category.id);
      const response = await PatrimoineService.deleteCategory(category.id);

      if (!response.success) {
        setError(response.message || 'Suppression impossible. Vérifiez si des biens utilisent cette catégorie.');
        return;
      }

      setSuccessMessage('Catégorie supprimée avec succès.');
      await loadCategories();
    } catch (err) {
      console.error('Erreur suppression catégorie:', err);
      setError('Erreur technique lors de la suppression.');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <Tags className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Gestion des catégories</h1>
      </div>

      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 inline-flex items-center gap-2 text-zinc-900">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <h2 className="text-base font-semibold">Créer une catégorie</h2>
        </div>

        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 md:col-span-1">
            Nom *
            <input
              type="text"
              value={createForm.nom}
              onChange={(e) => setCreateForm((current) => ({ ...current, nom: e.target.value }))}
              placeholder="Ex: Appartement"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 md:col-span-1">
            Type détail
            <input
              type="text"
              value={createForm.type_detail}
              onChange={(e) => setCreateForm((current) => ({ ...current, type_detail: e.target.value }))}
              placeholder="Ex: Studio"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>

          <div className="flex items-end md:col-span-1">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? 'Création...' : 'Créer la catégorie'}
            </button>
          </div>
        </form>
      </section>

      {(error || successMessage) && (
        <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          {successMessage && <p className="text-sm font-medium text-green-700">{successMessage}</p>}
        </div>
      )}

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Liste des catégories ({categories.length})</h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-500">Chargement des catégories...</p>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-zinc-500">Aucune catégorie trouvée</p>
            <p className="mt-1 text-sm text-zinc-400">Créez votre première catégorie ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCategories.map((category) => {
              const isEditing = editingCategoryId === category.id;
              const isDeleting = deletingCategoryId === category.id;

              return (
                <article key={category.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                  {!isEditing ? (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">{category.nom}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {category.type_detail || 'Sans type détail'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 md:col-span-1">
                        Nom *
                        <input
                          type="text"
                          value={editForm.nom}
                          onChange={(e) => setEditForm((current) => ({ ...current, nom: e.target.value }))}
                          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                          required
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 md:col-span-1">
                        Type détail
                        <input
                          type="text"
                          value={editForm.type_detail}
                          onChange={(e) => setEditForm((current) => ({ ...current, type_detail: e.target.value }))}
                          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                        />
                      </label>

                      <div className="flex items-end gap-2 md:col-span-1">
                        <button
                          type="button"
                          onClick={() => handleUpdate(category.id)}
                          disabled={isUpdating}
                          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
