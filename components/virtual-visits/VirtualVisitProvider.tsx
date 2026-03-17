"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { mockProperties } from '@/data/properties';

type MediaType = 'image360' | 'video360';

type TourAsset = {
  id: string;
  propertyId: string;
  fileName: string;
  fileUrl: string;
  mediaType: MediaType;
  durationMinutes: number;
  accessMode: 'code';
  createdAt: string;
};

export type VirtualVisitAccess = {
  id: string;
  propertyId: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  requester: string;
};

export type VirtualVisitLog = {
  id: string;
  accessId: string;
  propertyId: string;
  openedAt: string;
  contactClicked: boolean;
};

type ConfigureTourPayload = {
  propertyId: string;
  fileName: string;
  mediaType: MediaType;
  durationMinutes: number;
  accessMode: 'code';
};

type VirtualVisitStats = {
  totalVisits: number;
  uniqueAccess: number;
  contactClicks: number;
  conversionRate: number;
};

type VirtualVisitsContextValue = {
  tours: TourAsset[];
  accesses: VirtualVisitAccess[];
  logs: VirtualVisitLog[];
  configureTourAsset: (payload: ConfigureTourPayload) => TourAsset;
  generateTemporaryAccess: (propertyId: string, requester: string) => VirtualVisitAccess;
  validateAccess: (visitId: string, code: string) => { ok: boolean; message: string; access?: VirtualVisitAccess };
  recordVisitOpen: (accessId: string) => void;
  recordContactClick: (accessId: string) => void;
  getVisitStats: () => VirtualVisitStats;
};

const STORAGE_KEY = 'immodesk.virtual-visits.v1';

type StoredState = {
  tours: TourAsset[];
  accesses: VirtualVisitAccess[];
  logs: VirtualVisitLog[];
};

const initialTours: TourAsset[] = [
  {
    id: 'tour-1',
    propertyId: 'prop-1',
    fileName: 'sejour-be-360.jpg',
    fileUrl: '/window.svg',
    mediaType: 'image360',
    durationMinutes: 20,
    accessMode: 'code',
    createdAt: new Date().toISOString(),
  },
];

const initialState: StoredState = {
  tours: initialTours,
  accesses: [],
  logs: [],
};

const VirtualVisitsContext = createContext<VirtualVisitsContextValue | null>(null);

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function VirtualVisitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue) as StoredState;
        if (parsed && Array.isArray(parsed.tours) && Array.isArray(parsed.accesses) && Array.isArray(parsed.logs)) {
          setState(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const configureTourAsset = (payload: ConfigureTourPayload) => {
    const property = mockProperties.find((item) => item.id === payload.propertyId);
    const fallbackUrl = property?.images[0] ?? '/window.svg';

    const asset: TourAsset = {
      id: `tour-${Date.now()}`,
      propertyId: payload.propertyId,
      fileName: payload.fileName,
      fileUrl: fallbackUrl,
      mediaType: payload.mediaType,
      durationMinutes: payload.durationMinutes,
      accessMode: payload.accessMode,
      createdAt: new Date().toISOString(),
    };

    setState((current) => ({ ...current, tours: [asset, ...current.tours] }));
    return asset;
  };

  const generateTemporaryAccess = (propertyId: string, requester: string) => {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    const entry: VirtualVisitAccess = {
      id: `visit-${Date.now()}`,
      propertyId,
      code: randomCode(),
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      requester,
    };

    setState((current) => ({ ...current, accesses: [entry, ...current.accesses] }));
    return entry;
  };

  const validateAccess = (visitId: string, code: string) => {
    const access = state.accesses.find((item) => item.id === visitId);
    if (!access) {
      return { ok: false, message: 'ID de visite introuvable.' };
    }

    if (access.code !== code.trim()) {
      return { ok: false, message: 'Code invalide.' };
    }

    if (new Date(access.expiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'Lien expiré (24h dépassées).' };
    }

    return { ok: true, message: 'Accès autorisé.', access };
  };

  const recordVisitOpen = (accessId: string) => {
    const access = state.accesses.find((item) => item.id === accessId);
    if (!access) {
      return;
    }

    const log: VirtualVisitLog = {
      id: `log-${Date.now()}`,
      accessId,
      propertyId: access.propertyId,
      openedAt: new Date().toISOString(),
      contactClicked: false,
    };

    setState((current) => ({ ...current, logs: [log, ...current.logs] }));
  };

  const recordContactClick = (accessId: string) => {
    setState((current) => ({
      ...current,
      logs: current.logs.map((item) =>
        item.accessId === accessId && !item.contactClicked ? { ...item, contactClicked: true } : item,
      ),
    }));
  };

  const getVisitStats = () => {
    const totalVisits = state.logs.length;
    const uniqueAccess = new Set(state.logs.map((item) => item.accessId)).size;
    const contactClicks = state.logs.filter((item) => item.contactClicked).length;
    const conversionRate = totalVisits === 0 ? 0 : Math.round((contactClicks / totalVisits) * 100);

    return {
      totalVisits,
      uniqueAccess,
      contactClicks,
      conversionRate,
    };
  };

  const value: VirtualVisitsContextValue = {
    tours: state.tours,
    accesses: state.accesses,
    logs: state.logs,
    configureTourAsset,
    generateTemporaryAccess,
    validateAccess,
    recordVisitOpen,
    recordContactClick,
    getVisitStats,
  };

  return <VirtualVisitsContext.Provider value={value}>{children}</VirtualVisitsContext.Provider>;
}

export function useVirtualVisits() {
  const context = useContext(VirtualVisitsContext);

  if (!context) {
    throw new Error('useVirtualVisits must be used inside VirtualVisitProvider');
  }

  return context;
}
