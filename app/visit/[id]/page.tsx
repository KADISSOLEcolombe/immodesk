"use client";

import { FormEvent, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { mockProperties } from '@/data/properties';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Code, KeyRound, Phone, ShieldCheck, X } from 'lucide-react';

export default function VirtualVisitPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') ?? '';

  const { accesses, tours, generateTemporaryAccess, validateAccess, recordVisitOpen, recordContactClick } = useVirtualVisits();
  const router = useRouter();

  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState('');
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState('');
  const [activeAccessId, setActiveAccessId] = useState<string | null>(null);
  const [popupStep, setPopupStep] = useState<1 | 2 | 3>(1);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentConfirmation, setPaymentConfirmation] = useState<string>('');
  const paymentSequenceRef = useRef(0);

  const visitId = String(params.id || '');
  const [visitIdInput, setVisitIdInput] = useState(visitId);

  const linkedAccess = useMemo(() => accesses.find((item) => item.id === visitId), [accesses, visitId]);
  const property = useMemo(() => mockProperties.find((item) => item.id === linkedAccess?.propertyId), [linkedAccess]);
  const propertyTour = useMemo(() => tours.find((item) => item.propertyId === linkedAccess?.propertyId), [tours, linkedAccess]);
  const inferredPropertyId =
    linkedAccess?.propertyId ?? propertyTour?.propertyId ?? tours[0]?.propertyId ?? mockProperties[0]?.id ?? '';

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateAccess(visitIdInput, code);
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

  const handlePayNow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const seq = ++paymentSequenceRef.current;

    if (!inferredPropertyId) {
      setError('Impossible de déterminer le bien à visiter.');
      return;
    }

    const mmPhone = phone.trim();
    if (!mmPhone) {
      setError('Renseigne ton numéro Mobile Money.');
      return;
    }

    setError('');
    setIsPaying(true);

    // Simulation de paiement Mobile Money avant d'afficher l'accès.
    window.setTimeout(() => {
      // Si l'ID/code ne viennent pas déjà de l'URL, on les génère après paiement.
      const paymentRef = `MM-${Date.now().toString().slice(-6)}`;
      if (!visitIdInput.trim() || !code.trim()) {
        const created = generateTemporaryAccess(inferredPropertyId, mmPhone);
        setVisitIdInput(created.id);
        setCode(created.code);
      }

      setIsPaying(false);
      setPaymentConfirmation(`Paiement confirmé ! Accès à la visite activé. (Réf: ${paymentRef})`);

      // Petit délai pour afficher clairement la confirmation sur l'étape 2.
      window.setTimeout(() => {
        if (paymentSequenceRef.current !== seq) return;
        setPopupStep(3);
      }, 450);
    }, 900);
  };

  const handleContact = () => {
    if (activeAccessId) {
      recordContactClick(activeAccessId);
    }

    const subject = encodeURIComponent(`Demande après visite virtuelle - ${property?.title ?? 'Bien'}`);
    const body = encodeURIComponent('Bonjour,\n\nJe souhaite être recontacté suite à la visite virtuelle.\n\nMerci.');
    window.location.href = `mailto:contact@immodesk.tg?subject=${subject}&body=${body}`;
  };

  const goBackStep = () => {
    setError('');
    setIsPaying(false);
    setPaymentConfirmation('');
    paymentSequenceRef.current += 1;
    setPopupStep((current) => (current > 1 ? ((current - 1) as 1 | 2) : current));
  };

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
          {granted && (
            <button
              type="button"
              onClick={handleContact}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Contacter l&apos;agence
            </button>
          )}
        </div>

        {!granted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl rounded-[28px] shadow-2xl ring-1 ring-black/5 overflow-hidden bg-white animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              <button
                onClick={() => router.push('/visit')}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-sm text-zinc-900 transition-all hover:scale-110"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              {popupStep > 1 && (
                <button
                  type="button"
                  onClick={goBackStep}
                  className="absolute top-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 ring-1 ring-black/10 backdrop-blur-sm text-zinc-900 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                  aria-label="Retour"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
              )}

              {/* Head */}
              <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 px-6 py-6 sm:px-10 sm:py-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 ring-1 ring-white/10">
                    <ShieldCheck className="h-4 w-4 text-white" aria-hidden="true" />
                    Accès visite 360°
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Visite virtuelle sécurisée</h2>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-300 leading-relaxed">
                    Une expérience fluide, du paiement à l'accès en temps réel.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6 sm:px-10 sm:py-8">
                <div className="mx-auto max-w-2xl">
                  <div className="rounded-3xl border border-zinc-100 bg-white p-4 sm:p-5 shadow-sm">
                    {/* Step 1 */}
                    {popupStep === 1 && (
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Étape 1
                          </div>
                          <h3 className="mt-2 text-lg font-bold text-zinc-900">
                            Voici le bien que vous souhaitez visiter virtuellement
                          </h3>
                          <p className="mt-1 text-sm text-zinc-600">
                            {property?.title ?? 'Bien'} {property?.address?.city ? `• ${property.address.city}` : ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setError('');
                            setPaymentConfirmation('');
                            paymentSequenceRef.current += 1;
                            setPopupStep(2);
                          }}
                          className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 text-sm font-bold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                        >
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
                          Accéder à la visite
                        </button>
                      </div>
                    )}

                    {/* Step 2 */}
                    {popupStep === 2 && (
                      <form onSubmit={handlePayNow} className="space-y-4">
                        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Étape 2
                          </div>
                          <h3 className="mt-2 text-lg font-bold text-zinc-900">
                            Vous êtes sur le point de visiter ce bien en réalité virtuelle.
                          </h3>
                          <p className="mt-1 text-sm text-zinc-600">
                            L’accès à la visite est disponible pour seulement <span className="font-bold text-zinc-900">200 FCFA</span>.
                          </p>
                        </div>

                        <label className="block text-sm font-semibold text-zinc-800">
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                            Numéro de téléphone (paiement Mobile Money)
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="Ex: 90 00 00 00"
                            className="mt-3 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                          />
                        </label>

                        {error && <p className="text-sm font-medium text-orange-700">{error}</p>}

                        <button
                          type="submit"
                          disabled={isPaying}
                          className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-600/15 disabled:opacity-60 disabled:hover:bg-emerald-600"
                        >
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          {isPaying ? 'Paiement en cours...' : 'Payer maintenant'}
                        </button>

                        {paymentConfirmation && (
                          <div className="mt-1 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200 text-emerald-800">
                            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
                            <p className="text-sm font-semibold leading-snug">{paymentConfirmation}</p>
                          </div>
                        )}
                      </form>
                    )}

                    {/* Step 3 */}
                    {popupStep === 3 && (
                      <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Étape 3
                          </div>
                          {paymentConfirmation && (
                            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200 text-emerald-800">
                              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" aria-hidden="true" />
                              <p className="text-sm font-semibold leading-snug">{paymentConfirmation}</p>
                            </div>
                          )}
                          <h3 className="mt-2 text-lg font-bold text-zinc-900">
                            Commencer la visite virtuelle
                          </h3>
                          <p className="mt-1 text-sm text-zinc-600">
                            Renseignez l’identifiant et le code d’accès.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="block text-sm font-semibold text-zinc-800">
                            <span className="inline-flex items-center gap-2">
                              <Code className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                              Identifiant
                            </span>
                            <input
                              type="text"
                              value={visitIdInput}
                              onChange={(event) => setVisitIdInput(event.target.value)}
                              className="mt-3 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                            />
                          </label>

                          <label className="block text-sm font-semibold text-zinc-800">
                            <span className="inline-flex items-center gap-2">
                              <KeyRound className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                              Code d’accès
                            </span>
                            <input
                              type="text"
                              value={code}
                              onChange={(event) => setCode(event.target.value)}
                              className="mt-3 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                            />
                          </label>
                        </div>

                        {error && <p className="text-sm font-medium text-orange-700">{error}</p>}

                        <button
                          type="submit"
                          className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 text-sm font-bold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                        >
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
                          Commencer la visite
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-center text-xs text-zinc-500 gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Données non partagées. Utilisées uniquement pour la visite.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
