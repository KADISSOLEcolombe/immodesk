"use client";

import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Mail,
  RefreshCcw,
  Search,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
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

type ChannelFilter = 'all' | 'mobile_money' | 'card' | 'manual';

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
  const [filterType, setFilterType] = useState<ChannelFilter>('all');
  const [query, setQuery] = useState('');

  const filteredHistory = useMemo(
    () =>
      filterPayments({ from: filterFrom || undefined, to: filterTo || undefined, status: filterStatus, channel: filterType })
        .filter((item) => item.tenantName === tenantName || item.propertyTitle === propertyTitle)
        .filter((item) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            item.reference.toLowerCase().includes(q) ||
            item.month.toLowerCase().includes(q) ||
            item.propertyTitle.toLowerCase().includes(q) ||
            item.channel.toLowerCase().includes(q) ||
            currencyFormatter.format(item.amount).toLowerCase().includes(q)
          );
        }),
    [filterFrom, filterTo, filterStatus, filterType, filterPayments, query],
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

  const statusMeta = (status: PaymentStatus) => {
    if (status === 'success') return { label: 'Réussi', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
    if (status === 'failed') return { label: 'Échoué', icon: XCircle, badge: 'bg-red-50 text-red-700 ring-red-200' };
    return { label: 'En attente', icon: Clock3, badge: 'bg-amber-50 text-amber-700 ring-amber-200' };
  };

  const channelMeta = (channel: string) => {
    const c = channel.toLowerCase();
    if (c.includes('mobile') || c.includes('flooz') || c.includes('moov') || c.includes('tmoney')) {
      return { label: channel.replaceAll('_', ' '), icon: Smartphone, badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' };
    }
    if (c.includes('card') || c.includes('carte')) {
      return { label: channel.replaceAll('_', ' '), icon: CreditCard, badge: 'bg-zinc-50 text-zinc-700 ring-zinc-200' };
    }
    return { label: channel.replaceAll('_', ' '), icon: ShieldCheck, badge: 'bg-sky-50 text-sky-700 ring-sky-200' };
  };

  const summary = useMemo(() => {
    const all = payments.filter((p) => p.tenantName === tenantName || p.propertyTitle === propertyTitle);
    const total = all.reduce((acc, p) => acc + p.amount, 0);
    const success = all.filter((p) => p.status === 'success');
    const pending = all.filter((p) => p.status === 'pending');
    const failed = all.filter((p) => p.status === 'failed');
    const last = all[0] ?? null;
    return { totalCount: all.length, totalAmount: total, successCount: success.length, pendingCount: pending.length, failedCount: failed.length, last };
  }, [payments]);

  const resetFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterStatus('all');
    setFilterType('all');
    setQuery('');
  };

  const hasActiveFilters = Boolean(filterFrom || filterTo || filterStatus !== 'all' || filterType !== 'all' || query.trim());

  return (
    <>
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 px-6 py-7 shadow-2xl shadow-zinc-900/15 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-100 ring-1 ring-white/15">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Historique
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Historique des paiements</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Retrouvez vos transactions, téléchargez vos reçus et exportez votre historique.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => exportPaymentsCsv(filteredHistory)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => exportPaymentsPdf(filteredHistory, 'Historique paiements locataire')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/15"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <div className="text-xs font-medium text-zinc-300">Total payé</div>
            <div className="mt-1 text-lg font-bold text-white">{currencyFormatter.format(summary.totalAmount)}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <div className="text-xs font-medium text-zinc-300">Transactions</div>
            <div className="mt-1 text-lg font-bold text-white">{summary.totalCount}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <div className="text-xs font-medium text-zinc-300">Réussis</div>
            <div className="mt-1 text-lg font-bold text-emerald-200">{summary.successCount}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <div className="text-xs font-medium text-zinc-300">En attente</div>
            <div className="mt-1 text-lg font-bold text-amber-200">{summary.pendingCount}</div>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <section className="mb-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            <label className="relative">
              <span className="sr-only">Du</span>
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Au</span>
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
              />
            </label>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | PaymentStatus)}
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="success">Réussi</option>
              <option value="failed">Échoué</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ChannelFilter)}
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
            >
              <option value="all">Tous types</option>
              <option value="mobile_money">Mobile money</option>
              <option value="card">Carte</option>
              <option value="manual">Manuel</option>
            </select>

            <label className="relative sm:col-span-2 lg:col-span-1">
              <span className="sr-only">Recherche</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Recherche (réf, mois, montant...)"
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-3 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 lg:justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/5"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-3 py-1 ring-1 ring-zinc-200">
              <span className="font-semibold text-zinc-900">{filteredHistory.length}</span> résultat{filteredHistory.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-zinc-50 to-white p-10 text-center ring-1 ring-zinc-100">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/15">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-zinc-900">Aucun paiement trouvé</h2>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              Essaie d’élargir la période, de modifier le statut, ou d’effacer les filtres.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const status = statusMeta(item.status);
              const channel = channelMeta(item.channel);
              const StatusIcon = status.icon;
              const ChannelIcon = channel.icon;

              return (
                <article
                  key={item.id}
                  className="group rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                          {item.reference}
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">{item.month}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {new Date(item.createdAt).toLocaleString('fr-TG')}
                        </span>
                        <span className="truncate">{item.propertyTitle}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-zinc-900">{currencyFormatter.format(item.amount)}</span>

                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${channel.badge}`}>
                          <ChannelIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {channel.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.badge}`}>
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {status.label}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.status === 'success' ? (
                          <button
                            type="button"
                            onClick={() => handleReceiptAction(item)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-lg shadow-zinc-900/15 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                          >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            Reçu PDF + Email
                          </button>
                        ) : (
                          <div className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-600">
                            <Clock3 className="h-4 w-4" aria-hidden="true" />
                            Reçu indisponible
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.status === 'success' && (item.receiptGenerated || item.receiptEmailed) && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      {item.receiptGenerated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                          PDF généré
                        </span>
                      )}
                      {item.receiptEmailed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700 ring-1 ring-sky-200">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          Email envoyé
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {latestPayment && latestPayment.status === 'success' && (
          <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-600">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-semibold text-zinc-900">Dernière activité</div>
              <div className="text-zinc-600">
                Dernier reçu: {latestPayment.receiptGenerated ? 'PDF généré' : 'PDF non généré'} ·{' '}
                {latestPayment.receiptEmailed ? 'Email envoyé' : 'Email non envoyé'}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
