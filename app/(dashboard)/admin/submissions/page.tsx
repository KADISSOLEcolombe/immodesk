"use client";

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';

type SubmissionStatus = 'pending' | 'approved' | 'rejected';

type PropertySubmission = {
  id: string;
  title: string;
  ownerName: string;
  city: string;
  rentAmount: number;
  status: SubmissionStatus;
};

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const initialSubmissions: PropertySubmission[] = [
  { id: 's-1', title: 'Villa 5 pièces à Lomé 2', ownerName: 'Nora Agbeko', city: 'Lomé', rentAmount: 320000, status: 'pending' },
  { id: 's-2', title: 'Studio proche campus', ownerName: 'David Tetteh', city: 'Kara', rentAmount: 85000, status: 'pending' },
  { id: 's-3', title: 'Appartement T3 rénové', ownerName: 'Sena Kossi', city: 'Kpalimé', rentAmount: 130000, status: 'approved' },
];

const statusLabel: Record<SubmissionStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
};

const statusClass: Record<SubmissionStatus, string> = {
  pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminSubmissionsPage() {
  const { addNotification } = useNotifications();
  const [submissions, setSubmissions] = useState<PropertySubmission[]>(initialSubmissions);
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');

  const reviewSubmission = (id: string, status: SubmissionStatus) => {
    const target = submissions.find((s) => s.id === id);
    setSubmissions((current) =>
      current.map((s) => (s.id === id ? { ...s, status } : s)),
    );
    if (target) {
      addNotification({
        category: 'message',
        title: `Soumission ${status === 'approved' ? 'approuvée' : 'rejetée'} : ${target.title}.`,
      });
    }
  };

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter);

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Validation des soumissions</h1>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === f ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {f === 'all' ? 'Toutes' : statusLabel[f]} ({counts[f]})
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-3">
          {filtered.map((submission) => (
            <article key={submission.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-900">{submission.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Propriétaire: {submission.ownerName} · {submission.city}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">Loyer: {currencyFormatter.format(submission.rentAmount)}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[submission.status]}`}>
                  {statusLabel[submission.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => reviewSubmission(submission.id, 'approved')}
                  disabled={submission.status === 'approved'}
                  className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Approuver
                </button>
                <button
                  type="button"
                  onClick={() => reviewSubmission(submission.id, 'rejected')}
                  disabled={submission.status === 'rejected'}
                  className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Rejeter
                </button>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-zinc-500">Aucune soumission pour ce filtre.</p>
          )}
        </div>
      </section>
    </>
  );
}
