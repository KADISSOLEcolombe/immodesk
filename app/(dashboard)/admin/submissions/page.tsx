"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CheckCircle2, Eye, Loader2 } from 'lucide-react';
import ProtectedMediaImage from '@/components/ProtectedMediaImage';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { getSubmissionPropertyInfo } from '@/lib/submission-utils';
import { SoumissionBien } from '@/types/api';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

type SubmissionStatus = 'en_examen' | 'publie' | 'refuse';

const statusLabel: Record<SubmissionStatus, string> = {
  en_examen: 'En examen',
  publie: 'Publié',
  refuse: 'Refusé',
};

const statusClass: Record<SubmissionStatus, string> = {
  en_examen: 'bg-orange-100 text-orange-700',
  publie: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-700',
};

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SoumissionBien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');

  // Fetch submissions on mount
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await PatrimoineService.getSoumissions();
      if (response.success && response.data) {
        setSubmissions(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement des soumissions');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = filter === 'all' 
    ? submissions 
    : submissions.filter((s) => s.statut === filter);

  const counts = {
    all: submissions.length,
    en_examen: submissions.filter((s) => s.statut === 'en_examen').length,
    publie: submissions.filter((s) => s.statut === 'publie').length,
    refuse: submissions.filter((s) => s.statut === 'refuse').length,
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-600">Chargement des soumissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadSubmissions}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Validation des soumissions</h1>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'en_examen', 'publie', 'refuse'] as const).map((f) => (
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
          {filtered.map((submission) => {
            const info = getSubmissionPropertyInfo(submission.donnees_formulaire);
            return (
              <article key={submission.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
                  <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                    <ProtectedMediaImage
                      src={info.photos[0] || '/window.svg'}
                      alt={info.adresse}
                      className="h-28 w-full object-cover"
                    />
                    <p className="border-t border-zinc-100 px-2 py-1 text-[11px] text-zinc-500">
                      {info.photos.length} image(s)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">{info.adresse}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Propriétaire: {submission.proprietaire_email || submission.proprietaire} · {info.type}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                      Loyer: {currencyFormatter.format(info.loyer)} / Charges: {currencyFormatter.format(info.charges)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Surface: {info.surface || '-'} m² · Pièces: {info.pieces || '-'}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[submission.statut]}`}>
                    {statusLabel[submission.statut]}
                  </span>
                </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/submissions/${submission.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Voir détails complets
                  </Link>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Aucune soumission pour ce filtre.</p>
          )}
        </div>
      </section>

    </>
  );
}
