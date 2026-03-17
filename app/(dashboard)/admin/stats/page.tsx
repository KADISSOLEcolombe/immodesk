"use client";

import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';

type UserRole = 'tenant' | 'owner' | 'admin';
type SubmissionStatus = 'pending' | 'approved' | 'rejected';
type PaymentIssueStatus = 'open' | 'resolved';

const initialUsers = [
  { id: 'u-1', role: 'tenant' as UserRole, active: true },
  { id: 'u-2', role: 'tenant' as UserRole, active: true },
  { id: 'u-3', role: 'owner' as UserRole, active: true },
  { id: 'u-4', role: 'admin' as UserRole, active: true },
];

const initialSubmissions = [
  { id: 's-1', status: 'pending' as SubmissionStatus },
  { id: 's-2', status: 'pending' as SubmissionStatus },
  { id: 's-3', status: 'approved' as SubmissionStatus },
];

const initialPaymentIssues = [
  { id: 'p-1', amount: 75000, status: 'open' as PaymentIssueStatus },
  { id: 'p-2', amount: 180000, status: 'open' as PaymentIssueStatus },
  { id: 'p-3', amount: 110000, status: 'resolved' as PaymentIssueStatus },
];

export default function AdminStatsPage() {
  const [users] = useState(initialUsers);
  const [submissions] = useState(initialSubmissions);
  const [paymentIssues] = useState(initialPaymentIssues);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.active).length,
    byRole: {
      tenant: users.filter((u) => u.role === 'tenant').length,
      owner: users.filter((u) => u.role === 'owner').length,
      admin: users.filter((u) => u.role === 'admin').length,
    },
    submissions: {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === 'pending').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
    },
    paymentIssues: {
      total: paymentIssues.length,
      open: paymentIssues.filter((p) => p.status === 'open').length,
      resolved: paymentIssues.filter((p) => p.status === 'resolved').length,
      volume: paymentIssues.reduce((sum, p) => sum + p.amount, 0),
    },
  }), [users, submissions, paymentIssues]);

  const currencyFormatter = new Intl.NumberFormat('fr-TG', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

  const statCards = [
    { label: 'Utilisateurs totaux', value: stats.totalUsers, sub: `Actifs: ${stats.activeUsers}` },
    { label: 'Comptes locataires', value: stats.byRole.tenant },
    { label: 'Comptes propriétaires', value: stats.byRole.owner },
    { label: 'Comptes admin', value: stats.byRole.admin },
    { label: 'Soumissions totales', value: stats.submissions.total, sub: `En attente: ${stats.submissions.pending}` },
    { label: 'Soumissions validées', value: stats.submissions.approved },
    { label: 'Soumissions rejetées', value: stats.submissions.rejected },
    { label: 'Incidents ouverts', value: stats.paymentIssues.open, highlight: true },
    { label: 'Incidents résolus', value: stats.paymentIssues.resolved },
    { label: 'Volume incidents (FCFA)', value: currencyFormatter.format(stats.paymentIssues.volume) },
  ];

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <BarChart3 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Statistiques globales</h1>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.highlight ? 'text-orange-700' : 'text-zinc-900'}`}>
              {card.value}
            </p>
            {card.sub && <p className="mt-0.5 text-xs text-zinc-500">{card.sub}</p>}
          </article>
        ))}
      </section>
    </>
  );
}
