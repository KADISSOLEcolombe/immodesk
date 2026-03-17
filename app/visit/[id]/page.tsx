"use client";

import { FormEvent, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { mockProperties } from '@/data/properties';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';

export default function VirtualVisitPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') ?? '';

  const { accesses, tours, validateAccess, recordVisitOpen, recordContactClick } = useVirtualVisits();

  const [code, setCode] = useState(initialCode);
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState('');
  const [activeAccessId, setActiveAccessId] = useState<string | null>(null);

  const visitId = String(params.id || '');

  const linkedAccess = useMemo(() => accesses.find((item) => item.id === visitId), [accesses, visitId]);
  const property = useMemo(() => mockProperties.find((item) => item.id === linkedAccess?.propertyId), [linkedAccess]);
  const propertyTour = useMemo(() => tours.find((item) => item.propertyId === linkedAccess?.propertyId), [tours, linkedAccess]);

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateAccess(visitId, code);
    if (!result.ok || !result.access) {
      setGranted(false);
      setError(result.message);
      return;
    }

    setError('');
    setGranted(true);
    setActiveAccessId(result.access.id);
    recordVisitOpen(result.access.id);
  };

  const handleContact = () => {
    if (activeAccessId) {
      recordContactClick(activeAccessId);
    }

    const subject = encodeURIComponent(`Demande après visite virtuelle - ${property?.title ?? 'Bien'}`);
    const body = encodeURIComponent('Bonjour,\n\nJe souhaite être recontacté suite à la visite virtuelle.\n\nMerci.');
    window.location.href = `mailto:contact@immodesk.tg?subject=${subject}&body=${body}`;
  };

  if (!granted) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:px-6">
          <section className="w-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Vérification accès visite</h1>
            <p className="mt-1 text-sm text-zinc-600">ID: {visitId}</p>

            <form onSubmit={handleUnlock} className="mt-6 space-y-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Code temporaire
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Déverrouiller
              </button>
            </form>

            {error && <p className="mt-3 text-sm font-medium text-orange-700">{error}</p>}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-2xl border border-black/5 bg-black shadow-xl">
          <iframe
            title="Visite 360 simulée"
            className="h-[70vh] w-full"
            srcDoc={`
              <html>
                <body style="margin:0;overflow:hidden;background:#111;color:#fff;font-family:Arial, sans-serif;">
                  <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(120deg,#222,#555);">
                    <img src="${propertyTour?.fileUrl ?? property?.images?.[0] ?? '/window.svg'}" style="width:120%;max-width:none;opacity:.35;animation:pan 16s linear infinite alternate;" />
                    <div style="position:absolute;text-align:center;">
                      <h2 style="margin:0;font-size:28px;">Visite 360° simulée</h2>
                      <p style="margin-top:8px;opacity:.85;">${property?.title ?? 'Bien immobilier'}</p>
                    </div>
                  </div>
                  <style>
                    @keyframes pan { from { transform: translateX(-8%); } to { transform: translateX(8%); } }
                  </style>
                </body>
              </html>
            `}
          />

          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between">
            <div className="rounded-xl bg-black/55 px-3 py-2 text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-200">Visite virtuelle</p>
              <p className="text-sm font-semibold">{property?.title ?? 'Bien'}</p>
              <p className="text-xs text-zinc-200">{property?.address.city ?? ''}</p>
            </div>

            <div className="rounded-xl bg-black/55 px-3 py-2 text-right text-white backdrop-blur-sm">
              <p className="text-xs text-zinc-200">Durée recommandée</p>
              <p className="text-sm font-semibold">{propertyTour?.durationMinutes ?? 15} min</p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleContact}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Contacter l&apos;agence
          </button>
        </div>
      </main>
    </div>
  );
}
