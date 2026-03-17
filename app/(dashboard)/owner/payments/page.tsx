"use client";

import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { usePayments } from '@/components/payments/PaymentProvider';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const staticPayments = [
  { id: 'pay-1', propertyTitle: 'Appartement meublé à Bè', tenantName: 'Kossi Mensah', amount: 180000, date: '05 mars 2026', status: 'received' as const },
  { id: 'pay-2', propertyTitle: 'Studio moderne proche université', tenantName: 'Afi Koutou', amount: 75000, date: '02 mars 2026', status: 'late' as const },
];

export default function OwnerPaymentsPage() {
  const { addNotification } = useNotifications();
  const { filterPayments, updatePaymentStatus, getOwnerBalance } = usePayments();

  const ownerPayments = useMemo(() => filterPayments({ status: 'all', channel: 'all' }), [filterPayments]);
  const manualPending = useMemo(() => ownerPayments.filter((p) => p.channel === 'manual' && p.status === 'pending'), [ownerPayments]);
  const ownerCollections = useMemo(() => ownerPayments.filter((p) => p.status === 'success'), [ownerPayments]);
  const ownerNetBalance = useMemo(() => getOwnerBalance(), [getOwnerBalance]);

  const confirmManualPayment = (paymentId: string) => {
    updatePaymentStatus(paymentId, 'success');
    addNotification({ category: 'payment', title: `Paiement manuel confirmé (${paymentId}).` });
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <CreditCard className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Paiements & loyers</h1>
      </div>

      {/* Résumé */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Solde net propriétaire</h2>
        <p className="text-3xl font-bold text-zinc-900">{currencyFormatter.format(ownerNetBalance)}</p>
      </section>

      {/* Paiements récents (statiques) */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Paiements récents</h2>
        <div className="space-y-3">
          {staticPayments.map((payment) => (
            <article key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{payment.propertyTitle}</p>
                <p className="text-xs text-zinc-500">{payment.tenantName}</p>
                <p className="mt-1 text-sm text-zinc-700">{currencyFormatter.format(payment.amount)} · {payment.date}</p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {payment.status === 'received' ? 'Perçu' : 'En retard'}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* Paiements manuels à confirmer */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Paiements manuels à confirmer</h2>
        <div className="space-y-2">
          {manualPending.length === 0 && <p className="text-sm text-zinc-500">Aucun paiement manuel en attente.</p>}
          {manualPending.map((item) => (
            <article key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-sm font-medium text-zinc-900">{item.propertyTitle} · {item.tenantName}</p>
              <p className="text-xs text-zinc-500">{currencyFormatter.format(item.amount)} · {item.month}</p>
              <button
                type="button"
                onClick={() => confirmManualPayment(item.id)}
                className="mt-2 inline-flex rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Confirmer
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Encaissements plateforme */}
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Encaissements (plateforme)</h2>
        <div className="space-y-1">
          {ownerCollections.length === 0 && <p className="text-sm text-zinc-500">Aucun encaissement enregistré.</p>}
          {ownerCollections.slice(0, 8).map((item) => (
            <p key={item.id} className="text-sm text-zinc-700">
              {item.reference} · {item.propertyTitle} · {currencyFormatter.format(item.amount)}
            </p>
          ))}
        </div>
      </section>
    </>
  );
}
