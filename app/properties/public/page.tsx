"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Bed, Bath, Square, Search, Filter } from 'lucide-react';
import { PublicService } from '@/lib/services';

interface PublicBien {
  id: string;
  titre: string;
  adresse_complete: string;
  surface: number;
  nombre_pieces: number;
  nombre_chambres: number;
  loyer_mensuel: number;
  depot_garantie: number;
  meuble: boolean;
  images: string[];
  type_logement: string;
  note_moyenne?: number;
  nombre_avis?: number;
}

export function PublicPropertiesPage() {
  const [properties, setProperties] = useState<PublicBien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    loyer_max: '',
    nombre_chambres: '',
    meuble: '',
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await PublicService.getAvailableProperties();
      if (response.success && response.data) {
        setProperties(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur technique lors du chargement des biens');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const searchFilters: any = {};
      if (filters.loyer_max) searchFilters.loyer_max = parseInt(filters.loyer_max);
      if (filters.nombre_chambres) searchFilters.nombre_chambres = parseInt(filters.nombre_chambres);
      if (filters.meuble) searchFilters.meuble = filters.meuble === 'true';
      
      const response = await PublicService.searchProperties(searchQuery, searchFilters);
      if (response.success && response.data) {
        setProperties(response.data);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement des biens disponibles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-2xl font-bold text-zinc-900">
              IMMODESK
            </Link>
            <div className="space-x-4">
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                Connexion
              </Link>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ville, adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
            >
              Rechercher
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <select
              value={filters.loyer_max}
              onChange={(e) => setFilters({ ...filters, loyer_max: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Budget max</option>
              <option value="100000">100 000 FCFA</option>
              <option value="200000">200 000 FCFA</option>
              <option value="300000">300 000 FCFA</option>
              <option value="500000">500 000 FCFA</option>
            </select>
            
            <select
              value={filters.nombre_chambres}
              onChange={(e) => setFilters({ ...filters, nombre_chambres: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Chambres</option>
              <option value="1">1 chambre</option>
              <option value="2">2 chambres</option>
              <option value="3">3 chambres</option>
              <option value="4">4+ chambres</option>
            </select>
            
            <select
              value={filters.meuble}
              onChange={(e) => setFilters({ ...filters, meuble: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Tous</option>
              <option value="true">Meublé</option>
              <option value="false">Non meublé</option>
            </select>
          </div>
        </div>
      </header>

      {/* Properties Grid */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">
          Biens disponibles ({properties.length})
        </h1>
        
        {properties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun bien disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/public/${property.id}`}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.titre}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Pas d'image
                    </div>
                  )}
                  {property.meuble && (
                    <span className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-xs font-medium rounded">
                      Meublé
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-2 line-clamp-1">
                    {property.titre}
                  </h2>
                  <p className="text-gray-500 text-sm mb-2 line-clamp-1">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {property.adresse_complete}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>
                      <Bed className="inline h-4 w-4 mr-1" />
                      {property.nombre_chambres}
                    </span>
                    <span>
                      <Bath className="inline h-4 w-4 mr-1" />
                      {property.nombre_pieces - property.nombre_chambres}
                    </span>
                    <span>
                      <Square className="inline h-4 w-4 mr-1" />
                      {property.surface} m²
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-lg font-bold text-zinc-900">
                        {formatCurrency(property.loyer_mensuel)}
                      </p>
                      <p className="text-xs text-gray-500">/mois</p>
                    </div>
                    {property.note_moyenne && (
                      <div className="flex items-center text-sm">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">{property.note_moyenne}</span>
                        <span className="text-gray-400 ml-1">({property.nombre_avis})</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
