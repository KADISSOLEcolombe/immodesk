"use client";

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties, Property } from '@/data/properties';

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex items-center gap-2">
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

      {/* Panneau de filtres (collapsible) */}
      {showFilters && (
        <section className="mb-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Recherche (ville, titre)
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex: Lomé ou Villa"
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Prix min
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="0"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Prix max
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="2000"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                />
              </label>
            </div>

            <fieldset className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              <legend className="mb-1">Statut</legend>
              {(['vacant', 'rented', 'maintenance'] as Property['status'][]).map((s) => (
                <label key={s} className="inline-flex items-center gap-2 text-sm font-normal text-zinc-600">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(s)}
                    onChange={() => toggleStatus(s)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  {s === 'vacant' ? 'Disponible' : s === 'rented' ? 'Loué' : 'Maintenance'}
                </label>
              ))}
            </fieldset>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Nombre de pièces
              <select
                value={roomsFilter}
                onChange={(event) => setRoomsFilter(event.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              >
                <option value="all">Toutes</option>
                {['1', '2', '3', '4', '5+'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
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
