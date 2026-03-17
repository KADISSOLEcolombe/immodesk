"use client";

import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { usePayments } from '@/components/payments/PaymentProvider';
import { useReports } from '@/components/reports/ReportProvider';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const paymentIssuesSummary = [
  { propertyTitle: 'Studio moderne proche université', tenantName: 'Afi Koutou', reason: 'Paiement non reçu après échéance', status: 'open' as const, amount: 75000 },
  { propertyTitle: 'Appartement meublé à Bè', tenantName: 'Kossi Mensah', reason: 'Correction montant charges', status: 'open' as const, amount: 180000 },
  { propertyTitle: 'T2 proche du marché', tenantName: 'Yao Napo', reason: 'Litige clos', status: 'resolved' as const, amount: 110000 },
];

export default function AdminReportsPage() {
  const { addNotification } = useNotifications();
  const { filterPayments, getNetAmount, interventions } = usePayments();
  const { archives, exportAdminGlobalReport, exportTableReport, emailArchiveItem } = useReports();

  const adminArchives = useMemo(() => archives.filter((item) => item.role === 'admin'), [archives]);
  const globalPayments = useMemo(() => filterPayments({ status: 'all', channel: 'all' }), [filterPayments]);

  const stats = useMemo(() => {
    const refundedTotal = globalPayments.reduce((sum, item) => sum + item.refundedAmount, 0);
    const netCollected = globalPayments.reduce((sum, item) => sum + getNetAmount(item), 0);
    const monthlyVolume = paymentIssuesSummary.reduce((sum, item) => sum + item.amount, 0);
    return { totalUsers: 4, pendingSubmissions: 2, openPaymentIssues: 2, monthlyVolume, refundedTotal, netCollected };
  }, [globalPayments, getNetAmount]);

  const exportAdminReport = () => {
    const created = exportAdminGlobalReport({
      generatedBy: 'super_admin',
      stats: [
        { label: 'Utilisateurs totaux', value: String(stats.totalUsers) },
        { label: 'Soumissions en attente', value: String(stats.pendingSubmissions) },
        { label: 'Paiements ouverts', value: String(stats.openPaymentIssues) },
        { label: 'Volume monitoré', value: currencyFormatter.format(stats.monthlyVolume) },
        { label: 'Total remboursé', value: currencyFormatter.format(stats.refundedTotal) },
        { label: 'Total net collecté', value: currencyFormatter.format(stats.netCollected) },
      ],
      incidents: paymentIssuesSummary.map((item) => ({
        label: item.propertyTitle,
        detail: `${item.tenantName} · ${item.reason}`,
        status: item.status,
      })),
      activities: interventions.slice(0, 12).map((item) => ({
        user: item.actor,
        action: `${item.type} · ${item.paymentReference}`,
        date: new Date(item.createdAt).toLocaleString('fr-TG'),
      })),
    });

    addNotification({ category: 'message', title: `Rapport admin généré (${created.fileName}).` });
  };

  const exportUsersTable = () => {
    exportTableReport({
      title: 'Tableau utilisateurs',
      role: 'admin',
      generatedBy: 'super_admin',
      headers: ['Nom', 'Email', 'Rôle', 'Statut'],
      rows: [
        ['Afi Koutou', 'afi@immodesk.tg', 'tenant', 'Actif'],
        ['Kossi Mensah', 'kossi@immodesk.tg', 'tenant', 'Actif'],
        ['Nora Agbeko', 'nora@immodesk.tg', 'owner', 'Actif'],
        ['Admin Central', 'admin@immodesk.tg', 'admin', 'Actif'],
      ],
    });
    addNotification({ category: 'message', title: 'Tableau utilisateurs exporté.' });
  };

  const exportPaymentsTable = () => {
    exportTableReport({
      title: 'Tableau paiements globaux',
      role: 'admin',
      generatedBy: 'super_admin',
      headers: ['Référence', 'Locataire', 'Bien', 'Mois', 'Montant', 'Statut'],
      rows: globalPayments.map((item) => [item.reference, item.tenantName, item.propertyTitle, item.month, String(item.amount), item.status]),
    });
    addNotification({ category: 'message', title: 'Tableau paiements exporté.' });
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <FileText className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Rapports PDF</h1>
      </div>

      {/* Actions */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Générer des exports</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportAdminReport}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Rapport global admin
          </button>
          <button
            type="button"
            onClick={exportUsersTable}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Tableau utilisateurs
          </button>
          <button
            type="button"
            onClick={exportPaymentsTable}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Tableau paiements
          </button>
          <button
            type="button"
            onClick={() => adminArchives[0] && emailArchiveItem(adminArchives[0].id)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Envoyer dernier export (email)
          </button>
        </div>
      </section>

      {/* Archives */}
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
    </>
  );
}
