"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Pencil, PlusCircle, Trash2, X } from 'lucide-react';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { normalizeMediaUrl } from '@/lib/utils';
import { UserResponse, UserService } from '@/lib/user-service';
import { Bien } from '@/types/api';
import { Categorie } from '@/types/api';

type AdminProperty = {
  id: string;
  title: string;
  address: string;
  status: string;
  image: string;
  raw: Bien;
};

type PropertyFormState = {
  proprietaire: string;
  categorie: string;
  adresse: string;
  description: string;
  loyer_hc: string;
  charges: string;
  statut: 'vacant' | 'loue' | 'en_travaux';
};

const statusLabel: Record<string, string> = {
  vacant: 'Vacant',
  loue: 'Loue',
  en_travaux: 'En travaux',
  maintenance: 'Maintenance',
  reservation: 'Reservation',
};

const INITIAL_FORM: PropertyFormState = {
  proprietaire: '',
  categorie: '',
  adresse: '',
  description: '',
  loyer_hc: '',
  charges: '0',
  statut: 'vacant',
};

function extractImage(property: Bien): string {
  const rawProperty = property as unknown as Record<string, unknown>;

  const normalizeCandidate = (value: unknown): string | null => {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }

    return normalizeMediaUrl(trimmed.replaceAll('\\', '/'));
  };

  const mainPhoto = normalizeCandidate(rawProperty.photo_principale);
  if (mainPhoto) {
    return mainPhoto;
  }

  if (Array.isArray(property.photos) && property.photos.length > 0) {
    const firstPhoto = normalizeCandidate(property.photos[0]?.fichier);
    if (firstPhoto) {
      return firstPhoto;
    }
  }

  if (Array.isArray(property.images) && property.images.length > 0) {
    const firstLegacyImage = normalizeCandidate(property.images[0]);
    if (firstLegacyImage) {
      return firstLegacyImage;
    }
  }

  return '/window.svg';
}

function mapProperty(property: Bien): AdminProperty {
  return {
    id: property.id,
    title: property.titre || `Bien ${property.id.slice(0, 8)}`,
    address: property.adresse || property.adresse_complete || 'Adresse non disponible',
    status: String(property.statut || 'vacant'),
    image: extractImage(property),
    raw: property,
  };
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [owners, setOwners] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PropertyFormState>(INITIAL_FORM);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage('');
  };

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      clearMessages();
      const response = await PatrimoineService.getBiens();

      if (!response.success || !response.data) {
        setError(response.message || 'Impossible de charger les biens.');
        return;
      }

      setProperties(response.data.map(mapProperty));
    } catch (err) {
      console.error('Erreur chargement biens admin:', err);
      setError('Erreur serveur lors du chargement des biens.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategoriesAndOwners = async () => {
    try {
      const [categoriesResponse, usersResponse] = await Promise.all([
        PatrimoineService.getCategories(),
        UserService.getAllUsers(),
      ]);

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (usersResponse.success && usersResponse.data) {
        setOwners(
          usersResponse.data.filter(
            (user) => user.role === 'proprietaire' || user.role === 'superadmin',
          ),
        );
      }
    } catch (err) {
      console.error('Erreur chargement options formulaire bien:', err);
    }
  };

  useEffect(() => {
    loadProperties();
    loadCategoriesAndOwners();
  }, []);

  const totalLabel = useMemo(() => `${properties.length} bien(s)`, [properties.length]);

  const resetForm = () => {
    setEditingPropertyId(null);
    setFormState(INITIAL_FORM);
  };

  const openCreateModal = () => {
    resetForm();
    clearMessages();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openEditModal = async (propertyId: string) => {
    clearMessages();

    try {
      const response = await PatrimoineService.getBien(propertyId);
      if (!response.success || !response.data) {
        setError(response.message || 'Impossible de charger le detail du bien.');
        return;
      }

      const bien = response.data;
      setEditingPropertyId(propertyId);
      setFormState({
        proprietaire: bien.proprietaire || '',
        categorie: bien.categorie || '',
        adresse: bien.adresse || bien.adresse_complete || '',
        description: bien.description || '',
        loyer_hc: String((bien as unknown as Record<string, unknown>).loyer_hc ?? ''),
        charges: String((bien as unknown as Record<string, unknown>).charges ?? 0),
        statut: (['vacant', 'loue', 'en_travaux'].includes(String(bien.statut))
          ? String(bien.statut)
          : 'vacant') as 'vacant' | 'loue' | 'en_travaux',
      });
      setIsModalOpen(true);
    } catch (err) {
      setError('Erreur technique lors du chargement du bien.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    const loyerValue = Number(formState.loyer_hc);
    const chargesValue = Number(formState.charges || 0);

    if (!formState.proprietaire || !formState.adresse.trim() || Number.isNaN(loyerValue) || loyerValue < 0) {
      setError('Proprietaire, adresse et loyer valide sont obligatoires.');
      return;
    }

    if (Number.isNaN(chargesValue) || chargesValue < 0) {
      setError('Les charges doivent etre un nombre positif.');
      return;
    }

    const payload = {
      proprietaire: formState.proprietaire,
      categorie: formState.categorie || null,
      adresse: formState.adresse.trim(),
      description: formState.description.trim(),
      loyer_hc: loyerValue,
      charges: chargesValue,
      statut: formState.statut,
    };

    try {
      setIsSubmitting(true);
      const response = editingPropertyId
        ? await PatrimoineService.updateBien(editingPropertyId, payload)
        : await PatrimoineService.createBien(payload);

      if (!response.success) {
        setError(response.message || 'Sauvegarde du bien impossible.');
        return;
      }

      setSuccessMessage(editingPropertyId ? 'Bien mis a jour avec succes.' : 'Bien cree avec succes.');
      closeModal();
      await loadProperties();
    } catch (err) {
      console.error('Erreur sauvegarde bien admin:', err);
      setError('Erreur technique lors de la sauvegarde du bien.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (property: AdminProperty) => {
    clearMessages();
    const isConfirmed = window.confirm(`Supprimer le bien "${property.title}" ?`);
    if (!isConfirmed) {
      return;
    }

    try {
      setDeletingPropertyId(property.id);
      const response = await PatrimoineService.deleteBien(property.id);
      if (!response.success) {
        setError(response.message || 'Suppression impossible.');
        return;
      }

      setSuccessMessage('Bien supprime avec succes.');
      await loadProperties();
    } catch (err) {
      console.error('Erreur suppression bien admin:', err);
      setError('Erreur technique lors de la suppression du bien.');
    } finally {
      setDeletingPropertyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <Building2 className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Tous les biens</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Nouveau bien
        </button>
      </div>

      {(error || successMessage) && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          {successMessage && <p className="text-sm font-medium text-green-700">{successMessage}</p>}
        </div>
      )}

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-sm text-zinc-600">Catalogue admin des biens: {totalLabel}</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" aria-hidden="true" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : properties.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Aucun bien trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/admin/properties/${property.id}`}
                className="group overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 transition hover:-translate-y-0.5 hover:border-zinc-200 hover:bg-white"
              >
                <div className="relative h-44 w-full overflow-hidden bg-zinc-100">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = '/window.svg';
                    }}
                  />
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-semibold text-zinc-900">{property.title}</p>
                  <p className="truncate text-xs text-zinc-600">{property.address}</p>
                  <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                    {statusLabel[property.status] || property.status}
                  </span>

                  <div className="flex gap-2 pt-1" onClick={(event) => event.preventDefault()}>
                    <button
                      type="button"
                      onClick={() => openEditModal(property.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(property)}
                      disabled={deletingPropertyId === property.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingPropertyId === property.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      Supprimer
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </article>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                {editingPropertyId ? 'Modifier le bien' : 'Creer un bien'}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  Categorie
                  <select
                    value={formState.categorie}
                    onChange={(event) => setFormState((current) => ({ ...current, categorie: event.target.value }))}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  >
                    <option value="">Aucune</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nom}{category.type_detail ? ` - ${category.type_detail}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                  Loyer HC *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formState.loyer_hc}
                    onChange={(event) => setFormState((current) => ({ ...current, loyer_hc: event.target.value }))}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                  Charges
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formState.charges}
                    onChange={(event) => setFormState((current) => ({ ...current, charges: event.target.value }))}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                  Statut
                  <select
                    value={formState.statut}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        statut: event.target.value as 'vacant' | 'loue' | 'en_travaux',
                      }))
                    }
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                  >
                    <option value="vacant">Vacant</option>
                    <option value="loue">Loue</option>
                    <option value="en_travaux">En travaux</option>
                  </select>
                </label>
              </div>

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
                  {isSubmitting ? 'Enregistrement...' : editingPropertyId ? 'Enregistrer' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
