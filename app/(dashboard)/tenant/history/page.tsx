"use client";

import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PaymentRecord, PaymentStatus, usePayments } from '@/components/payments/PaymentProvider';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const tenantName = 'Kossi Mensah';
const propertyTitle = 'Appartement meublé à Bè';

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

export default function TenantHistoryPage() {
  const { addNotification } = useNotifications();
  const { payments, filterPayments, exportPaymentsCsv, exportPaymentsPdf, markReceiptGenerated, markReceiptEmailed } = usePayments();

  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');
  const [filterType, setFilterType] = useState<'all' | 'mobile_money' | 'card' | 'manual'>('all');

  const filteredHistory = useMemo(
    () =>
      filterPayments({ from: filterFrom || undefined, to: filterTo || undefined, status: filterStatus, channel: filterType })
        .filter((item) => item.tenantName === tenantName || item.propertyTitle === propertyTitle),
    [filterFrom, filterTo, filterStatus, filterType, filterPayments],
  );

  const latestPayment = useMemo(
    () => payments.filter((p) => p.tenantName === tenantName || p.propertyTitle === propertyTitle)[0] ?? null,
    [payments],
  );

  const simulateEmailReceipt = (record: PaymentRecord) => {
    markReceiptEmailed(record.id);
    addNotification({ category: 'message', title: `Reçu envoyé par email (simulation) pour ${record.reference}.` });
  };

  const handleReceiptAction = (item: PaymentRecord) => {
    generateReceiptPdf(item);
    markReceiptGenerated(item.id);
    simulateEmailReceipt(item);
  };

  const statusLabel = (status: string) => {
    if (status === 'success') return 'Réussi';
    if (status === 'failed') return 'Échoué';
    return 'En attente';
  };

  const statusClass = (status: string) =>
    status === 'success' ? 'bg-green-100 text-green-700' : status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-zinc-900">
          <FileText className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Historique des paiements</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportPaymentsCsv(filteredHistory)} className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">Export CSV</button>
          <button type="button" onClick={() => exportPaymentsPdf(filteredHistory, 'Historique paiements locataire')} className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">Export PDF</button>
        </div>
      </div>

      {/* Filtres */}
      <section className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900" />
        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | PaymentStatus)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
          <option value="all">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="success">Réussi</option>
          <option value="failed">Échoué</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'mobile_money' | 'card' | 'manual')} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
          <option value="all">Tous types</option>
          <option value="mobile_money">Mobile money</option>
          <option value="card">Carte</option>
          <option value="manual">Manuel</option>
        </select>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-2">
          {filteredHistory.length === 0 && <p className="text-sm text-zinc-500">Aucun paiement pour ces filtres.</p>}
          {filteredHistory.map((item) => (
            <article key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.reference} · {item.month}</p>
                  <p className="text-xs text-zinc-500">{item.propertyTitle} · {new Date(item.createdAt).toLocaleString('fr-TG')}</p>
                  <p className="text-sm text-zinc-700">{currencyFormatter.format(item.amount)} · {item.channel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                  {item.status === 'success' && (
                    <button
                      type="button"
                      onClick={() => handleReceiptAction(item)}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Reçu PDF + Email
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {latestPayment && latestPayment.status === 'success' && (
          <p className="mt-3 text-xs text-zinc-600">
            Dernier reçu: {latestPayment.receiptGenerated ? 'PDF généré' : 'PDF non généré'} · {latestPayment.receiptEmailed ? 'Email envoyé' : 'Email non envoyé'}
          </p>
        )}
      </section>
    </>
  );
}
