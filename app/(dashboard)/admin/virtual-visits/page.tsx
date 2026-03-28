"use client";

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Video, ExternalLink, X } from 'lucide-react';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { VirtualVisitService, VisiteConfig } from '@/lib/virtual-visit-service';
import { normalizeMediaUrl } from '@/lib/utils';
import { Bien } from '@/types/api';

type AdminProperty = {
  id: string;
  title: string;
  address: string;
  status: string;
  image: string;
  raw: Bien;
};

const statusLabel: Record<string, string> = {
  vacant: 'Vacant',
  loue: 'Loué',
  en_travaux: 'En travaux',
  maintenance: 'Maintenance',
  reservation: 'Réservation',
};

const statusBadgeClass: Record<string, string> = {
  vacant: 'bg-green-100 text-green-700',
  loue: 'bg-blue-100 text-blue-700',
  en_travaux: 'bg-orange-100 text-orange-700',
  maintenance: 'bg-orange-100 text-orange-700',
  reservation: 'bg-purple-100 text-purple-700',
};

function extractImage(property: Bien): string {
  const rawProperty = property as unknown as Record<string, unknown>;

  const normalizeCandidate = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
    return normalizeMediaUrl(trimmed.replaceAll('\\', '/'));
  };

  const mainPhoto = normalizeCandidate(rawProperty.photo_principale);
  if (mainPhoto) return mainPhoto;

  if (Array.isArray(property.photos) && property.photos.length > 0) {
    const firstPhoto = normalizeCandidate(property.photos[0]?.fichier);
    if (firstPhoto) return firstPhoto;
  }

  if (Array.isArray(property.images) && property.images.length > 0) {
    const firstLegacyImage = normalizeCandidate(property.images[0]);
    if (firstLegacyImage) return firstLegacyImage;
  }

  return '/window.svg';
}

function mapProperty(property: Bien): AdminProperty {
  return {
    id: property.id,
    title: property.titre || `Bien ${property.id.slice(0, 8)}`,
    address: property.adresse || property.adresse_complete || 'Adresse non disponible',
    status: String(property.statut || 'vacant'),
    image: extractImage(property),
    raw: property,
  };
}

function AdminVirtualVisitsPageInner() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [visites, setVisites] = useState<VisiteConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEditorUrl, setActiveEditorUrl] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [biensRes, visitesRes] = await Promise.all([
        PatrimoineService.getBiens(),
        VirtualVisitService.getVisites()
      ]);

      if (!biensRes.success || !biensRes.data) {
        setError(biensRes.message || 'Impossible de charger les biens.');
        return;
      }

      setProperties(biensRes.data.map(mapProperty));
      
      if (visitesRes.success && visitesRes.data) {
        setVisites(visitesRes.data);
      }
    } catch (err) {
      console.error('Erreur chargement admin visite:', err);
      setError('Erreur serveur lors du chargement des données.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (visiteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette visite virtuelle ? Cette action est irréversible.')) {
      return;
    }
    try {
      const res = await VirtualVisitService.deleteVisite(visiteId);
      if (res.success || res.code === 'RESOURCE_DELETED' || (!('success' in res))) {
        setVisites(visites.filter(v => v.id !== visiteId));
      } else {
        alert(res.message || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur serveur lors de la suppression.');
    }
  };

  useEffect(() => {
    // S'assurer que l'éditeur statique connaît l'URL de l'API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    const formattedApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    localStorage.setItem('api_base_url', formattedApiUrl);

    loadData();

    // Listener pour fermer l'éditeur depuis l'iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'close-editor') {
        setActiveEditorUrl(null);
        loadData(); // Recharger les données pour voir les changements (brouillon/publié)
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <Video className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Gestion des visites virtuelles</h1>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-sm text-zinc-600">Sélectionnez un bien pour gérer sa visite virtuelle intégrée.</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" aria-hidden="true" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : properties.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Aucun bien trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const visite = visites.find((v) => v.bien_id === property.id);
              const hasTour = !!visite;
              const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
              const tokenParam = token ? `&token=${token}` : '';
              
              const editorUrl = hasTour
                ? `/tour/pages/editor.html?bienId=${property.id}&bienName=${encodeURIComponent(property.title)}&visitId=${visite.id}${tokenParam}`
                : `/tour/pages/editor.html?bienId=${property.id}&bienName=${encodeURIComponent(property.title)}${tokenParam}`;

              return (
                <div
                  key={property.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 transition hover:border-zinc-200 hover:bg-white"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-zinc-100">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = '/window.svg';
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between space-y-3 p-3 text-sm">
                    <div>
                      <p className="truncate font-semibold text-zinc-900">{property.title}</p>
                      <p className="truncate text-xs text-zinc-600 mb-2">{property.address}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass[property.status] || 'bg-zinc-100 text-zinc-700'}`}>
                          {statusLabel[property.status] || property.status}
                        </span>
                        {hasTour ? (
                          visite.actif ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              ✓ Visite publiée
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              En brouillon
                            </span>
                          )
                        ) : (
                          <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                            Aucune visite
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setActiveEditorUrl(editorUrl)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                          hasTour 
                            ? 'bg-zinc-900 text-white shadow-sm hover:bg-zinc-800' 
                            : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                        }`}
                      >
                        <Video className="h-4 w-4" />
                        {hasTour ? "Modifier la visite" : 'Créer une visite'}
                      </button>
                      
                      {hasTour && (
                        <button
                          onClick={() => handleDelete(visite.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          <X className="h-4 w-4" />
                          Supprimer la visite
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {/* Overlay Éditeur Iframe */}
      {activeEditorUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="flex h-12 items-center justify-between border-b border-white/10 bg-zinc-900 px-4 text-white">
            <span className="text-sm font-medium">Éditeur 360° — ImmoDesk</span>
            <button 
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir fermer l\'éditeur ? Les modifications non enregistrées seront perdues.')) {
                  setActiveEditorUrl(null);
                  loadData();
                }
              }}
              className="rounded-lg p-2 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe 
            src={activeEditorUrl} 
            className="h-full w-full border-none"
            title="Éditeur 360"
          />
        </div>
      )}
    </section>
  );
}

export default function AdminVirtualVisitsPage() {
  return (
    <Suspense fallback={null}>
      <AdminVirtualVisitsPageInner />
    </Suspense>
  );
}
