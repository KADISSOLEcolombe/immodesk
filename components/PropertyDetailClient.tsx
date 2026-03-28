
"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  CreditCard,
  DoorOpen,
  ExternalLink,
  Key,
  Mail,
  MapPin,
  Ruler,
  UserRound,
  Video,
} from 'lucide-react';
import PropertyGallery from '@/components/PropertyGallery';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';
import {
  PublicBienDetail,
  PublicBienOwnerContact,
  PublicService,
} from '@/lib/public-service';
import type { MapPropertyPoint } from '@/components/owner/PropertyLocationMap';

const PropertyLocationMap = dynamic(() => import('@/components/owner/PropertyLocationMap'), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-xl bg-zinc-100" />,
});

const statusStyles: Record<'vacant' | 'rented' | 'maintenance', { label: string; className: string }> = {
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
};

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

type UiProperty = {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  category: string;
  buildingName: string;
  status: 'vacant' | 'rented' | 'maintenance';
  surface: number;
  rooms: number;
  bedrooms: number;
  rentAmount: number;
  chargesAmount: number;
  latitude: number | null;
  longitude: number | null;
  mapsLink: string;
  amenities: string[];
  exteriorSpaces: string[];
  accessibility: string[];
  photos: string[];
  typeLogement: string;
  standing: string;
  hasVirtualTour: boolean;
};

interface PropertyDetailPageProps {
  id: string;
  role?: string;
}

type ViewerRole = 'public' | 'tenant' | 'owner';

const roleLabel: Record<ViewerRole, string> = {
  public: 'Public',
  tenant: 'Locataire',
  owner: 'Propriétaire',
};

function normalizeRole(role?: string): ViewerRole {
  if (role === 'tenant' || role === 'locataire') {
    return 'tenant';
  }

  if (role === 'owner' || role === 'proprietaire') {
    return 'owner';
  }

  return 'public';
}

const toSafeNumber = (value: unknown): number => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const parseCityFromAddress = (address?: string | null): string => {
  if (typeof address !== 'string' || address.trim().length === 0) {
    return 'Non specifiee';
  }

  const chunks = address
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.length > 0 ? chunks[chunks.length - 1] : 'Non specifiee';
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
};

function toUiProperty(detail: PublicBienDetail): UiProperty {
  const title = detail.categorie_nom?.trim() || 'Bien immobilier';
  const address = detail.adresse?.trim() || 'Adresse non specifiee';
  const photos = Array.isArray(detail.photos)
    ? detail.photos
        .map((photo) => photo?.fichier)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];

  return {
    id: detail.id,
    title,
    description: detail.description?.trim() || 'Aucune description disponible pour ce bien.',
    address,
    city: parseCityFromAddress(address),
    category: detail.categorie_nom || 'Categorie non precisee',
    buildingName: detail.immeuble_nom || 'Non specifie',
    status: 'vacant',
    surface: toSafeNumber(detail.surface_m2),
    rooms: toSafeNumber(detail.nb_pieces),
    bedrooms: 0,
    rentAmount: toSafeNumber(detail.loyer_hc),
    chargesAmount: toSafeNumber(detail.charges),
    latitude: typeof detail.latitude === 'number' ? detail.latitude : null,
    longitude: typeof detail.longitude === 'number' ? detail.longitude : null,
    mapsLink: detail.lien_maps || '',
    amenities: toStringArray(detail.equipements),
    exteriorSpaces: toStringArray(detail.espaces_exterieurs),
    accessibility: toStringArray(detail.accessibilite),
    photos,
    typeLogement: detail.type_logement || 'Non precise',
    standing: detail.standing || 'Standard',
    hasVirtualTour: !!detail.has_virtual_tour,
  };
}

export default function PropertyDetailClient({ id, role }: PropertyDetailPageProps) {
  const [property, setProperty] = useState<UiProperty | null>(null);
  const [ownerContact, setOwnerContact] = useState<PublicBienOwnerContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const router = useRouter();
  const { generateTemporaryAccess, tours } = useVirtualVisits();
  const viewerRole = normalizeRole(role);

  const hasTour = useMemo(() => {
    return property ? (property.hasVirtualTour || tours.some(t => t.propertyId === property.id)) : false;
  }, [property, tours]);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setIsNotFound(false);

        const detailResponse = await PublicService.getPropertyDetails(id);
        if (!detailResponse.success || !detailResponse.data) {
          if (detailResponse.code === 'RESOURCE_NOT_FOUND') {
            setIsNotFound(true);
            return;
          }

          setError(detailResponse.message || 'Impossible de charger ce bien.');
          return;
        }

        setProperty(toUiProperty(detailResponse.data));

        const ownerResponse = await PublicService.getPropertyOwnerContact(id);
        if (ownerResponse.success && ownerResponse.data) {
          setOwnerContact(ownerResponse.data);
        } else {
          setOwnerContact(null);
        }
      } catch (loadError) {
        console.error('Erreur detail bien public:', loadError);
        setError('Erreur technique lors du chargement du bien.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  const status = useMemo(() => (property ? statusStyles[property.status] : null), [property]);

  const locationPoints = useMemo<MapPropertyPoint[]>(() => {
    if (!property || property.latitude === null || property.longitude === null) {
      return [];
    }

    return [
      {
        id: property.id,
        label: property.title,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        isCurrent: true,
      },
    ];
  }, [property]);

  if (isNotFound) {
    notFound();
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Chargement du detail du bien...</p>
        </div>
      </section>
    );
  }

  if (error || !property || !status) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error || 'Bien introuvable.'}</p>
        <div className="mt-3">
          <Link
            href="/properties"
            className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
          >
            Retour aux biens
          </Link>
        </div>
      </section>
    );
  }

  const ownerName = ownerContact?.contact?.nom || 'Proprietaire non renseigne';
  const ownerEmail = ownerContact?.contact?.email || 'Non disponible';
  const ownerMailHref = ownerContact?.contact?.email
    ? `mailto:${ownerContact.contact.email}?subject=${encodeURIComponent(`Demande d'information - ${property.title}`)}`
    : '';

  const handlePhysicalVisitClick = () => {
    if (ownerMailHref) {
      window.location.href = ownerMailHref;
      return;
    }

    window.location.href = `mailto:contact@immodesk.tg?subject=${encodeURIComponent(`Demande de visite - ${property.title}`)}`;
  };

  const handleVirtualVisitClick = () => {
    const access = generateTemporaryAccess(property.id, 'visiteur');
    router.push(`/visit/${encodeURIComponent(access.id)}?code=${encodeURIComponent(access.code)}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (typeof document !== 'undefined' && document.referrer.includes(window.location.host) && !document.referrer.includes('/properties/')) {
                router.back();
              } else {
                router.push('/properties');
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </button>
          
          {typeof document !== 'undefined' && document.referrer.endsWith('/') && (
             <Link
               href="/"
               className="text-[10px] font-bold tracking-widest uppercase text-amber-600 hover:text-amber-700"
             >
               Retour à l'accueil
             </Link>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl transition-colors duration-500">{property.title}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground sm:text-base">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {property.address}
            </p>
          </div>
          <span
            className={`inline-flex h-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <PropertyGallery title={property.title} images={property.photos} />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 transition-colors duration-500">
            <h2 className="text-lg font-semibold text-foreground">Description</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{property.description}</p>

            <h3 className="mt-6 text-base font-semibold text-zinc-900">Caracteristiques detaillees</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
                <Ruler className="h-4 w-4" aria-hidden="true" />
                Surface: {property.surface} m2
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
                <DoorOpen className="h-4 w-4" aria-hidden="true" />
                Pieces: {property.rooms}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
                <BedDouble className="h-4 w-4" aria-hidden="true" />
                Chambres: {property.bedrooms}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Ville: {property.city}
              </div>
            </div>

            <h3 className="mt-6 text-base font-semibold text-foreground">Localisation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {property.buildingName !== 'Non specifie'
                ? `Immeuble: ${property.buildingName}`
                : 'Ce bien ne reference pas encore un immeuble dans la base.'}
            </p>

            <div className="mt-3">
              {locationPoints.length > 0 ? (
                <PropertyLocationMap points={locationPoints} />
              ) : (
                <div className="rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
                  Les coordonnees de ce bien ne sont pas disponibles pour le moment.
                </div>
              )}
            </div>

            {property.mapsLink ? (
              <a
                href={property.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Ouvrir le lien de localisation
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}

            <h3 className="mt-6 text-base font-semibold text-foreground">Informations proprietaire</h3>
            <div className="mt-3 rounded-xl border border-border bg-secondary p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200">
                  <UserRound className="h-5 w-5 text-zinc-700" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{ownerName}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {ownerEmail}
                  </p>
                </div>
              </div>
            </div>

            {(property.amenities.length > 0 || property.exteriorSpaces.length > 0 || property.accessibility.length > 0) && (
              <>
                <h3 className="mt-6 text-base font-semibold text-zinc-900">Atouts du bien</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.amenities.map((item) => (
                    <span key={`amenity-${item}`} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                      {item}
                    </span>
                  ))}
                  {property.exteriorSpaces.map((item) => (
                    <span key={`exterior-${item}`} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {item}
                    </span>
                  ))}
                  {property.accessibility.map((item) => (
                    <span key={`access-${item}`} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}
          </article>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5 transition-colors duration-500">
            {/* Price Header */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-foreground">{currencyFormatter.format(property.rentAmount)}</span>
              <span className="text-muted-foreground"> / mois</span>
              <div className="mt-1 text-sm text-muted-foreground">
                + {currencyFormatter.format(property.chargesAmount)} charges
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                  {hasTour && (
                    <button 
                      onClick={handleVirtualVisitClick}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-secondary group"
                    >
                        <Video className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        Visite Virtuelle
                    </button>
                  )}
                  <button 
                    onClick={handlePhysicalVisitClick}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-secondary group ${!hasTour ? 'col-span-2' : ''}`}
                  >
                      <CalendarDays className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      Contact visite
                  </button>
              </div>

              {ownerMailHref ? (
                <a
                  href={ownerMailHref}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-90 hover:shadow-lg hover:scale-[1.02]"
                >
                  <Key className="h-4 w-4" />
                  Contacter le proprietaire
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handlePhysicalVisitClick}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-zinc-900/20 transition hover:bg-zinc-800 hover:shadow-lg hover:scale-[1.02]"
                >
                  <Key className="h-4 w-4" />
                  Demander plus d'informations
                </button>
              )}
              
              <div className="text-center">
                 <a href={`mailto:contact@immodesk.tg?subject=Question%20-%20${encodeURIComponent(property.title)}`} className="text-xs text-zinc-400 underline hover:text-zinc-600">
                    Poser une question a l&apos;agence
                 </a>
              </div>
            </div>

            {/* Role specific actions */}
            {viewerRole === 'tenant' && (
              <div className="mt-6 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-800">Espace locataire</p>
                <Link
                  href={`/tenant/payment?propertyId=${encodeURIComponent(property.id)}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Payer mon loyer
                </Link>
                <a
                  href={`mailto:support@immodesk.tg?subject=Demande%20d'assistance%20-%20${encodeURIComponent(property.title)}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Signaler un problème
                </a>
                <a
                  href={`mailto:finance@immodesk.tg?subject=Question%20paiement%20-%20${encodeURIComponent(property.title)}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Contacter la gestion locative
                </a>
              </div>
            )}

            {viewerRole === 'owner' && (
              <div className="mt-6 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-800">Espace propriétaire</p>
                <a
                  href={`mailto:owners@immodesk.tg?subject=Gestion%20du%20bien%20-%20${encodeURIComponent(property.title)}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Mettre à jour le bien
                </a>
                <a
                  href={`mailto:owners@immodesk.tg?subject=Rapport%20mensuel%20-%20${encodeURIComponent(property.title)}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Voir le rapport de gestion
                </a>
              </div>
            )}
          </aside>
        </section>
    </div>
  );
}
