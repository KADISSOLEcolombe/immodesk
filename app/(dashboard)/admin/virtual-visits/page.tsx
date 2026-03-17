"use client";

import { FormEvent, useMemo, useState } from 'react';
import { Video } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { mockProperties } from '@/data/properties';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';

export default function AdminVirtualVisitsPage() {
  const { addNotification } = useNotifications();
  const { tours, accesses, logs, configureTourAsset, generateTemporaryAccess, getVisitStats } = useVirtualVisits();

  const [tourPropertyId, setTourPropertyId] = useState(mockProperties[0]?.id ?? '');
  const [tourMediaType, setTourMediaType] = useState<'image360' | 'video360'>('image360');
  const [tourDuration, setTourDuration] = useState('20');
  const [tourFileName, setTourFileName] = useState('');
  const [accessRequester, setAccessRequester] = useState('Visiteur public');
  const [generatedAccessInfo, setGeneratedAccessInfo] = useState<{ id: string; code: string; link: string; expiresAt: string } | null>(null);
  const [feedback, setFeedback] = useState('');

  const visitStats = useMemo(() => getVisitStats(), [getVisitStats]);

  const handleConfigureTour = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tourPropertyId || !tourFileName.trim()) return;

    configureTourAsset({
      propertyId: tourPropertyId,
      fileName: tourFileName,
      mediaType: tourMediaType,
      durationMinutes: Number(tourDuration) || 20,
      accessMode: 'code',
    });

    setFeedback('Fichier 360° configuré et associé au bien.');
    addNotification({ category: 'system', title: `Asset 360° configuré: ${tourFileName}.` });
    setTourFileName('');
  };

  const handleGenerateAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tourPropertyId) return;

    const generated = generateTemporaryAccess(tourPropertyId, accessRequester || 'Visiteur public');
    setGeneratedAccessInfo({
      id: generated.id,
      code: generated.code,
      link: `/visit/${generated.id}`,
      expiresAt: generated.expiresAt,
    });
    setFeedback('Accès temporaire généré (expiration 24h).');
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <Video className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Visites virtuelles 360°</h1>
      </div>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Assets 360°</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{tours.length}</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Accès générés</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{accesses.length}</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Visites totales</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{visitStats.totalVisits}</p>
        </article>
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">Taux conversion</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{visitStats.conversionRate}%</p>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Configuration & upload 360°</h2>
          <form onSubmit={handleConfigureTour} className="space-y-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Bien associé
              <select value={tourPropertyId} onChange={(e) => setTourPropertyId(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
                {mockProperties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Type média
                <select value={tourMediaType} onChange={(e) => setTourMediaType(e.target.value as 'image360' | 'video360')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
                  <option value="image360">Image 360°</option>
                  <option value="video360">Vidéo 360°</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Durée (min)
                <input type="number" min={5} value={tourDuration} onChange={(e) => setTourDuration(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900" />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Fichier 360° (simulé)
              <input type="file" accept="image/*,video/*" onChange={(e) => setTourFileName(e.target.files?.[0]?.name ?? '')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900" />
            </label>

            <button type="submit" className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
              Enregistrer configuration
            </button>
          </form>
        </section>

        {/* Accès temporaire */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Génération d&apos;accès temporaire</h2>
          <form onSubmit={handleGenerateAccess} className="space-y-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Bien
              <select value={tourPropertyId} onChange={(e) => setTourPropertyId(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
                {mockProperties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Demandeur
              <input type="text" value={accessRequester} onChange={(e) => setAccessRequester(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900" />
            </label>
            <button type="submit" className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
              Générer ID + code
            </button>
          </form>

          {generatedAccessInfo && (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 space-y-1">
              <p><strong>ID:</strong> {generatedAccessInfo.id}</p>
              <p><strong>Code:</strong> {generatedAccessInfo.code}</p>
              <p><strong>Lien:</strong> {generatedAccessInfo.link}</p>
              <p><strong>Expire:</strong> {new Date(generatedAccessInfo.expiresAt).toLocaleString('fr-TG')}</p>
            </div>
          )}
        </section>
      </div>

      {feedback && <p className="mt-4 text-sm font-medium text-zinc-700">{feedback}</p>}

      {/* Traçabilité */}
      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Traçabilité des visites</h2>
        <ul className="space-y-1 text-xs text-zinc-700">
          {logs.slice(0, 10).map((log) => (
            <li key={log.id} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
              {log.accessId} · {new Date(log.openedAt).toLocaleString('fr-TG')} · contact: {log.contactClicked ? 'oui' : 'non'}
            </li>
          ))}
          {logs.length === 0 && <li>Aucune visite enregistrée.</li>}
        </ul>
      </section>
    </>
  );
}
