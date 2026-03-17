import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BedDouble, Building2, CircleDollarSign, DoorOpen, MapPin, Ruler } from 'lucide-react';
import { mockProperties, Property } from '@/data/properties';


const statusStyles: Record<Property['status'], { label: string; className: string }> = {
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

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
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

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const { id } = await params;
  const { role } = await searchParams;
  const property = mockProperties.find((item) => item.id === id);

  if (!property) {
    notFound();
  }

  const status = statusStyles[property.status];
  const viewerRole = normalizeRole(role);

  return (
    <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/properties"
          className="mb-6 inline-flex items-center text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          ← Retour à la liste
        </Link>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{property.title}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-zinc-600 sm:text-base">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {property.address.street}, {property.address.postalCode} {property.address.city}
            </p>
          </div>
          <span
            className={`inline-flex h-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <PropertyGallery title={property.title} images={property.images} />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Description</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">{property.description}</p>

            <h3 className="mt-6 text-base font-semibold text-zinc-900">Caractéristiques détaillées</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <Ruler className="h-4 w-4" aria-hidden="true" />
                Surface: {property.features.surface} m²
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <DoorOpen className="h-4 w-4" aria-hidden="true" />
                Pièces: {property.features.rooms}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <BedDouble className="h-4 w-4" aria-hidden="true" />
                Chambres: {property.features.bedrooms}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Ville: {property.address.city}
              </div>
            </div>
          </article>

          <aside className="h-fit rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Informations financières</h2>
            <p className="mt-1 text-xs font-medium text-zinc-500">Vue: {roleLabel[viewerRole]}</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span className="inline-flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
                  Loyer
                </span>
                <strong className="text-zinc-900">{currencyFormatter.format(property.financial.rentAmount)}</strong>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span>Charges</span>
                <strong className="text-zinc-900">{currencyFormatter.format(property.financial.chargesAmount)}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-sm text-zinc-700">
                <span>Total mensuel</span>
                <strong className="text-base text-zinc-900">
                  {currencyFormatter.format(property.financial.rentAmount + property.financial.chargesAmount)}
                </strong>
              </div>
            </div>

            <a
              href={`mailto:contact@immodesk.tg?subject=Demande%20de%20contact%20-%20${encodeURIComponent(property.title)}`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Contacter l&apos;agence
            </a>

            {viewerRole === 'tenant' && (
              <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-800">Espace locataire</p>
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
              <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
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
