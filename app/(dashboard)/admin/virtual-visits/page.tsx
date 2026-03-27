"use client";

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Video, ExternalLink } from 'lucide-react';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { normalizeMediaUrl } from '@/lib/utils';
import { Bien } from '@/types/api';

type AdminProperty = {
  id: string;
  title: string;
  address: string;
  status: string;
  image: string;
  raw: Bien;
};

const statusLabel: Record<string, string> = {
  vacant: 'Vacant',
  loue: 'Loué',
  en_travaux: 'En travaux',
  maintenance: 'Maintenance',
  reservation: 'Réservation',
};

const statusBadgeClass: Record<string, string> = {
  vacant: 'bg-green-100 text-green-700',
  loue: 'bg-blue-100 text-blue-700',
  en_travaux: 'bg-orange-100 text-orange-700',
  maintenance: 'bg-orange-100 text-orange-700',
  reservation: 'bg-purple-100 text-purple-700',
};

function extractImage(property: Bien): string {
  const rawProperty = property as unknown as Record<string, unknown>;

  const normalizeCandidate = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
    return normalizeMediaUrl(trimmed.replaceAll('\\', '/'));
  };

  const mainPhoto = normalizeCandidate(rawProperty.photo_principale);
  if (mainPhoto) return mainPhoto;

  if (Array.isArray(property.photos) && property.photos.length > 0) {
    const firstPhoto = normalizeCandidate(property.photos[0]?.fichier);
    if (firstPhoto) return firstPhoto;
  }

  if (Array.isArray(property.images) && property.images.length > 0) {
    const firstLegacyImage = normalizeCandidate(property.images[0]);
    if (firstLegacyImage) return firstLegacyImage;
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

function AdminVirtualVisitsPageInner() {
  const { tours } = useVirtualVisits();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await PatrimoineService.getBiens();

      if (!response.success || !response.data) {
        setError(response.message || 'Impossible de charger les biens.');
        return;
      }

      setProperties(response.data.map(mapProperty));
    } catch (err) {
      console.error('Erreur chargement biens admin visite:', err);
      setError('Erreur serveur lors du chargement des biens.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const scheduledVirtualVisitPropertyIds = useMemo(
    () => new Set(tours.map((tour) => tour.propertyId)),
    [tours],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <Video className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Gestion des visites virtuelles</h1>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-sm text-zinc-600">Sélectionnez un bien pour gérer sa visite virtuelle intégrée.</p>

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
            {properties.map((property) => {
              const hasTour = scheduledVirtualVisitPropertyIds.has(property.id);
              return (
                <div
                  key={property.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 transition hover:border-zinc-200 hover:bg-white"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-zinc-100">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = '/window.svg';
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between space-y-3 p-3 text-sm">
                    <div>
                      <p className="truncate font-semibold text-zinc-900">{property.title}</p>
                      <p className="truncate text-xs text-zinc-600 mb-2">{property.address}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass[property.status] || 'bg-zinc-100 text-zinc-700'}`}>
                          {statusLabel[property.status] || property.status}
                        </span>
                        {hasTour ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            ✓ Visite configurée
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                            Aucune visite
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <a
                      href={`/tour/pages/editor.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {hasTour ? 'Modifier la visite' : 'Créer une visite'}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}

export default function AdminVirtualVisitsPage() {
  return (
    <Suspense fallback={null}>
      <AdminVirtualVisitsPageInner />
    </Suspense>
  );
}
