"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { mockProperties } from '@/data/properties';
import { useVirtualVisits } from '@/components/virtual-visits/VirtualVisitProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Code, CreditCard, KeyRound, Mail, Phone, ShieldCheck, Smartphone, X } from 'lucide-react';

import { Tour360Viewer } from '@/components/virtual-visits/Tour360Viewer';
import { convertTourAssetToTourData } from '@/lib/tour360/adapters';
import demoTourData from '../../../public/tour/visite-demo-export.json';
import { VirtualVisitService } from '@/lib/virtual-visit-service';

export default function VirtualVisitPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') ?? '';

  const { accesses, tours, generateTemporaryAccess, validateAccess, recordVisitOpen, recordContactClick } = useVirtualVisits();
  const router = useRouter();

  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card'>('mobile');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState('');
  const [activeAccessId, setActiveAccessId] = useState<string | null>(null);
  const [popupStep, setPopupStep] = useState<1 | 2 | 3>(1);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentConfirmation, setPaymentConfirmation] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'moov_money' | 'mixx_by_yas' | 'carte_bancaire'>('moov_money');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const paymentSequenceRef = useRef(0);

  const visitId = String(params.id || '');
  const [visitIdInput, setVisitIdInput] = useState(visitId);

  const currentId = activeAccessId || visitIdInput || visitId;
  const linkedAccess = useMemo(() => accesses.find((item) => item.id === currentId), [accesses, currentId]);
  const property = useMemo(() => mockProperties.find((item) => item.id === linkedAccess?.propertyId), [linkedAccess]);
  const propertyTour = useMemo(() => {
    const found = tours.find((item) => item.propertyId === linkedAccess?.propertyId);
    return found || tours[0]; // Fallback if backend property ID doesn't match mock tour IDs
  }, [tours, linkedAccess]);
  
  useEffect(() => {
    const fetchConfig = async () => {
      const vid = params.id as string;
      if (vid && vid.length > 20) { // UUID length check
        try {
          const resp = await VirtualVisitService.getVisite(vid);
          if (resp.success && resp.data) {
            if (resp.data.prix) setVisitPrice(Number(resp.data.prix));
            if (resp.data.bien_id || (resp.data.bien && typeof resp.data.bien === 'object' && (resp.data.bien as any).id)) {
              setRealBienId(resp.data.bien_id || (resp.data.bien as any).id);
            }
          }
        } catch (err) {
          console.error("Could not fetch visit price:", err);
        }
      }
    };
    fetchConfig();
  }, [params.id]);

  // Conversion pour le viewer
  const tourData = useMemo(() => {
    if (propertyTour) {
      // Return the multi-scene demo data so the engine shows the scenes bottom-left
      return demoTourData as any;
    }
    // Fallback data si pas de tour configuré
    return null;
  }, [propertyTour]);

  const inferredPropertyId =
    linkedAccess?.propertyId ?? propertyTour?.propertyId ?? tours[0]?.propertyId ?? mockProperties[0]?.id ?? '';

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Tenter d'utiliser l'API réelle
    try {
      const resp = await VirtualVisitService.connexion(visitIdInput.trim(), code.trim());
      if (resp.success && resp.data?.token) {
        // Optionnel : stocker le token visiteur pour les requêtes futures si nécessaire
        localStorage.setItem('immodesk.visiteur_token', resp.data.token);
        
        // On considère l'accès comme validé
        setGranted(true);
        recordVisitOpen(visitIdInput.trim());
        
        // Redirection vers le viewer
        if (tourData) {
          sessionStorage.setItem('tour360_data', JSON.stringify(tourData));
          sessionStorage.setItem('tour_return_url', window.location.href);
          window.location.href = '/tour/pages/viewer.html?tour=__session__';
        }
        return;
      }
    } catch (err) {
      console.warn("Backend auth failed or unavailable, falling back to local validation.", err);
    }

    // Fallback locale (simulation ou si l'accès vient d'être généré localement)
    const result = validateAccess(visitIdInput.trim(), code.trim());
    if (!result.ok || !result.access) {
      setGranted(false);
      setError(result.message);
      return;
    }

    setActiveAccessId(result.access.id);
    recordVisitOpen(result.access.id);

    if (tourData) {
      sessionStorage.setItem('tour360_data', JSON.stringify(tourData));
      sessionStorage.setItem('tour_return_url', document.referrer || '/properties');
      window.location.href = '/tour/pages/viewer.html?tour=__session__';
    } else {
      setGranted(true);
    }
  };

  const validatePhoneNumber = (phoneNumber: string): { valid: boolean; message?: string } => {
    const cleaned = phoneNumber.replace(/\s+/g, '');
    
    // Togo phone number format: 8 digits starting with 9 or 7
    const togoPattern = /^[97]\d{7}$/;
    
    if (!cleaned) {
      return { valid: false, message: 'Le numéro de téléphone est requis.' };
    }
    
    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, message: 'Le numéro ne doit contenir que des chiffres.' };
    }
    
    if (!togoPattern.test(cleaned)) {
      return { valid: false, message: 'Format invalide. Le numéro doit commencer par 9 ou 7 et contenir 8 chiffres (ex: 90 00 00 00).' };
    }
    
    return { valid: true };
  };

  const handlePayNow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inferredPropertyId) {
      setError('Impossible de déterminer le bien à visiter.');
      return;
    }

    const mmPhone = phone.trim();
    const validation = validatePhoneNumber(mmPhone);
    
    if (!validation.valid) {
      setError(validation.message || 'Numéro de téléphone invalide.');
      return;
    }

    setError('');
    setIsPaying(true);

    // Simulation de paiement selon la méthode choisie
    const methodPrefix = paymentMethod === 'moov_money' ? 'MM' : paymentMethod === 'mixx_by_yas' ? 'MX' : 'CB';
    window.setTimeout(() => {
      // Si l'ID/code ne viennent pas déjà de l'URL, on les génère après paiement.
      const paymentRef = `${methodPrefix}-${Date.now().toString().slice(-6)}`;
      if (!visitIdInput.trim() || !code.trim()) {
        const created = generateTemporaryAccess(inferredPropertyId, mmPhone);
        setVisitIdInput(created.id);
        setCode(created.code);
      }

      setIsPaying(false);
      const methodLabel = paymentMethod === 'moov_money' ? 'Moov Money' : paymentMethod === 'mixx_by_yas' ? 'Mixx by Yas' : 'Carte bancaire';
      setPaymentConfirmation(`Paiement ${methodLabel} confirmé ! Accès à la visite activé. (Réf: ${paymentRef})`);

      // Petit délai pour afficher clairement la confirmation sur l'étape 2.
      window.setTimeout(() => {
        const methodPrefix = paymentMethod === 'mobile' ? 'MM' : 'CARD';
        const paymentRef = `${methodPrefix}-${Date.now().toString().slice(-6)}`;
        
        if (!visitIdInput.trim() || !code.trim()) {
          const created = generateTemporaryAccess(inferredPropertyId, email.trim());
          setVisitIdInput(created.id);
          setCode(created.code);
        }

        setIsPaying(false);
        setPaymentConfirmation(`Paiement confirmé (Simulation) ! Accès activé. (Réf: ${paymentRef})`);
        
        window.setTimeout(() => {
          if (paymentSequenceRef.current !== seq) return;
          setPopupStep(3);
        }, 450);
      }, 900);
    } finally {
      setIsPaying(false);
    }
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

  const handleExitAttempt = () => {
    if (popupStep === 2 || popupStep === 3) {
      setShowExitConfirm(true);
    } else {
      router.push('/');
    }
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-2xl border border-black/5 bg-black shadow-xl h-[70vh]">
          {tourData ? (
            <Tour360Viewer tourData={tourData} className="animate-in fade-in duration-700" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
              <div className="text-center">
                <p className="text-zinc-400">Image panoramique indisponible</p>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between z-10">
            <div className="rounded-xl bg-black/55 px-3 py-2 text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-200">Visite virtuelle</p>
              <p className="text-sm font-semibold">{property?.title ?? 'Bien'}</p>
              <p className="text-xs text-zinc-200">{property?.address?.city ?? ''}</p>
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
                onClick={handleExitAttempt}
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
                    {/* Step 1 & 2 combined - Main Payment form */}
                    {(popupStep === 1 || popupStep === 2) && (
                      <form onSubmit={handlePayNow} className="space-y-6">
                        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                          <h3 className="text-lg font-bold text-zinc-900">
                            Accès à la Visite Virtuelle
                          </h3>
                          <p className="mt-1 text-sm text-zinc-600">
                            {property?.title ?? 'Bien'} • <span className="font-bold text-zinc-900">{visitPrice} FCFA</span>
                          </p>
                        </div>

                        {/* Direct Email - Required for account */}
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-zinc-800">
                            Votre Adresse Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="votre@email.com"
                              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10 placeholder:text-zinc-300"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-tight">
                            Vos identifiants de connexion vous seront envoyés immédiatement après le paiement.
                          </p>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-3">
                          <p className="text-sm font-bold text-zinc-900">
                             Mode de paiement
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                             <button
                               type="button"
                               onClick={() => setPaymentMethod('mobile')}
                               className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border transition-all ${
                                 paymentMethod === 'mobile' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 shadow-sm'
                               }`}
                             >
                                <Smartphone className="w-4 h-4" />
                                <span className="text-xs font-bold">Mobile Money</span>
                             </button>
                             <button
                               type="button"
                               onClick={() => setPaymentMethod('card')}
                               className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border transition-all ${
                                 paymentMethod === 'card' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 shadow-sm'
                               }`}
                             >
                                <CreditCard className="w-4 h-4" />
                                <span className="text-xs font-bold">Carte Bancaire</span>
                             </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-zinc-800">
                            Méthode de paiement
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                              className="mt-3 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                            >
                              <option value="moov_money">Moov Money</option>
                              <option value="mixx_by_yas">Mixx by Yas</option>
                              <option value="carte_bancaire">Carte bancaire</option>
                            </select>
                          </label>

                          <label className="block text-sm font-semibold text-zinc-800">
                            <span className="inline-flex items-center gap-2">
                              <Phone className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                              Numéro de téléphone
                            </span>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(event) => {
                                const value = event.target.value;
                                // Only allow digits and spaces
                                if (/^[\d\s]*$/.test(value)) {
                                  setPhone(value);
                                }
                              }}
                              placeholder="Ex: 90 00 00 00"
                              maxLength={11}
                              className="mt-3 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                            />
                            <p className="mt-1 text-xs text-zinc-500">Format: 8 chiffres commençant par 9 ou 7</p>
                          </label>
                        </div>

                        {error && <p className="text-sm font-medium text-orange-700">{error}</p>}

                        <button
                          type="submit"
                          disabled={isPaying}
                          className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 text-sm font-bold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:opacity-60 disabled:hover:bg-zinc-900"
                        >
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          {isPaying ? 'Transaction en cours...' : paymentMethod === 'mobile' ? 'Payer avec Mobile Money' : 'Payer avec Carte Bancaire'}
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

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Quitter la visite ?</h3>
              <p className="text-sm text-zinc-600 mb-6">
                Si vous quittez maintenant, votre progression sera perdue et vous devrez recommencer le processus de paiement.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition"
                >
                  Continuer la visite
                </button>
                <button
                  onClick={confirmExit}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
                >
                  Quitter
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
