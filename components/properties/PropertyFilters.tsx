"use client";

import React from 'react';
import { useFilters } from '@/context/FilterContext';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function PropertyFilters() {
  const { filters, setFilters, resetFilters } = useFilters();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 animate-premium-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Filtres</h3>
        <button 
          onClick={resetFilters}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Réinitialiser
        </button>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-600">Type de bien</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="all">Tous les types</option>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
            <option value="bureau">Bureau</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-600">Loyer (FCFA)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="minPrice"
              placeholder="Min"
              value={filters.minPrice}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              name="maxPrice"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Rooms */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-600">Pièces</label>
          <select
            name="rooms"
            value={filters.rooms}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="all">Peu importe</option>
            <option value="1">1 pièce</option>
            <option value="2">2 pièces</option>
            <option value="3">3 pièces</option>
            <option value="4">4+ pièces</option>
          </select>
        </div>

        {/* Standing */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-600">Standing</label>
          <select
            name="standing"
            value={filters.standing}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="all">Tous standing</option>
            <option value="standard">Standard</option>
            <option value="confort">Confort</option>
            <option value="haut_de_gamme">Haut de gamme</option>
            <option value="prestige">Prestige</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100">
        <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-widest font-medium">
          Les résultats sont mis à jour en temps réel selon vos critères.
        </p>
      </div>
    </div>
  );
}
