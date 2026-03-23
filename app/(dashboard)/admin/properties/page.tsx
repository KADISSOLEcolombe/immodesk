"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { normalizeMediaUrl } from '@/lib/utils';
import { Bien } from '@/types/api';

type AdminProperty = {
  id: string;
  title: string;
  address: string;
  status: string;
  image: string;
};

const statusLabel: Record<string, string> = {
  vacant: 'Vacant',
  loue: 'Loue',
  maintenance: 'Maintenance',
  reservation: 'Reservation',
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
  };
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        console.error('Erreur chargement biens admin:', err);
        setError('Erreur serveur lors du chargement des biens.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, []);

  const totalLabel = useMemo(() => `${properties.length} bien(s)`, [properties.length]);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 text-zinc-900">
        <Building2 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Tous les biens</h1>
      </div>

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
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-semibold text-zinc-900">{property.title}</p>
                  <p className="truncate text-xs text-zinc-600">{property.address}</p>
                  <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                    {statusLabel[property.status] || property.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
