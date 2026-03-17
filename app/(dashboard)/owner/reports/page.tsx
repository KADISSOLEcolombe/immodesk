"use client";

import { useMemo, useState } from 'react';
import { FileUp } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { usePayments } from '@/components/payments/PaymentProvider';
import { useReports } from '@/components/reports/ReportProvider';

export default function OwnerReportsPage() {
  const { addNotification } = useNotifications();
  const { filterPayments } = usePayments();
  const { archives, exportOwnerPeriodicReport, exportTableReport, emailArchiveItem } = useReports();

  const [reportPeriod, setReportPeriod] = useState('mars 2026');

  const ownerPayments = useMemo(() => filterPayments({ status: 'all', channel: 'all' }), [filterPayments]);
  const ownerArchives = useMemo(() => archives.filter((item) => item.role === 'owner'), [archives]);

  const exportOwnerReport = () => {
    const rows = ownerPayments.map((item) => ({
      reference: item.reference,
      date: new Date(item.createdAt).toLocaleDateString('fr-TG'),
      property: item.propertyTitle,
      tenant: item.tenantName,
      month: item.month,
      amount: item.amount,
      status: item.status,
    }));

    const created = exportOwnerPeriodicReport({
      periodLabel: reportPeriod,
      ownerName: 'Nora Agbeko',
      generatedBy: 'owner_dashboard',
      payments: rows,
    });

    addNotification({ category: 'message', title: `Rapport propriétaire généré (${created.fileName}).` });
  };

  const exportPropertiesTable = () => {
    exportTableReport({
      title: 'Tableau biens propriétaire',
      role: 'owner',
      generatedBy: 'owner_dashboard',
      headers: ['Bien', 'Adresse', 'Locataire', 'Statut loyer'],
      rows: [
        ['Appartement meublé à Bè', 'Avenue de la Libération, Lomé', 'Kossi Mensah', 'paid'],
        ['Studio moderne proche université', 'Quartier Kpota, Kara', 'Afi Koutou', 'late'],
        ['T2 proche du marché', 'Quartier Nyivé, Kpalimé', 'Aucun', 'pending'],
        ['Immeuble en cours de rénovation', 'Route nationale N°1, Tsévié', 'Aucun', 'pending'],
      ],
    });
    addNotification({ category: 'message', title: 'Tableau biens exporté.' });
  };

  const exportPaymentsTable = () => {
    exportTableReport({
      title: 'Tableau paiements récents propriétaire',
      role: 'owner',
      generatedBy: 'owner_dashboard',
      headers: ['Bien', 'Locataire', 'Montant', 'Date', 'Statut'],
      rows: ownerPayments.slice(0, 10).map((item) => [item.propertyTitle, item.tenantName, String(item.amount), item.month, item.status]),
    });
    addNotification({ category: 'message', title: 'Tableau paiements exporté.' });
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <FileUp className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Rapports PDF</h1>
      </div>

      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Générer des exports</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          >
            <option value="mars 2026">mars 2026</option>
            <option value="avril 2026">avril 2026</option>
            <option value="année 2026">année 2026</option>
          </select>
          <button type="button" onClick={exportOwnerReport} className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
            Rapport période
          </button>
          <button type="button" onClick={exportPropertiesTable} className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
            Tableau biens
          </button>
          <button type="button" onClick={exportPaymentsTable} className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
            Tableau paiements
          </button>
          <button
            type="button"
            onClick={() => ownerArchives[0] && emailArchiveItem(ownerArchives[0].id)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Envoyer dernier export (email)
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Archives ({ownerArchives.length})</h2>
        <div className="space-y-2">
          {ownerArchives.length === 0 && <p className="text-sm text-zinc-500">Aucun rapport généré pour le moment.</p>}
          {ownerArchives.slice(0, 8).map((item) => (
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
