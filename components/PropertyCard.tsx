"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Expand, Home, MapPin, Sparkles } from 'lucide-react';
import { Property } from '@/data/properties';
import { normalizeMediaUrl } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
}

const statusStyles: Record<Property['status'], { label: string; className: string }> = {
  vacant: {
    label: 'Disponible',
    className: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  },
  rented: {
    label: 'Loué',
    className: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
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
    if (mainImageFailed || !property.images || property.images.length === 0) {
      return '/window.svg';
    }
    return normalizeMediaUrl(property.images[0]);
  }, [mainImageFailed, property.images]);

  const status = statusStyles[property.status] || statusStyles.vacant;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5">
      <Link href={`/properties/${property.id}`} className="absolute inset-0 z-10" aria-label={`Voir détails de ${property.title}`} />
      
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden p-3 pb-0">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-muted/30">
          <Image
            src={mainImage}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setMainImageFailed(true)}
            unoptimized={true}
          />
          
          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Top Badges */}
          <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 backdrop-blur-md transition-all duration-300 group-hover:px-4 ${status.className}`}>
              {status.label}
            </span>

            {property.has_virtual_tour && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground ring-1 ring-white/10 backdrop-blur-md shadow-lg">
                <Sparkles className="h-3 w-3 text-amber-400" />
                V-TOUR 360
              </span>
            )}
          </div>

          {/* Bottom Info on Hover */}
          <div className="absolute inset-x-4 bottom-4 z-20 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
             <div className="flex items-center justify-between border-t border-white/20 pt-3">
                <p className="text-xs font-semibold text-white/90">Détails exclusifs</p>
                <div className="flex items-center gap-1">
                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-[10px] font-bold uppercase text-white/80">Vérifié</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-6 pt-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-xl font-bold text-foreground transition-all duration-300 group-hover:text-primary">
              {property.title}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary/60" />
              <p className="truncate text-sm font-medium">{property.address.city}, {property.address.street}</p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border/50 pt-5">
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            <Expand className="h-4 w-4 text-muted-foreground/80" />
            <span className="text-xs font-bold text-foreground">{property.features.surface} m²</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 border-x border-border/50 px-2 text-center">
            <Home className="h-4 w-4 text-muted-foreground/80" />
            <span className="text-xs font-bold text-foreground">{property.features.rooms} p.</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            <BedDouble className="h-4 w-4 text-muted-foreground/80" />
            <span className="text-xs font-bold text-foreground">{property.features.bedrooms} ch.</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Loyer Mensuel</span>
            <p className="text-2xl font-black text-foreground">
              {currencyFormatter.format(property.financial.rentAmount)}
              <span className="text-xs font-medium text-muted-foreground ml-1">hc.</span>
            </p>
          </div>
          <div className="group/btn relative">
            <div className="absolute -inset-1 blur-sm bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 group-hover:scale-110 active:scale-95">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
