"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Eye, Loader2, Pencil, PlusCircle, Trash2, X } from 'lucide-react';
import { Bien, Immeuble, TypeLogement } from '@/types/api';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { UserResponse, UserService } from '@/lib/user-service';

type BuildingForm = {
  proprietaire: string;
  nom: string;
  adresse: string;
  description: string;
  lien_maps: string;
  type_logement: string;
};

const INITIAL_FORM: BuildingForm = {
  proprietaire: '',
  nom: '',
  adresse: '',
  description: '',
  lien_maps: '',
  type_logement: 'studio',
};

export default function AdminBuildingsPage() {
  const { addNotification } = useNotifications();
  const [buildings, setBuildings] = useState<Immeuble[]>([]);
  const [owners, setOwners] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<BuildingForm>(INITIAL_FORM);

  const [error, setError] = useState<string | null>(null);
  const [biensPanelId, setBiensPanelId] = useState<string | null>(null);
  const [biensPanelData, setBiensPanelData] = useState<Bien[]>([]);
  const [biensPanelLoading, setBiensPanelLoading] = useState(false);

  const sortedBuildings = useMemo(
    () => [...buildings].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })),
    [buildings],
  );

  const clearMessages = () => {
    setError(null);
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
        type_logement: item.type_logement || 'studio',
      });
      setIsModalOpen(true);
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Erreur technique lors du chargement.', message: '' });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!formState.proprietaire || !formState.nom.trim() || !formState.adresse.trim()) {
      addNotification({ type: 'alerte', titre: 'Propriétaire, nom et adresse sont obligatoires.', message: '' });
      return;
    }

    // Payload aligné sur le modèle Django (apps/patrimoine/models.py)
    const payload: Partial<Immeuble> = {
      proprietaire: formState.proprietaire,
      nom: formState.nom.trim(),
      adresse: formState.adresse.trim(),
      description: formState.description.trim() || "",
      lien_maps: formState.lien_maps.trim() || "",
      type_logement: (formState.type_logement as TypeLogement) || "autre",
      // Champs par défaut pour garantir la validité du serializer
      espaces_exterieurs: [],
      accessibilite: [],
      etage: "",
      usage_special: ""
    };

    try {
      setIsSubmitting(true);
      const response = editingId
        ? await PatrimoineService.updateImmeuble(editingId, payload)
        : await PatrimoineService.createImmeuble(payload);

      if (!response.success) {
        const errorDetails = response.errors && response.errors.length > 0 
          ? response.errors.map(e => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ')
          : '';
        addNotification({ 
          type: 'alerte', 
          titre: response.message || 'Sauvegarde impossible.', 
          message: errorDetails || 'Vérifiez les champs obligatoires.'
        });
        return;
      }

      const label = editingId ? 'Immeuble mis à jour avec succès.' : 'Immeuble créé avec succès.';
      closeModal();
      await loadBuildings();
      addNotification({ type: 'info', titre: label, message: '' });
    } catch (err: any) {
      console.error('Erreur sauvegarde immeuble admin:', err);
      console.error('Détail erreur:', err?.response?.data || err);
      addNotification({ 
        type: 'alerte', 
        titre: 'Erreur technique lors de la sauvegarde.', 
        message: err?.response?.data?.detail || err?.message || 'Erreur inconnue'
      });
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
        addNotification({ type: 'alerte', titre: response.message || 'Suppression impossible.', message: '' });
        return;
      }

      addNotification({ type: 'info', titre: 'Immeuble supprimé avec succès.', message: '' });
      await loadBuildings();
    } catch (err) {
      console.error('Erreur suppression immeuble admin:', err);
      addNotification({ type: 'alerte', titre: 'Erreur technique lors de la suppression.', message: '' });
    } finally {
      setDeletingId(null);
    }
  };

  const openBiensPanel = async (immeubleId: string) => {
    setBiensPanelId(immeubleId);
    setBiensPanelData([]);
    setBiensPanelLoading(true);
    try {
      const response = await PatrimoineService.getImmeubleBiens(immeubleId);
      if (response.success && response.data) {
        setBiensPanelData(response.data);
      }
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Impossible de charger les biens de cet immeuble.', message: '' });
    } finally {
      setBiensPanelLoading(false);
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

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
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

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openBiensPanel(building.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Voir les biens
                    </button>
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

      {biensPanelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                Biens de l&apos;immeuble ({biensPanelData.length})
              </h2>
              <button
                type="button"
                onClick={() => { setBiensPanelId(null); setBiensPanelData([]); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {biensPanelLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : biensPanelData.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">Aucun bien dans cet immeuble.</p>
            ) : (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                {biensPanelData.map((bien) => (
                  <div key={bien.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{bien.titre || `Bien ${bien.id.slice(0, 8)}`}</p>
                      <p className="text-xs text-zinc-500">{bien.adresse || bien.adresse_complete || 'Adresse non disponible'}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                      {bien.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                {editingId ? 'Modifier immeuble' : 'Créer immeuble'}
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
                Type de logement
                <select
                  value={formState.type_logement}
                  onChange={(event) => setFormState((current) => ({ ...current, type_logement: event.target.value }))}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                >
                  <option value="studio">Studio</option>
                  <option value="t1">T1</option>
                  <option value="t2">T2</option>
                  <option value="t3">T3</option>
                  <option value="t4_plus">T4+</option>
                  <option value="duplex">Duplex</option>
                  <option value="loft">Loft</option>
                  <option value="villa">Villa</option>
                  <option value="maison">Maison</option>
                  <option value="autre">Autre</option>
                </select>
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
