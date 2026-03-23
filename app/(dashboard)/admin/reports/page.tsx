"use client";

import { useMemo, useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, Download } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { useReports } from '@/components/reports/ReportProvider';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { StatsService } from '@/lib/stats-service';
import { Paiement, Depense } from '@/types/api';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

type PaymentIssue = {
  propertyTitle: string;
  tenantName: string;
  reason: string;
  status: 'open' | 'resolved';
  amount: number;
};

// Map backend payment status to UI status
const mapPaymentStatus = (statut: string): string => {
  const mapping: Record<string, string> = {
    'paye': 'Payé',
    'en_retard': 'En retard',
    'impaye': 'Impayé',
  };
  return mapping[statut] || statut;
};

export default function AdminReportsPage() {
  const { addNotification } = useNotifications();
  const { archives, exportAdminGlobalReport, exportTableReport, emailArchiveItem } = useReports();

  // Data states
  const [payments, setPayments] = useState<Paiement[]>([]);
  const [expenses, setExpenses] = useState<Depense[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const adminArchives = useMemo(() => archives.filter((item) => item.role === 'admin'), [archives]);

  // Fetch data from APIs
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch payments
      const paymentsResponse = await ComptabiliteService.getPaiements();
      console.log('Payments response:', paymentsResponse);
      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data);
      } else {
        console.error('Payments error:', paymentsResponse.message);
      }

      // Fetch expenses
      const expensesResponse = await ComptabiliteService.getDepenses();
      console.log('Expenses response:', expensesResponse);
      if (expensesResponse.success && expensesResponse.data) {
        setExpenses(expensesResponse.data);
      } else {
        console.error('Expenses error:', expensesResponse.message);
      }

      // Fetch dashboard stats
      const statsResponse = await StatsService.getDashboard();
      console.log('Stats response:', statsResponse);
      if (statsResponse.success && statsResponse.data) {
        setStats({
          totalUsers: statsResponse.data.total_locataires + 1,
          totalProperties: statsResponse.data.total_biens,
          totalTenants: statsResponse.data.total_locataires,
          monthlyRevenue: statsResponse.data.revenus_mois,
          yearlyRevenue: statsResponse.data.revenus_annee,
          totalExpenses: statsResponse.data.depenses_mois,
          netProfit: statsResponse.data.benefice_net,
        });
      } else {
        console.error('Stats error:', statsResponse.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Erreur: ${err instanceof Error ? err.message : 'Connexion échouée'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats from real data
  const calculatedStats = useMemo(() => {
    const paidPayments = payments.filter(p => p.statut === 'paye');
    const totalCollected = paidPayments.reduce((sum, p) => sum + p.montant, 0);
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.montant, 0);
    const pendingPayments = payments.filter(p => p.statut === 'en_retard').length;
    const failedPayments = payments.filter(p => p.statut === 'impaye').length;

    return {
      totalCollected,
      totalExpenses: totalExpensesAmount,
      netProfit: totalCollected - totalExpensesAmount,
      pendingPayments,
      failedPayments,
      totalPayments: payments.length,
    };
  }, [payments, expenses]);

  // Generate payment issues from failed/pending payments
  const paymentIssues: PaymentIssue[] = useMemo(() => {
    return payments
      .filter(p => p.statut === 'impaye' || p.statut === 'en_retard')
      .slice(0, 5)
      .map((p, index) => ({
        propertyTitle: p.bail_detail?.bien_adresse || 'Bien inconnu',
        tenantName: p.bail_detail?.locataire_nom || 'Locataire inconnu',
        reason: p.statut === 'impaye' ? 'Paiement non reçu' : 'Paiement en retard',
        status: 'open' as const,
        amount: p.montant,
      }));
  }, [payments]);

  const exportAdminReport = () => {
    setExportLoading('admin');
    try {
      const created = exportAdminGlobalReport({
        generatedBy: 'super_admin',
        stats: [
          { label: 'Total biens', value: String(stats.totalProperties) },
          { label: 'Total locataires', value: String(stats.totalTenants) },
          { label: 'Paiements en attente', value: String(calculatedStats.pendingPayments) },
          { label: 'Paiements échoués', value: String(calculatedStats.failedPayments) },
          { label: 'Revenus totaux', value: currencyFormatter.format(calculatedStats.totalCollected) },
          { label: 'Dépenses totales', value: currencyFormatter.format(calculatedStats.totalExpenses) },
          { label: 'Bénéfice net', value: currencyFormatter.format(calculatedStats.netProfit) },
        ],
        incidents: paymentIssues.map((item) => ({
          label: item.propertyTitle,
          detail: `${item.tenantName} · ${item.reason}`,
          status: item.status,
        })),
        activities: payments.slice(0, 10).map((p) => ({
          user: p.bail_detail?.locataire_nom || 'Système',
          action: `Paiement ${mapPaymentStatus(p.statut)} · ${p.transaction_ref || p.id.slice(0, 8)}`,
          date: new Date(p.created_at).toLocaleString('fr-TG'),
        })),
      });
      addNotification({ type: 'info', titre: `Rapport admin généré (${created.fileName}).`, message: '' });
    } finally {
      setExportLoading(null);
    }
  };

  const exportUsersTable = () => {
    setExportLoading('users');
    try {
      exportTableReport({
        title: 'Tableau utilisateurs et statistiques',
        role: 'admin',
        generatedBy: 'super_admin',
        headers: ['Métrique', 'Valeur'],
        rows: [
          ['Total biens', String(stats.totalProperties)],
          ['Total locataires', String(stats.totalTenants)],
          ['Revenus mensuels', currencyFormatter.format(stats.monthlyRevenue)],
          ['Revenus annuels', currencyFormatter.format(stats.yearlyRevenue)],
          ['Bénéfice net', currencyFormatter.format(stats.netProfit)],
        ],
      });
      addNotification({ type: 'info', titre: 'Tableau statistiques exporté.', message: '' });
    } finally {
      setExportLoading(null);
    }
  };

  const exportPaymentsTable = () => {
    setExportLoading('payments');
    try {
      exportTableReport({
        title: 'Tableau paiements globaux',
        role: 'admin',
        generatedBy: 'super_admin',
        headers: ['Référence', 'Locataire', 'Bien', 'Date', 'Montant', 'Statut'],
        rows: payments.map((p) => [
          p.transaction_ref || p.id.slice(0, 8).toUpperCase(),
          p.bail_detail?.locataire_nom || '-',
          p.bail_detail?.bien_adresse || '-',
          new Date(p.date_paiement).toLocaleDateString('fr-FR'),
          currencyFormatter.format(p.montant),
          mapPaymentStatus(p.statut),
        ]),
      });
      addNotification({ type: 'info', titre: 'Tableau paiements exporté.', message: '' });
    } finally {
      setExportLoading(null);
    }
  };

  const exportFiscalCSV = async (annee: number) => {
    setExportLoading('fiscal');
    try {
      // Direct fetch for CSV download (returns file, not JSON)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/comptabilite/balance/export/2044/?annee=${annee}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_2044_${annee}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addNotification({ type: 'info', titre: `Export fiscal ${annee} téléchargé.`, message: '' });
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Erreur lors de l\'export fiscal.', message: '' });
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <FileText className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Rapports et Exports</h1>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mb-6 flex items-center justify-center rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="ml-3 text-sm text-zinc-500">Chargement des données...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Stats Overview */}
      {!loading && !error && (
        <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Vue d'ensemble</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Total biens</p>
              <p className="text-xl font-bold text-zinc-900">{stats.totalProperties}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Locataires</p>
              <p className="text-xl font-bold text-zinc-900">{stats.totalTenants}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Revenus annuels</p>
              <p className="text-xl font-bold text-zinc-900">{currencyFormatter.format(stats.yearlyRevenue)}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">Bénéfice net</p>
              <p className="text-xl font-bold text-zinc-900">{currencyFormatter.format(stats.netProfit)}</p>
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      {!loading && !error && (
        <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Générer des exports</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportAdminReport}
              disabled={exportLoading === 'admin'}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {exportLoading === 'admin' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rapport global admin'}
            </button>
            <button
              type="button"
              onClick={exportUsersTable}
              disabled={exportLoading === 'users'}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              {exportLoading === 'users' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tableau statistiques'}
            </button>
            <button
              type="button"
              onClick={exportPaymentsTable}
              disabled={exportLoading === 'payments'}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              {exportLoading === 'payments' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tableau paiements'}
            </button>
            <button
              type="button"
              onClick={() => exportFiscalCSV(new Date().getFullYear())}
              disabled={exportLoading === 'fiscal'}
              className="inline-flex h-10 items-center gap-2 justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportLoading === 'fiscal' ? <Loader2 className="h-4 w-4 animate-spin" /> : `Export fiscal ${new Date().getFullYear()}`}
            </button>
            {adminArchives[0] && (
              <button
                type="button"
                onClick={() => emailArchiveItem(adminArchives[0].id)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Envoyer dernier export
              </button>
            )}
          </div>
        </section>
      )}

      {/* Payment Issues */}
      {!loading && !error && paymentIssues.length > 0 && (
        <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Incidents de paiement ({paymentIssues.length})</h2>
          <div className="space-y-2">
            {paymentIssues.map((issue, index) => (
              <article key={index} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{issue.propertyTitle}</p>
                  <p className="text-xs text-zinc-500">{issue.tenantName} · {issue.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700">{currencyFormatter.format(issue.amount)}</span>
                  <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                    {issue.status === 'open' ? 'Ouvert' : 'Résolu'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Archives */}
      {!loading && !error && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Archives ({adminArchives.length})</h2>
          <div className="space-y-2">
            {adminArchives.length === 0 && <p className="text-sm text-zinc-500">Aucun rapport généré pour le moment.</p>}
            {adminArchives.slice(0, 10).map((item) => (
              <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                  <p className="text-xs text-zinc-500">{new Date(item.generatedAt).toLocaleString('fr-TG')} · {item.fileName}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.emailed ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  {item.emailed ? 'Email envoyé' : 'Non envoyé'}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
