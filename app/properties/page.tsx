"use client";

import { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/data/properties';
import { PublicBienPreview, PublicService } from '@/lib/public-service';
import { useFilters } from '@/context/FilterContext';

const parseCityFromAddress = (address?: string | null): string => {
  if (typeof address !== 'string' || address.trim().length === 0) {
    return 'Non spécifiée';
  }
  const chunks = address
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  return chunks.length > 0 ? chunks[chunks.length - 1] : 'Non spécifiée';
};

const toSafeNumber = (value: unknown): number => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const mapPublicBienToProperty = (bien: PublicBienPreview): Property => {
  const title =
    typeof bien.titre === 'string' && bien.titre.trim().length > 0
      ? bien.titre
      : typeof bien.categorie_nom === 'string' && bien.categorie_nom.trim().length > 0
        ? bien.categorie_nom
        : 'Bien sans titre';
  const typeLogement =
    typeof bien.type_logement === 'string' && bien.type_logement.trim().length > 0
      ? bien.type_logement
      : 'Type non précisé';
  const fullAddress =
    typeof bien.adresse === 'string' && bien.adresse.trim().length > 0
      ? bien.adresse
      : 'Adresse non spécifiée';
  const imagesFromPhotos = Array.isArray(bien.photos)
    ? bien.photos
        .map((photo) => photo?.fichier)
        .filter((path): path is string => typeof path === 'string' && path.trim().length > 0)
    : [];

  return {
    id: bien.id,
    title,
    description: bien.description || `${typeLogement} - ${title}`,
    owner: {
      name: 'Propriétaire',
      phone: 'Non disponible',
    },
    address: {
      street: fullAddress,
      city: parseCityFromAddress(fullAddress),
      postalCode: 'Non spécifié',
    },
    financial: {
      rentAmount: toSafeNumber(bien.loyer_hc ?? bien.loyer_mensuel),
      chargesAmount: toSafeNumber(bien.charges),
    },
    features: {
      surface: toSafeNumber(bien.surface_m2 ?? bien.surface),
      rooms: toSafeNumber(bien.nb_pieces ?? bien.nombre_pieces),
      bedrooms: toSafeNumber(bien.nombre_chambres),
    },
    images: imagesFromPhotos,
    status: 'vacant',
    has_virtual_tour: bien.has_virtual_tour,
  };
};

export default function PropertiesPage() {
  const { filters } = useFilters();
  const [properties, setProperties] = useState<PublicBienPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const allProperties: PublicBienPreview[] = [];
        let page = 1;
        let shouldContinue = true;

        while (shouldContinue) {
          const response = await PublicService.getAvailableProperties(undefined, page);

          if (!response.success || !response.data) {
            setError(response.message || 'Erreur lors du chargement des biens publics');
            setProperties([]);
            return;
          }

          allProperties.push(...response.data);

          const hasNextPage = response.pagination?.has_next === true;
          if (!hasNextPage) {
            shouldContinue = false;
          } else {
            page += 1;
          }
        }

        setProperties(allProperties);
      } catch (loadError) {
        console.error('Erreur lors du chargement des biens publics:', loadError);
        setError('Erreur technique lors du chargement des biens publics');
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, []);

  const convertedProperties = useMemo(() => {
    return properties.map((bien) => mapPublicBienToProperty(bien));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const parsedMin = filters.minPrice ? Number(filters.minPrice) : null;
    const parsedMax = filters.maxPrice ? Number(filters.maxPrice) : null;

    return convertedProperties.filter((property) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        property.title.toLowerCase().includes(normalizedSearch) ||
        property.address.city.toLowerCase().includes(normalizedSearch) ||
        property.address.street.toLowerCase().includes(normalizedSearch);

      const matchesPrice = (parsedMin === null || property.financial.rentAmount >= parsedMin) &&
                          (parsedMax === null || property.financial.rentAmount <= parsedMax);

      const matchesType = filters.type === 'all' || 
                         property.title.toLowerCase().includes(filters.type.toLowerCase()) || 
                         property.description.toLowerCase().includes(filters.type.toLowerCase());
      
      const matchesRooms =
        filters.rooms === 'all'
          ? true
          : filters.rooms === '4+'
            ? property.features.rooms >= 4
            : property.features.rooms === Number(filters.rooms);

      const matchesStanding = filters.standing === 'all' || 
                             property.description.toLowerCase().includes(filters.standing.toLowerCase());

      return matchesSearch && matchesPrice && matchesType && matchesRooms && matchesStanding;
    });
  }, [filters, convertedProperties]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Recherche des meilleurs biens pour vous...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-20 px-4">
        <div className="rounded-3xl border border-red-100 bg-red-50/50 p-8 text-center backdrop-blur-sm dark:bg-red-950/20 dark:border-red-900/50">
          <p className="text-red-800 dark:text-red-400 font-medium mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
          >
            Réessayer le chargement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-premium-in">
      <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl transition-colors duration-500">
          Découvrez nos exclusivités
        </h1>
        <p className="mt-2 text-muted-foreground transition-colors duration-500">
          Explorez une sélection curatée de biens immobiliers d'exception.
        </p>
      </header>

      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <X className="h-10 w-10 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground transition-colors duration-500">Aucun résultat trouvé</h2>
          <p className="mt-2 text-muted-foreground transition-colors duration-500">
            Essayez de modifier vos filtres pour trouver ce que vous cherchez.
          </p>
        </div>
      )}
    </div>
  );
}
