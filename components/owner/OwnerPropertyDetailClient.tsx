"use client";

import Link from 'next/link';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BedDouble, Building2, ChevronDown, ChevronUp, DoorOpen, Loader2, MapPin, Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import PropertyGallery from '@/components/PropertyGallery';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { normalizeMediaUrl } from '@/lib/utils';
import { Bien, PhotoBien } from '@/types/api';
import type { MapPropertyPoint } from '@/components/owner/PropertyLocationMap';

const PropertyLocationMap = dynamic(() => import('@/components/owner/PropertyLocationMap'), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-xl bg-zinc-100" />,
});

type UiStatus = 'vacant' | 'rented' | 'maintenance' | 'en_travaux';

type UiProperty = {
  id: string;
  title: string;
  description: string;
  address: string;
  buildingId: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsLink: string;
  city: string;
  status: UiStatus;
  surface: number;
  rooms: number;
  bedrooms: number;
  rentAmount: number;
  chargesAmount: number;
  photos: string[];
};

const statusStyles: Record<UiStatus, { label: string; className: string }> = {
  vacant: {
    label: 'Disponible',
    className: 'bg-green-100 text-green-700 ring-green-200',
  },
  rented: {
    label: 'Loué',
    className: 'bg-blue-100 text-blue-700 ring-blue-200',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-orange-100 text-orange-700 ring-orange-200',
  },
  en_travaux: {
    label: 'En travaux',
    className: 'bg-orange-100 text-orange-700 ring-orange-200',
  },
};

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

function mapStatutToUi(statut: Bien['statut']): UiStatus {
  if (statut === 'loue' || statut === 'reservation') {
    return 'rented';
  }

  if (statut === 'en_travaux') {
    return 'en_travaux';
  }

  if (statut === 'maintenance') {
    return 'maintenance';
  }

  return 'vacant';
}

function toUiProperty(bien: Bien): UiProperty {
  const title = bien.titre?.trim() ? bien.titre : `Bien ${bien.id}`;
  const address = bien.adresse_complete?.trim() || bien.adresse?.trim() || 'Adresse non disponible';
  const photoUrls = Array.isArray(bien.photos)
    ? bien.photos.map((photo) => photo?.fichier).filter((value): value is string => Boolean(value))
    : [];
  const legacyUrls = Array.isArray(bien.images) ? bien.images.filter(Boolean) : [];

  return {
    id: bien.id,
    title,
    description: bien.description?.trim() ? bien.description : 'Aucune description disponible.',
    address,
    buildingId: bien.immeuble ?? null,
    latitude: typeof bien.latitude === 'number' ? bien.latitude : null,
    longitude: typeof bien.longitude === 'number' ? bien.longitude : null,
    mapsLink: bien.lien_maps || '',
    city: '',
    status: mapStatutToUi(bien.statut),
    surface: Number(bien.surface || 0),
    rooms: Number(bien.nombre_pieces || 0),
    bedrooms: Number(bien.nombre_chambres || 0),
    rentAmount: Number((bien.loyer_hc ?? bien.loyer_mensuel) || 0),
    chargesAmount: Number((bien.charges ?? bien.charges_mensuelles) || 0),
    photos: photoUrls.length > 0 ? photoUrls : legacyUrls,
  };
}

function toMapPoint(bien: Bien): MapPropertyPoint | null {
  if (typeof bien.latitude !== 'number' || typeof bien.longitude !== 'number') {
    return null;
  }

  const title = bien.titre?.trim() ? bien.titre : `Bien ${bien.id}`;
  const address = bien.adresse_complete?.trim() || bien.adresse?.trim() || 'Adresse non disponible';

  return {
    id: bien.id,
    label: title,
    address,
    latitude: bien.latitude,
    longitude: bien.longitude,
  };
}

type OwnerPropertyDetailClientProps = {
  id: string;
  backHref?: string;
  backLabel?: string;
  preferHistoryBack?: boolean;
  showOwnerActions?: boolean;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  onEditClick?: (propertyId: string) => void;
};

export default function OwnerPropertyDetailClient({
  id,
  backHref = '/owner/properties',
  backLabel = 'Retour a Mes biens',
  preferHistoryBack = false,
  showOwnerActions = true,
  secondaryActionHref = '/owner/reports',
  secondaryActionLabel = 'Voir les rapports',
  onEditClick,
}: OwnerPropertyDetailClientProps) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [property, setProperty] = useState<UiProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPoints, setLocationPoints] = useState<MapPropertyPoint[]>([]);
  const [relatedCount, setRelatedCount] = useState(0);
  const [photoObjects, setPhotoObjects] = useState<PhotoBien[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const status = useMemo(() => (property ? statusStyles[property.status] : null), [property]);

  const handleBackNavigation = () => {
    if (preferHistoryBack && typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(backHref);
  };

  const loadPhotos = async () => {
    const response = await PatrimoineService.getBienPhotos(id);
    if (!response.success || !response.data) {
      return;
    }
    const sorted = [...response.data].sort((a, b) => a.ordre - b.ordre);
    setPhotoObjects(sorted);
    const urls = sorted
      .map((p) => p.fichier)
      .filter((u): u is string => Boolean(u))
      .map((u) => normalizeMediaUrl(u));
    setProperty((current) => {
      if (!current) return current;
      return { ...current, photos: urls };
    });
  };

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await PatrimoineService.getBien(id);

        if (!response.success || !response.data) {
          setError(response.message || 'Impossible de charger le detail du bien.');
          return;
        }

        const currentProperty = toUiProperty(response.data);
        setProperty(currentProperty);

        const points: MapPropertyPoint[] = [];
        if (currentProperty.latitude !== null && currentProperty.longitude !== null) {
          points.push({
            id: currentProperty.id,
            label: currentProperty.title,
            address: currentProperty.address,
            latitude: currentProperty.latitude,
            longitude: currentProperty.longitude,
            isCurrent: true,
          });
        }

        if (currentProperty.buildingId) {
          const relatedResponse = await PatrimoineService.getImmeubleBiens(currentProperty.buildingId);
          if (relatedResponse.success && relatedResponse.data) {
            const relatedPoints = relatedResponse.data
              .filter((bien) => bien.id !== currentProperty.id)
              .map(toMapPoint)
              .filter((point): point is MapPropertyPoint => point !== null);

            setRelatedCount(relatedResponse.data.filter((bien) => bien.id !== currentProperty.id).length);
            setLocationPoints([...points, ...relatedPoints]);
          } else {
            setRelatedCount(0);
            setLocationPoints(points);
          }
        } else {
          setRelatedCount(0);
          setLocationPoints(points);
        }

        await loadPhotos();
      } catch (err) {
        console.error('Erreur detail bien owner:', err);
        setError('Erreur technique lors du chargement du bien.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      setSelectedFiles([]);
      return;
    }
    setSelectedFiles(Array.from(files));
  };

  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) {
      addNotification({ type: 'alerte', titre: 'Sélectionnez au moins une image.', message: '' });
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('fichiers', file);
      });

      const response = await PatrimoineService.addBienPhotos(id, formData);
      if (!response.success) {
        addNotification({ type: 'alerte', titre: response.message || "Échec de l'upload des images.", message: '' });
        return;
      }

      setSelectedFiles([]);
      addNotification({ type: 'info', titre: 'Photos ajoutées avec succès.', message: '' });
      await loadPhotos();
    } catch (err) {
      console.error('Erreur upload photos:', err);
      addNotification({ type: 'alerte', titre: "Erreur technique pendant l'upload.", message: '' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: PhotoBien) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      setDeletingPhotoId(photo.id);
      const response = await PatrimoineService.deleteBienPhoto(id, photo.id);
      if (!response.success) {
        addNotification({ type: 'alerte', titre: response.message || 'Suppression de la photo impossible.', message: '' });
        return;
      }
      addNotification({ type: 'info', titre: 'Photo supprimée.', message: '' });
      await loadPhotos();
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Erreur technique lors de la suppression.', message: '' });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const movePhoto = async (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...photoObjects];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
    [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
    setPhotoObjects(newPhotos);

    try {
      setIsReordering(true);
      const response = await PatrimoineService.reorderBienPhotos(id, newPhotos.map((p) => p.id));
      if (!response.success) {
        addNotification({ type: 'alerte', titre: 'Erreur lors du réordonnancement.', message: '' });
        await loadPhotos();
      }
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Erreur technique lors du réordonnancement.', message: '' });
      await loadPhotos();
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" aria-hidden="true" />
          <p className="mt-4 text-sm text-zinc-500">Chargement du detail du bien...</p>
        </div>
      </section>
    );
  }

  if (error || !property || !status) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error || 'Bien introuvable.'}</p>
        <div className="mt-3">
          {preferHistoryBack ? (
            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
            >
              {backLabel}
            </button>
          ) : (
            <Link
              href={backHref}
              className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {preferHistoryBack ? (
        <button
          type="button"
          onClick={handleBackNavigation}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </button>
      ) : (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{property.title}</h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-zinc-600 sm:text-base">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {property.address}
          </p>
        </div>
        <span className={`inline-flex h-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}>
          {status.label}
        </span>
      </div>

      {property.photos.length > 0 && (
        <PropertyGallery title={property.title} images={property.photos} />
      )}

      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Photos du bien ({photoObjects.length})</h2>

        {photoObjects.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {photoObjects.map((photo, index) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                <img
                  src={normalizeMediaUrl(photo.fichier)}
                  alt={`Photo ${index + 1}`}
                  className="h-28 w-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/window.svg'; }}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/50 px-2 py-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 'up')}
                      disabled={index === 0 || isReordering}
                      className="inline-flex rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-40"
                      title="Monter"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 'down')}
                      disabled={index === photoObjects.length - 1 || isReordering}
                      className="inline-flex rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-40"
                      title="Descendre"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo)}
                    disabled={deletingPhotoId === photo.id}
                    className="inline-flex rounded p-0.5 text-red-300 hover:bg-white/20 disabled:opacity-40"
                    title="Supprimer"
                  >
                    {deletingPhotoId === photo.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">Principale</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-600">Ajouter des photos</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
          />
          {selectedFiles.length > 0 && (
            <p className="text-xs text-zinc-500">{selectedFiles.length} fichier(s) sélectionné(s)</p>
          )}
          <button
            type="button"
            onClick={handleUploadPhotos}
            disabled={isUploading || selectedFiles.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isUploading ? 'Upload en cours...' : 'Uploader les photos'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Description</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">{property.description}</p>

          <h3 className="mt-6 text-base font-semibold text-zinc-900">Caracteristiques</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <Ruler className="h-4 w-4" aria-hidden="true" />
              Surface: {property.surface} m2
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <DoorOpen className="h-4 w-4" aria-hidden="true" />
              Pieces: {property.rooms}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <BedDouble className="h-4 w-4" aria-hidden="true" />
              Chambres: {property.bedrooms}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Espace proprietaire
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-semibold text-zinc-900">Localisation</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {relatedCount > 0
                ? `${relatedCount} autre(s) bien(s) du meme immeuble affiche(s) sur la carte.`
                : 'Aucun autre bien du meme immeuble a afficher pour le moment.'}
            </p>

            <div className="mt-3">
              {locationPoints.length > 0 ? (
                <PropertyLocationMap points={locationPoints} />
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  Les coordonnees de ce bien ne sont pas encore renseignees. Reviens dans le formulaire de creation/modification pour ajouter latitude et longitude.
                </div>
              )}
            </div>

            {property.mapsLink ? (
              <a
                href={property.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Ouvrir le lien Google Maps
              </a>
            ) : null}
          </div>
        </article>

        <aside className="h-fit rounded-2xl border border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-200/50">
          <div className="mb-6">
            <span className="text-3xl font-bold text-zinc-900">{currencyFormatter.format(property.rentAmount)}</span>
            <span className="text-zinc-500"> / mois</span>
            <div className="mt-1 text-sm text-zinc-500">
              + {currencyFormatter.format(property.chargesAmount)} charges
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm font-medium text-zinc-800">
              {showOwnerActions ? 'Actions propriétaire' : 'Actions administrateur'}
            </p>
            {onEditClick && (
              <button
                type="button"
                onClick={() => onEditClick(id)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Modifier ce bien
              </button>
            )}
            {preferHistoryBack ? (
              <button
                type="button"
                onClick={handleBackNavigation}
                className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Retour a la page precedente
              </button>
            ) : (
              <Link
                href={backHref}
                className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Retour a la liste
              </Link>
            )}
            {showOwnerActions && secondaryActionHref ? (
              <Link
                href={secondaryActionHref}
                className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                {secondaryActionLabel}
              </Link>
            ) : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
