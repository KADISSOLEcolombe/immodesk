"use client";

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
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
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <CreditCard className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Payer mon loyer</h1>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Mois
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400">
              <option value="mars 2026">mars 2026</option>
              <option value="avril 2026">avril 2026</option>
              <option value="mai 2026">mai 2026</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" checked={includeCharges} onChange={(e) => setIncludeCharges(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
            Inclure les charges ({currencyFormatter.format(charges)})
          </label>

          <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
            Total: <strong className="text-zinc-900">{currencyFormatter.format(totalToPay)}</strong>
          </p>

          <fieldset className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
            <legend className="px-1 text-sm font-medium text-zinc-700">Canal de paiement</legend>
            {(['mix', 'moov', 'tmoney', 'card'] as PaymentMethod[]).map((method) => (
              <label key={method} className="flex items-center gap-2 text-sm text-zinc-600">
                <input type="radio" name="paymentMethod" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="h-4 w-4 border-zinc-300" />
                {method === 'mix' ? 'Mobile Money (Mix)' : method === 'moov' ? 'Mobile Money (Moov)' : method === 'tmoney' ? 'Mobile Money (Tmoney)' : 'Carte bancaire'}
              </label>
            ))}
          </fieldset>

          {(paymentMethod === 'mix' || paymentMethod === 'moov' || paymentMethod === 'tmoney') && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Numéro de téléphone
              <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="90 00 00 00" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>
          )}

          {paymentMethod === 'card' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
                Numéro carte
                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Expiration
                <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="12/28" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                CVV
                <input type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
            </div>
          )}

          <button type="button" onClick={handlePay} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
            Payer maintenant
          </button>

          {pendingMobileId && (
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Code SMS (simulé — utilise 1234)
                <input type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="1234" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
              <button type="button" onClick={handleConfirmSms} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                Confirmer le code SMS
              </button>
            </div>
          )}

          {paymentInfo && <p className="text-sm font-medium text-green-700">{paymentInfo}</p>}
          {paymentError && <p className="text-sm font-medium text-orange-700">{paymentError}</p>}
        </div>
      </section>
    </>
  );
}
