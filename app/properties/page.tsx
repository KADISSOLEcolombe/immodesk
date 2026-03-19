"use client";

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X, ArrowLeft } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties, Property } from '@/data/properties';
import Link from 'next/link';

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Property['status'][]>([]);
  const [roomsFilter, setRoomsFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProperties = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const parsedMin = minPrice ? Number(minPrice) : null;
    const parsedMax = maxPrice ? Number(maxPrice) : null;

    return mockProperties.filter((property) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        property.title.toLowerCase().includes(normalizedSearch) ||
        property.address.city.toLowerCase().includes(normalizedSearch);

      const matchesMinPrice = parsedMin === null || property.financial.rentAmount >= parsedMin;
      const matchesMaxPrice = parsedMax === null || property.financial.rentAmount <= parsedMax;

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(property.status);

      const matchesRooms =
        roomsFilter === 'all'
          ? true
          : roomsFilter === '5+'
            ? property.features.rooms >= 5
            : property.features.rooms === Number(roomsFilter);

      return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesStatus && matchesRooms;
    });
  }, [search, minPrice, maxPrice, selectedStatuses, roomsFilter]);

  const toggleStatus = (status: Property['status']) => {
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((value) => value !== status) : [...current, status],
    );
  };

  const resetFilters = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedStatuses([]);
    setRoomsFilter('all');
  };

  const activeFilterCount = [
    search.trim() !== '',
    minPrice !== '',
    maxPrice !== '',
    selectedStatuses.length > 0,
    roomsFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* En-tête */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Biens immobiliers</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {filteredProperties.length} résultat{filteredProperties.length > 1 ? 's' : ''}
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
                  {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 mr-16">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Réinitialiser
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${
              showFilters
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtres
            {showFilters ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      </div>

      {/* Panneau de filtres (collapsible) */}
      {showFilters && (
        <section className="mb-8 rounded-3xl border border-zinc-100 bg-white p-6 shadow-xl shadow-zinc-200/50 transition-all duration-300 sm:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Recherche */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-900">Recherche</label>
              <div className="relative group">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ville, quartier, type..."
                  className="w-full h-12 rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10 placeholder:text-zinc-400"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Prix */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-900">Budget (FCFA)</label>
              <div className="flex items-center gap-3">
                <div className="relative w-full">
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Min"
                    className="w-full h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10 placeholder:text-zinc-400"
                  />
                </div>
                <div className="h-px w-4 bg-zinc-300"></div>
                <div className="relative w-full">
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Max"
                    className="w-full h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10 placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-900">Disponibilité</label>
              <div className="flex flex-wrap gap-2">
                {(['vacant', 'rented', 'maintenance'] as Property['status'][]).map((s) => {
                  const isSelected = selectedStatuses.includes(s);
                  const labels = { vacant: 'Disponible', rented: 'Loué', maintenance: 'Maintenance' };
                  return (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className={`inline-flex h-9 items-center rounded-xl border px-3 text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-md shadow-zinc-900/20'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {labels[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pièces */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-900">Pièces</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', '1', '2', '3', '4', '5+'].map((v) => {
                  const isSelected = roomsFilter === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setRoomsFilter(v)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full border text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-md shadow-zinc-900/20'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {v === 'all' ? 'Tout' : v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grille des biens */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </section>
    </div>
  );
}
