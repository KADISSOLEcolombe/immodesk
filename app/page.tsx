"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties, Property } from '@/data/properties';

const services = [
  {
    title: 'Au coeur de la ville',
    description: 'Idéalement situé entre business, loisirs et restaurants premium.',
  },
  {
    title: 'Luxe moderne',
    description: 'Architecture soignée, suites élégantes et confort absolu.',
  },
  {
    title: 'Accueil premium',
    description: 'Une équipe disponible 24/7 pour un séjour mémorable.',
  },
  {
    title: 'Meilleur tarif',
    description: 'Des offres compétitives et des avantages exclusifs en direct.',
  },
];

const suites = [
  {
    name: 'Suite Prestige',
    price: 'À partir de 250€ / nuit',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Suite Deluxe',
    price: 'À partir de 350€ / nuit',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Suite Royale',
    price: 'À partir de 550€ / nuit',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  },
];

function PropertiesPage() {
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

export default function HomePage() {
  return (
    <div className="bg-zinc-100 px-4 pb-16 pt-4 sm:px-6">
      <main className="mx-auto w-full max-w-6xl space-y-10">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white">
          <div
            className="relative min-h-[480px] bg-cover bg-center px-5 pb-10 pt-5 text-white sm:px-8"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, rgba(0,0,0,.28), rgba(0,0,0,.6)), url(https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=2000&q=80)',
            }}
          >
            <header className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-zinc-100/90">
              <p className="text-sm font-semibold tracking-[0.2em]">Larita</p>

              <nav className="hidden items-center gap-6 lg:flex">
                <span>Home</span>
                <span>Rooms & suites</span>
                <span>Explore</span>
                <span>Contact</span>
              </nav>

              <Link
                href="/properties"
                className="inline-flex h-9 items-center rounded-md border border-white/40 bg-white/10 px-4 text-[11px] font-semibold text-white transition hover:bg-white/20"
              >
                Reservation
              </Link>
            </header>

            <div className="mx-auto mt-24 max-w-2xl text-center sm:mt-28">
              <p className="text-xs uppercase tracking-[0.26em] text-zinc-200">Hotel & resort</p>
              <h1 className="mt-3 text-4xl font-medium tracking-wide sm:text-5xl">Larita Luxury Hotel</h1>
              <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-200 sm:text-base">
                Localisé au coeur de la ville, entre confort moderne, gastronomie et expériences exclusives.
              </p>
              <Link
                href="/visit"
                className="mt-7 inline-flex h-10 items-center rounded-md border border-white/70 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
              >
                Explorer
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 border-y border-zinc-200 py-7 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article key={service.title} className="px-3 text-center">
              <p className="text-sm font-semibold text-zinc-900">{service.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{service.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="h-72 rounded-xl bg-cover bg-center"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80)',
              }}
            />
            <div
              className="h-72 rounded-xl bg-cover bg-center"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80)',
              }}
            />
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Welcome to Larita</p>
            <h2 className="mt-3 text-3xl font-medium leading-tight text-zinc-900">Luxury hotel in the heart of the city</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Une expérience haut de gamme pensée pour vos séjours d&apos;affaires et vos escapades détente, avec des espaces
              raffinés et un service exceptionnel.
            </p>
            <Link
              href="/properties"
              className="mt-6 inline-flex h-10 w-fit items-center rounded-md border border-zinc-300 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-800 transition hover:bg-zinc-100"
            >
              Read more
            </Link>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-3 sm:p-6">
          <article>
            <p className="text-2xl font-semibold text-zinc-900">4.9/5</p>
            <p className="mt-1 text-xs text-zinc-600">13.5k avis sur Booking</p>
          </article>
          <article>
            <p className="text-2xl font-semibold text-zinc-900">5/5</p>
            <p className="mt-1 text-xs text-zinc-600">4.2k avis sur Google</p>
          </article>
          <article>
            <p className="text-2xl font-semibold text-zinc-900">4.8/5</p>
            <p className="mt-1 text-xs text-zinc-600">24k avis sur Tripadvisor</p>
          </article>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Exquisite and luxurious</p>
            <h2 className="mt-2 text-3xl font-medium text-zinc-900">Room and suite collection</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {suites.map((suite) => (
              <article key={suite.name} className="overflow-hidden rounded-xl border border-zinc-200">
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${suite.image})` }} />
                <div className="space-y-2 p-4">
                  <p className="text-lg font-medium text-zinc-900">{suite.name}</p>
                  <p className="text-sm text-zinc-500">{suite.price}</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-800 transition hover:bg-zinc-100"
                    >
                      Book now
                    </button>
                    <Link
                      href="/properties"
                      className="inline-flex h-9 items-center rounded-md border border-zinc-900 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                    >
                      View room
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}