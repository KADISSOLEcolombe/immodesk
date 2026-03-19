"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Expand, Home } from 'lucide-react';
import { Property } from '@/data/properties';

interface PropertyCardProps {
  property: Property;
}

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

export default function PropertyCard({ property }: PropertyCardProps) {
  const [mainImageFailed, setMainImageFailed] = useState(false);
  const mainImage = useMemo(() => {
    if (mainImageFailed) {
      return '/window.svg';
    }

    return property.images[0] || '/window.svg';
  }, [mainImageFailed, property.images]);
  const status = statusStyles[property.status];

  return (
    <article className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl relative">
      <Link href={`/properties/${property.id}`} className="absolute inset-0 z-10" aria-label={`Voir détails de ${property.title}`} />
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={mainImage}
          alt={property.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setMainImageFailed(true)}
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-zinc-900">{property.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{property.address.city}</p>
          </div>
          <p className="shrink-0 text-base font-bold text-zinc-900 sm:text-lg">
            {currencyFormatter.format(property.financial.rentAmount)}
            <span className="ml-1 text-xs font-medium text-zinc-500">/mois</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <div className="inline-flex items-center gap-2">
            <Expand className="h-4 w-4" aria-hidden="true" />
            <span>{property.features.surface} m²</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>{property.features.rooms} pièces</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <BedDouble className="h-4 w-4" aria-hidden="true" />
            <span>{property.features.bedrooms} ch.</span>
          </div>
        </div>

        <div className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:w-auto relative z-20 pointer-events-none">
          Voir détails
        </div>
      </div>
    </article>
  );
}
