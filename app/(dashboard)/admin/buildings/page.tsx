"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Pencil, PlusCircle, Trash2, X } from 'lucide-react';
import { Immeuble } from '@/types/api';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { UserResponse, UserService } from '@/lib/user-service';

type BuildingForm = {
  proprietaire: string;
  nom: string;
  adresse: string;
  description: string;
  lien_maps: string;
};

const INITIAL_FORM: BuildingForm = {
  proprietaire: '',
  nom: '',
  adresse: '',
  description: '',
  lien_maps: '',
};

export default function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState<Immeuble[]>([]);
  const [owners, setOwners] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<BuildingForm>(INITIAL_FORM);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const sortedBuildings = useMemo(
    () => [...buildings].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })),
    [buildings],
  );

  const clearMessages = () => {
    setError(null);
    setSuccessMessage('');
  };

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      clearMessages();
      const response = await PatrimoineService.getImmeubles();
      if (!response.success || !response.data) {
        setError(response.message || 'Impossible de charger les immeubles.');
        return;
      }

      setBuildings(response.data);
    } catch (err) {
      console.error('Erreur chargement immeubles admin:', err);
      setError('Erreur technique lors du chargement des immeubles.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOwners = async () => {
    try {
      const response = await UserService.getAllUsers();
      if (!response.success || !response.data) {
        return;
      }

      setOwners(
        response.data.filter((user) => user.role === 'proprietaire' || user.role === 'superadmin'),
      );
    } catch (err) {
      console.error('Erreur chargement proprietaires immeubles:', err);
    }
  };

  useEffect(() => {
    loadBuildings();
    loadOwners();
  }, []);

  const resetForm = () => {
    setFormState(INITIAL_FORM);
    setEditingId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    clearMessages();
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = async (id: string) => {
    clearMessages();
    try {
      const response = await PatrimoineService.getImmeuble(id);
      if (!response.success || !response.data) {
        setError(response.message || 'Impossible de charger cet immeuble.');
        return;
      }

      const item = response.data;
      setEditingId(id);
      setFormState({
        proprietaire: item.proprietaire,
        nom: item.nom || '',
        adresse: item.adresse || '',
        description: item.description || '',
        lien_maps: item.lien_maps || '',
      });
      setIsModalOpen(true);
    } catch (err) {
      setError('Erreur technique lors du chargement.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!formState.proprietaire || !formState.nom.trim() || !formState.adresse.trim()) {
      setError('Proprietaire, nom et adresse sont obligatoires.');
      return;
    }

    const payload: Partial<Immeuble> = {
      proprietaire: formState.proprietaire,
      nom: formState.nom.trim(),
      adresse: formState.adresse.trim(),
      description: formState.description.trim(),
      lien_maps: formState.lien_maps.trim(),
    };

    try {
      setIsSubmitting(true);
      const response = editingId
        ? await PatrimoineService.updateImmeuble(editingId, payload)
        : await PatrimoineService.createImmeuble(payload);

      if (!response.success) {
        setError(response.message || 'Sauvegarde impossible.');
        return;
      }

      setSuccessMessage(editingId ? 'Immeuble mis a jour avec succes.' : 'Immeuble cree avec succes.');
      closeModal();
      await loadBuildings();
    } catch (err) {
      console.error('Erreur sauvegarde immeuble admin:', err);
      setError('Erreur technique lors de la sauvegarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: Immeuble) => {
    clearMessages();
    const isConfirmed = window.confirm(`Supprimer l'immeuble "${item.nom}" ?`);
    if (!isConfirmed) {
      return;
    }

    try {
      setDeletingId(item.id);
      const response = await PatrimoineService.deleteImmeuble(item.id);
      if (!response.success) {
        setError(response.message || 'Suppression impossible.');
        return;
      }

      setSuccessMessage('Immeuble supprime avec succes.');
      await loadBuildings();
    } catch (err) {
      console.error('Erreur suppression immeuble admin:', err);
      setError('Erreur technique lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const resolveOwnerLabel = (ownerId: string) => {
    const owner = owners.find((item) => item.id === ownerId);
    if (!owner) {
      return ownerId;
    }

    return owner.full_name || `${owner.first_name} ${owner.last_name}`.trim() || owner.email;
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <Building2 className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Gestion des immeubles</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Nouvel immeuble
        </button>
      </div>

      {(error || successMessage) && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          {successMessage && <p className="text-sm font-medium text-green-700">{successMessage}</p>}
        </div>
      )}

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Liste des immeubles ({buildings.length})</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-500" aria-hidden="true" />
          </div>
        ) : sortedBuildings.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Aucun immeuble trouve.</p>
        ) : (
          <div className="space-y-3">
            {sortedBuildings.map((building) => (
              <article key={building.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{building.nom}</p>
                    <p className="mt-0.5 text-xs text-zinc-600">{building.adresse}</p>
                    <p className="mt-1 text-xs text-zinc-500">Proprietaire: {resolveOwnerLabel(building.proprietaire)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(building.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(building)}
                      disabled={deletingId === building.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === building.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                {editingId ? 'Modifier immeuble' : 'Creer immeuble'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Proprietaire *
                <select
                  value={formState.proprietaire}
                  onChange={(event) => setFormState((current) => ({ ...current, proprietaire: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                >
                  <option value="">Selectionner</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name || `${owner.first_name} ${owner.last_name}`.trim() || owner.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Nom *
                <input
                  value={formState.nom}
                  onChange={(event) => setFormState((current) => ({ ...current, nom: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Adresse *
                <input
                  value={formState.adresse}
                  onChange={(event) => setFormState((current) => ({ ...current, adresse: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Description
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Lien maps
                <input
                  value={formState.lien_maps}
                  onChange={(event) => setFormState((current) => ({ ...current, lien_maps: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
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
                  {isSubmitting ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
