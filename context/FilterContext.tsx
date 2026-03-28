"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PropertyFilters {
  search: string;
  minPrice: string;
  maxPrice: string;
  rooms: string;
  type: string;
  standing: string;
}

interface FilterContextType {
  filters: PropertyFilters;
  setFilters: React.Dispatch<React.SetStateAction<PropertyFilters>>;
  resetFilters: () => void;
}

const defaultFilters: PropertyFilters = {
  search: '',
  minPrice: '',
  maxPrice: '',
  rooms: 'all',
  type: 'all',
  standing: 'all',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
