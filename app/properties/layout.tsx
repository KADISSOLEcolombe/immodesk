"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, SlidersHorizontal } from 'lucide-react';
import { PropsWithChildren } from 'react';

const links = [{ href: '/properties', label: 'Catalogue des biens', exact: false }];

import { FilterProvider } from '@/context/FilterContext';
import PropertyFilters from '@/components/properties/PropertyFilters';

export default function PropertiesLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <FilterProvider>
      <div className="min-h-screen bg-background lg:flex transition-colors duration-500">
        <aside className="border-b border-border bg-card/95 px-4 py-4 backdrop-blur-sm lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-6 lg:py-8 transition-all duration-500 overflow-y-auto">
          <Link href="/" className="mb-8 flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">ImmoDesk</h2>
          </Link>

          <div className="hidden lg:block">
            <PropertyFilters />
          </div>

          {/* Mobile version could be a drawer but for now we keep it simple or hide it */}
          <div className="lg:hidden mb-4">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-all duration-300">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres et recherche
            </button>
          </div>
        </aside>

        <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 bg-background transition-colors duration-500 overflow-y-auto">{children}</main>
      </div>
    </FilterProvider>
  );
}
