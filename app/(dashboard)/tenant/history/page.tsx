"use client";

import { useMemo, useState, useEffect } from 'react';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PaiementEnLigneService } from '@/lib/paiement-en-ligne-service';
import { TransactionPaiement, StatutTransaction, MoyenPaiement } from '@/types/api';
import { formatCurrency } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

// Types UI (basés sur le PaymentProvider existant)
type PaymentStatusUI = 'pending' | 'success' | 'failed' | 'refunded' | 'canceled';
type PaymentChannelUI = 'mobile_money' | 'card' | 'manual';
type MobileOperator = 'mix' | 'moov' | 'tmoney';

interface PaymentRecordUI {
  id: string;
  tenantName: string;
  propertyTitle: string;
  month: string;
  amount: number;
  channel: PaymentChannelUI;
  operator?: MobileOperator;
  phone?: string;
  cardLast4?: string;
  status: PaymentStatusUI;
  source: 'auto' | 'manual';
  createdAt: string;
  reference: string;
  refundedAmount: number;
  receiptGenerated: boolean;
  receiptEmailed: boolean;
}

// Mapping des statuts backend vers UI
const mapStatutToUI = (statut: StatutTransaction): PaymentStatusUI => {
  switch (statut) {
    case 'valide': return 'success';
    case 'echoue': return 'failed';
    case 'en_attente': return 'pending';
    case 'annule': return 'canceled';
    default: return 'pending';
  }
};

// Mapping des moyens de paiement vers canaux UI
const mapMoyenPaiementToUI = (moyen: MoyenPaiement): { channel: PaymentChannelUI; operator?: MobileOperator } => {
  switch (moyen) {
    case 'moov_money': return { channel: 'mobile_money', operator: 'moov' };
    case 'mixx_by_yas': return { channel: 'mobile_money', operator: 'mix' };
    case 'carte_bancaire': return { channel: 'card' };
    default: return { channel: 'manual' };
  }
};

// Mapper TransactionPaiement (backend) vers PaymentRecordUI
const mapTransactionToUI = (transaction: TransactionPaiement): PaymentRecordUI => {
  const { channel, operator } = mapMoyenPaiementToUI(transaction.moyen_paiement);
  const date = new Date(transaction.mois_concerne);
  const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  
  return {
    id: transaction.id,
    tenantName: '', // Sera rempli si nécessaire depuis le bail
    propertyTitle: '', // Sera rempli si nécessaire depuis le bail
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    amount: transaction.montant,
    channel,
    operator,
    phone: transaction.numero_telephone || undefined,
    cardLast4: transaction.derniers_chiffres_carte || undefined,
    status: mapStatutToUI(transaction.statut),
    source: 'auto',
    createdAt: transaction.date_initiation,
    reference: transaction.reference,
    refundedAmount: 0, // Non géré actuellement par le backend
    receiptGenerated: transaction.statut === 'valide',
    receiptEmailed: false,
  };
};

type ChannelFilter = 'all' | PaymentChannelUI;

const generateReceiptPdf = (record: PaymentRecordUI) => {
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
  
  // États pour les données API
  const [payments, setPayments] = useState<PaymentRecordUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatusUI>('all');
  const [filterType, setFilterType] = useState<ChannelFilter>('all');
  const [query, setQuery] = useState('');

  // Charger l'historique depuis le backend
  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await PaiementEnLigneService.getHistoriqueTransactions();
      if (response.success && response.data) {
        const mappedPayments = response.data.map(mapTransactionToUI);
        setPayments(mappedPayments);
      } else {
        setError(response.message || 'Erreur lors du chargement de l\'historique');
      }
    } catch (err) {
      setError('Erreur technique lors du chargement des paiements');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    const fromTs = filterFrom ? new Date(filterFrom).getTime() : null;
    const toTs = filterTo ? new Date(filterTo).getTime() : null;
    
    return payments.filter((item) => {
      const itemTs = new Date(item.createdAt).getTime();
      const matchesFrom = fromTs === null || itemTs >= fromTs;
      const matchesTo = toTs === null || itemTs <= toTs;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesChannel = filterType === 'all' || item.channel === filterType;
      
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || (
        item.reference.toLowerCase().includes(q) ||
        item.month.toLowerCase().includes(q) ||
        item.channel.toLowerCase().includes(q) ||
        currencyFormatter.format(item.amount).toLowerCase().includes(q)
      );
      
      return matchesFrom && matchesTo && matchesStatus && matchesChannel && matchesQuery;
    });
  }, [payments, filterFrom, filterTo, filterStatus, filterType, query]);

  const latestPayment = useMemo(() => payments[0] ?? null, [payments]);

  const handleReceiptAction = (item: PaymentRecordUI) => {
    generateReceiptPdf(item);
    addNotification({ 
      type: 'info', 
      titre: 'Reçu généré', 
      message: `Le reçu pour ${item.reference} a été téléchargé.` 
    });
  };

  const statusMeta = (status: PaymentStatusUI) => {
    if (status === 'success') return { label: 'Réussi', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
    if (status === 'failed') return { label: 'Échoué', icon: XCircle, badge: 'bg-red-50 text-red-700 ring-red-200' };
    if (status === 'canceled') return { label: 'Annulé', icon: XCircle, badge: 'bg-gray-50 text-gray-700 ring-gray-200' };
    return { label: 'En attente', icon: Clock3, badge: 'bg-amber-50 text-amber-700 ring-amber-200' };
  };

  const channelMeta = (channel: PaymentChannelUI) => {
    if (channel === 'mobile_money') {
      return { label: 'Mobile Money', icon: Smartphone, badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' };
    }
    if (channel === 'card') {
      return { label: 'Carte Bancaire', icon: CreditCard, badge: 'bg-zinc-50 text-zinc-700 ring-zinc-200' };
    }
    return { label: 'Manuel', icon: ShieldCheck, badge: 'bg-sky-50 text-sky-700 ring-sky-200' };
  };

  const summary = useMemo(() => {
    const total = payments.reduce((acc, p) => acc + p.amount, 0);
    const success = payments.filter((p) => p.status === 'success');
    const pending = payments.filter((p) => p.status === 'pending');
    const failed = payments.filter((p) => p.status === 'failed');
    const last = payments[0] ?? null;
    return { 
      totalCount: payments.length, 
      totalAmount: total, 
      successCount: success.length, 
      pendingCount: pending.length, 
      failedCount: failed.length, 
      last 
    };
  }, [payments]);

  const resetFilters = () => {
    setFilterFrom('');
    setFilterTo('');
    setFilterStatus('all');
    setFilterType('all');
    setQuery('');
  };

  const hasActiveFilters = Boolean(filterFrom || filterTo || filterStatus !== 'all' || filterType !== 'all' || query.trim());

  // Export CSV
  const exportPaymentsCsv = (records: PaymentRecordUI[]) => {
    const header = ['Reference', 'Date', 'Mois', 'Montant', 'Canal', 'Statut'];
    const rows = records.map((item) => [
      item.reference,
      new Date(item.createdAt).toLocaleString('fr-TG'),
      item.month,
      String(item.amount),
      item.channel,
      item.status,
    ]);

    const csvContent = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paiements-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportPaymentsPdf = (records: PaymentRecordUI[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ImmoDesk Togo', 14, 18);
    doc.setFontSize(12);
    doc.text(title, 14, 26);

    let y = 36;
    records.slice(0, 20).forEach((item) => {
      doc.setFontSize(10);
      doc.text(`${item.reference} | ${new Date(item.createdAt).toLocaleString('fr-TG')}`, 14, y);
      y += 6;
      doc.text(`${item.month} | ${item.channel} | ${item.status} | ${item.amount} FCFA`, 14, y);
      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`paiements-${Date.now()}.pdf`);
  };

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
              onChange={(e) => setFilterStatus(e.target.value as 'all' | PaymentStatusUI)}
              className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="success">Réussi</option>
              <option value="failed">Échoué</option>
              <option value="canceled">Annulé</option>
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-500">Chargement de l'historique...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="mt-4 text-sm text-red-600">{error}</p>
            <button
              onClick={loadPaymentHistory}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white"
            >
              <RefreshCcw className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
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
