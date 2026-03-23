"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, CreditCard, Smartphone, Wallet, Loader2, CheckCircle2, ArrowRight, ShieldCheck, Home, Calendar } from 'lucide-react';
import { PaiementEnLigneService, InitierPaiementData } from '@/lib/paiement-en-ligne-service';
import { TransactionsList } from '@/components/paiement/TransactionsList';
import { TransactionPaiement, MoyenPaiement, Bail } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { jsPDF } from 'jspdf';
import { LocationsService } from '@/lib/locations-service';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const moyensPaiement = [
  { 
    id: 'moov_money' as MoyenPaiement, 
    label: 'Moov Money', 
    icon: Smartphone,
    description: 'Paiement via Moov Money'
  },
  { 
    id: 'mixx_by_yas' as MoyenPaiement, 
    label: 'Mixx by Yas', 
    icon: Wallet,
    description: 'Paiement via Mixx by Yas'
  },
  { 
    id: 'carte_bancaire' as MoyenPaiement, 
    label: 'Carte Bancaire', 
    icon: CreditCard,
    description: 'Paiement par carte bancaire'
  },
];

// Map UI payment method to API payment method
const mapPaymentMethod = (method: 'moov' | 'mix' | 'card'): MoyenPaiement => {
  switch (method) {
    case 'moov': return 'moov_money';
    case 'mix': return 'mixx_by_yas';
    case 'card': return 'carte_bancaire';
    default: return 'moov_money';
  }
};

// Get month options for next 12 months
const getMonthOptions = () => {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const value = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
};

export default function TenantPaymentPage() {
  const { addNotification } = useNotifications();
  const [bail, setBail] = useState<Bail | null>(null);
  const [isLoadingBail, setIsLoadingBail] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'moov' | 'mix' | 'card'>('moov');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionEnCours, setTransactionEnCours] = useState<TransactionPaiement | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pendingMobileId, setPendingMobileId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthOptions()[0].value);
  const [includeCharges, setIncludeCharges] = useState(false);

  // Fetch bail info on mount
  useEffect(() => {
    loadBailInfo();
  }, []);

  const loadBailInfo = async () => {
    setIsLoadingBail(true);
    try {
      // Get tenant's bails - take the first active one
      const response = await LocationsService.getMonBail();
      if (response.success && response.data) {
        setBail(response.data);
      }
    } catch (err) {
      console.error('Error loading bail:', err);
    } finally {
      setIsLoadingBail(false);
    }
  };

  const baseRent = bail?.loyer_mensuel || 0;
  const charges = bail?.charges_mensuelles || 0;
  const totalToPay = includeCharges ? baseRent + charges : baseRent;

  const validateForm = (): boolean => {
    if (!bail) {
      setPaymentError('Aucun bail actif trouvé');
      return false;
    }
    
    if (totalToPay <= 0) {
      setPaymentError('Le montant doit être supérieur à 0');
      return false;
    }

    if ((paymentMethod === 'moov' || paymentMethod === 'mix') && !mobileNumber) {
      setPaymentError('Veuillez saisir votre numéro de téléphone');
      return false;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.length < 16) {
        setPaymentError('Veuillez saisir un numéro de carte valide (16 chiffres)');
        return false;
      }
      if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        setPaymentError('Veuillez saisir une date d\'expiration valide (MM/AA)');
        return false;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setPaymentError('Veuillez saisir le CVV (3 chiffres)');
        return false;
      }
    }

    return true;
  };

  const handlePay = async () => {
    setPaymentError(null);
    setPaymentInfo(null);

    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const moyenPaiement = mapPaymentMethod(paymentMethod);
      const data: InitierPaiementData = {
        bail_id: bail!.id,
        montant: totalToPay,
        moyen_paiement: moyenPaiement,
        mois_concerne: selectedMonth,
        ...(paymentMethod === 'moov' || paymentMethod === 'mix' 
          ? { numero_telephone: formatPhoneNumber(mobileNumber) }
          : {
              numero_carte: cardNumber.replace(/\s/g, ''),
              date_expiration: cardExpiry,
              cvv: cardCvv,
            }
        ),
      };

      const response = await PaiementEnLigneService.initierPaiement(data);
      
      if (response.success && response.data) {
        setTransactionEnCours(response.data);
        
        if (response.data.statut === 'valide') {
          setPaymentInfo('Paiement validé avec succès !');
          addNotification({
            type: 'info',
            titre: 'Paiement effectué avec succès',
            message: 'Votre paiement a été validé.',
          });
        } else if (response.data.statut === 'echoue') {
          setPaymentError(response.data.message_retour || 'Le paiement a échoué');
        } else if (response.data.statut === 'en_attente') {
          // For mobile money, show SMS verification
          if (paymentMethod === 'moov' || paymentMethod === 'mix') {
            setPendingMobileId(response.data.id);
          } else {
            // For card, poll for status
            pollTransactionStatus(response.data.reference);
          }
        }
      } else {
        setPaymentError(response.message || 'Erreur lors du paiement');
      }
    } catch (err) {
      setPaymentError('Erreur technique lors du paiement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const pollTransactionStatus = async (reference: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) return;
      attempts++;
      
      try {
        const response = await PaiementEnLigneService.getStatutTransaction(reference);
        if (response.success && response.data) {
          setTransactionEnCours(response.data);
          
          if (response.data.statut === 'valide') {
            setPaymentInfo('Paiement validé avec succès !');
            addNotification({
              type: 'paiement',
              titre: 'Paiement confirmé',
              message: 'La transaction a été validée.',
            });
            return;
          } else if (response.data.statut === 'echoue' || response.data.statut === 'annule') {
            setPaymentError(response.data.message_retour || 'Le paiement a échoué');
            return;
          }
        }
        
        // Continue polling
        setTimeout(checkStatus, 3000);
      } catch (err) {
        console.error('Error checking status:', err);
      }
    };
    
    checkStatus();
  };

  const formatPhoneNumber = (phone: string): string => {
    // Ensure phone starts with +
    let formatted = phone.replace(/\s/g, '');
    if (!formatted.startsWith('+')) {
      formatted = '+228' + formatted; // Default to Togo country code
    }
    return formatted;
  };

  const handleConfirmSms = async () => {
    if (!transactionEnCours) return;
    
    // In a real implementation, this would verify the SMS code
    // For now, we just poll for the transaction status
    setPendingMobileId(null);
    pollTransactionStatus(transactionEnCours.reference);
  };

  const handleDownloadReceipt = () => {
    if (!transactionEnCours) return;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reçu de Paiement - ImmoDesk', 20, 20);
    doc.setFontSize(12);
    doc.text(`Référence: ${transactionEnCours.reference}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 50);
    doc.text(`Montant: ${formatCurrency(transactionEnCours.montant)}`, 20, 60);
    doc.text(`Moyen: ${transactionEnCours.moyen_paiement}`, 20, 70);
    doc.text(`Mois: ${new Date(transactionEnCours.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`, 20, 80);
    doc.save(`recu-paiement-${transactionEnCours.reference}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-zinc-900" />
          Payer mon loyer
        </h1>
        <p className="text-zinc-500 mt-2">Sécurisé, rapide et sans frais supplémentaires.</p>
      </div>

      {isLoadingBail ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          <span className="ml-3 text-zinc-500">Chargement de vos informations...</span>
        </div>
      ) : !bail ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <Home className="w-12 h-12 mb-4 text-zinc-300" />
          <p className="text-lg font-medium">Aucun bail actif trouvé</p>
          <p className="text-sm">Veuillez contacter votre propriétaire pour plus d'informations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de paiement */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-zinc-100 bg-white p-6 sm:p-8 shadow-xl shadow-zinc-200/40">
            <div className="space-y-8">
              
              {/* Période et Montant */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Détails du paiement</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-zinc-700">Mois concerné</span>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)} 
                      className="h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 appearance-none cursor-pointer"
                    >
                      {getMonthOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col justify-end pb-1">
                    <label className="inline-flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={includeCharges} 
                        onChange={(e) => setIncludeCharges(e.target.checked)} 
                        className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" 
                      />
                      <span className="text-sm font-medium text-zinc-700">
                        Inclure les charges <span className="text-zinc-500">({currencyFormatter.format(charges)})</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Choix du moyen de paiement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Moyen de paiement</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['mix', 'moov', 'card'] as const).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <label 
                        key={method} 
                        className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-zinc-900 bg-zinc-50' 
                            : 'border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          checked={isSelected} 
                          onChange={() => setPaymentMethod(method)} 
                          className="sr-only" 
                        />
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                            {method === 'card' ? <CreditCard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className={`font-semibold ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>
                              {method === 'mix' ? 'Flooz' : method === 'moov' ? 'Moov Money' : method === 'tmoney' ? 'TMoney' : 'Carte Bancaire'}
                            </div>
                            <div className="text-xs text-zinc-500">Sans frais cachés</div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <CheckCircle2 className="w-5 h-5 text-zinc-900" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Informations de paiement */}
              <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                {(paymentMethod === 'mix' || paymentMethod === 'moov') && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Numéro de téléphone mobile money</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input 
                        type="tel" 
                        value={mobileNumber} 
                        onChange={(e) => setMobileNumber(e.target.value)} 
                        placeholder="Ex: 90 00 00 00" 
                        className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 font-medium text-lg tracking-wide" 
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Numéro de carte</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input 
                          type="text" 
                          value={cardNumber} 
                          onChange={(e) => setCardNumber(e.target.value)} 
                          placeholder="0000 0000 0000 0000" 
                          className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 font-mono tracking-widest" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Expiration</label>
                        <input 
                          type="text" 
                          value={cardExpiry} 
                          onChange={(e) => setCardExpiry(e.target.value)} 
                          placeholder="MM/AA" 
                          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 text-center font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">CVV</label>
                        <input 
                          type="password" 
                          value={cardCvv} 
                          onChange={(e) => setCardCvv(e.target.value)} 
                          placeholder="123" 
                          maxLength={3}
                          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 text-center font-mono" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages & Actions */}
              {pendingMobileId ? (
                <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 text-amber-800 mb-2">
                    <ShieldCheck className="w-6 h-6" />
                    <h4 className="font-bold text-lg">Vérification SMS</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Veuillez saisir le code de confirmation envoyé sur votre téléphone pour valider la transaction.
                    <br/><span className="text-xs opacity-75">(Pour la démo, utilisez le code : 1234)</span>
                  </p>
                  
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={smsCode} 
                      onChange={(e) => setSmsCode(e.target.value)} 
                      placeholder="Code" 
                      className="h-12 flex-1 rounded-xl border border-amber-300 bg-white px-4 text-center text-xl font-bold text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 tracking-widest" 
                    />
                    <button 
                      type="button" 
                      onClick={handleConfirmSms} 
                      className="h-12 px-6 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={handlePay} 
                  className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white text-lg font-bold hover:bg-zinc-800 hover:scale-[1.02] transition-all shadow-xl shadow-zinc-900/20 group"
                >
                  Payer {currencyFormatter.format(totalToPay)}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Status Messages */}
              {paymentInfo && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{paymentInfo}</p>
                </div>
              )}
              {paymentError && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{paymentError}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Colonne de droite - Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-3xl border border-zinc-100 bg-zinc-900 text-white p-6 shadow-xl shadow-zinc-900/20">
            <h3 className="text-xl font-bold mb-6">Récapitulatif</h3>
            
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <span className="text-zinc-400">Loyer de base</span>
                <span className="font-medium">{currencyFormatter.format(baseRent)}</span>
              </div>
              
              {includeCharges && (
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800 animate-in fade-in slide-in-from-top-2">
                  <span className="text-zinc-400">Charges locatives</span>
                  <span className="font-medium text-amber-200">+{currencyFormatter.format(charges)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-400 font-medium">Total à payer</span>
                <span className="text-2xl font-bold text-white">{currencyFormatter.format(totalToPay)}</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 text-xs text-zinc-300">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>Vos paiements sont sécurisés. Un reçu sera généré automatiquement et envoyé sur votre adresse email.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
