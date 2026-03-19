
"use client";

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BedDouble, Building2, CalendarDays, CircleDollarSign, DoorOpen, Key, MapPin, Ruler, Video } from 'lucide-react';
import PropertyGallery from '@/components/PropertyGallery';
import { mockProperties, Property } from '@/data/properties';
import { useState } from 'react';
import ContactOwnerModal from '@/components/ContactOwnerModal';
import { useRouter } from 'next/navigation';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';

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

export default function PropertyDetailClient({ id, role }: PropertyDetailPageProps) {
  const [showContactOwnerModal, setShowContactOwnerModal] = useState(false);
  const property = mockProperties.find((item) => item.id === id);
  const router = useRouter();
  const { generateTemporaryAccess } = useVirtualVisits();

  if (!property) {
    notFound();
  }

  const status = statusStyles[property.status];
  const viewerRole = normalizeRole(role);

  const handleRentClick = () => {
    setShowContactOwnerModal(true);
  };

  const handlePhysicalVisitClick = () => {
    setShowContactOwnerModal(true);
  };

  const handleVirtualVisitClick = () => {
    const access = generateTemporaryAccess(property.id, 'visiteur');
    router.push(`/visit/${encodeURIComponent(access.id)}?code=${encodeURIComponent(access.code)}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
        <ContactOwnerModal
          isOpen={showContactOwnerModal}
          onClose={() => setShowContactOwnerModal(false)}
          ownerName={property.owner.name}
          ownerPhone={property.owner.phone}
          propertyTitle={property.title}
        />
        
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

          <aside className="h-fit rounded-2xl border border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-200/50">
            {/* Price Header */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-zinc-900">{currencyFormatter.format(property.financial.rentAmount)}</span>
              <span className="text-zinc-500"> / mois</span>
              <div className="mt-1 text-sm text-zinc-500">
                + {currencyFormatter.format(property.financial.chargesAmount)} charges
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleVirtualVisitClick}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 p-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-50 group"
                  >
                      <Video className="h-5 w-5 text-zinc-400 group-hover:text-zinc-900" />
                      Visite Virtuelle
                  </button>
                  <button 
                    onClick={handlePhysicalVisitClick}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 p-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-50 group"
                  >
                      <CalendarDays className="h-5 w-5 text-zinc-400 group-hover:text-zinc-900" />
                      Visite Physique
                  </button>
              </div>

              <button 
                onClick={handleRentClick}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-zinc-900/20 transition hover:bg-zinc-800 hover:shadow-lg hover:scale-[1.02]"
              >
                  <Key className="h-4 w-4" />
                  Louer maintenant
              </button>
              
              <div className="text-center">
                 <a href={`mailto:contact@immodesk.tg?subject=Question%20-%20${encodeURIComponent(property.title)}`} className="text-xs text-zinc-400 underline hover:text-zinc-600">
                    Poser une question à l&apos;agence
                 </a>
              </div>
            </div>

            {/* Role specific actions */}
            {viewerRole === 'tenant' && (
              <div className="mt-6 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
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
