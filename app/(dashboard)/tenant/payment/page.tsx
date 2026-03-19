"use client";

import { useState } from 'react';
import { CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PaymentRecord, usePayments } from '@/components/payments/PaymentProvider';
import { jsPDF } from 'jspdf';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const baseRent = 180000;
const charges = 15000;
const tenantName = 'Kossi Mensah';
const propertyTitle = 'Appartement meublé à Bè';

type PaymentMethod = 'mix' | 'moov' | 'tmoney' | 'card';

const generateReceiptPdf = (record: PaymentRecord) => {
  const doc = new jsPDF();
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('ImmoDesk Togo', 14, 18);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Reçu de paiement', 14, 42);
  doc.setFontSize(11);
  doc.text(`Référence: ${record.reference}`, 14, 52);
  doc.text(`Date: ${new Date(record.createdAt).toLocaleString('fr-TG')}`, 14, 60);
  doc.text(`Locataire: ${record.tenantName}`, 14, 68);
  doc.text(`Bien: ${record.propertyTitle}`, 14, 76);
  doc.text(`Mois: ${record.month}`, 14, 84);
  doc.text(`Canal: ${record.channel}`, 14, 92);
  doc.text(`Statut: ${record.status}`, 14, 100);
  doc.text(`Montant: ${currencyFormatter.format(record.amount)}`, 14, 108);
  doc.setFontSize(9);
  doc.text('Ce reçu est généré automatiquement (simulation).', 14, 122);
  doc.save(`recu-${record.reference}.pdf`);
};

export default function TenantPaymentPage() {
  const { addNotification } = useNotifications();
  const {
    startMobileMoneyPayment,
    confirmMobileMoneyPayment,
    startCardPayment,
    markReceiptGenerated,
    markReceiptEmailed,
  } = usePayments();

  const [month, setMonth] = useState('mars 2026');
  const [includeCharges, setIncludeCharges] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mix');
  const [mobileNumber, setMobileNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [pendingMobileId, setPendingMobileId] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');

  const totalToPay = includeCharges ? baseRent + charges : baseRent;

  const simulateEmailReceipt = (record: PaymentRecord) => {
    markReceiptEmailed(record.id);
    addNotification({ category: 'message', title: `Reçu envoyé par email (simulation) pour ${record.reference}.` });
  };

  const handlePay = async () => {
    setPaymentError('');
    setPaymentInfo('');

    if (paymentMethod === 'mix' || paymentMethod === 'moov' || paymentMethod === 'tmoney') {
      if (!mobileNumber.trim()) {
        setPaymentError('Renseigne le numéro Mobile Money.');
        return;
      }
      const created = startMobileMoneyPayment({ tenantName, propertyTitle, month, amount: totalToPay, operator: paymentMethod, phone: mobileNumber });
      setPendingMobileId(created.id);
      setPaymentInfo('Code SMS envoyé (simulation): utilise 1234 pour valider.');
      addNotification({ category: 'payment', title: `Paiement Mobile Money en attente (${paymentMethod.toUpperCase()}) pour ${month}.` });
      return;
    }

    const created = startCardPayment({ tenantName, propertyTitle, month, amount: totalToPay, cardNumber, expiry: cardExpiry, cvv: cardCvv });
    if (created.status === 'success') {
      setPaymentInfo('Paiement carte accepté (simulation).');
      addNotification({ category: 'payment', title: `Paiement carte réussi pour ${month}.` });
      generateReceiptPdf(created);
      markReceiptGenerated(created.id);
      simulateEmailReceipt(created);
    } else {
      setPaymentError('Paiement carte refusé (simulation). Vérifie les champs.');
      addNotification({ category: 'payment', title: `Paiement carte échoué pour ${month}.` });
    }
  };

  const handleConfirmSms = () => {
    if (!pendingMobileId) return;
    const result = confirmMobileMoneyPayment(pendingMobileId, smsCode);
    if (!result) { setPaymentError('Transaction introuvable.'); return; }
    if (result.status === 'success') {
      setPaymentInfo('Paiement Mobile Money réussi.');
      addNotification({ category: 'payment', title: `Paiement Mobile Money confirmé pour ${result.month}.` });
      generateReceiptPdf(result);
      markReceiptGenerated(result.id);
      simulateEmailReceipt(result);
    } else {
      setPaymentError('Code SMS invalide, paiement échoué.');
      addNotification({ category: 'payment', title: `Paiement Mobile Money échoué pour ${result.month}.` });
    }
    setPendingMobileId(null);
    setSmsCode('');
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
                      value={month} 
                      onChange={(e) => setMonth(e.target.value)} 
                      className="h-12 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 appearance-none cursor-pointer"
                    >
                      <option value="mars 2026">Mars 2026</option>
                      <option value="avril 2026">Avril 2026</option>
                      <option value="mai 2026">Mai 2026</option>
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
                  {(['mix', 'moov', 'tmoney', 'card'] as PaymentMethod[]).map((method) => {
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
                {(paymentMethod === 'mix' || paymentMethod === 'moov' || paymentMethod === 'tmoney') && (
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
    </div>
  );
}
