"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CheckCircle2, Eye, Loader2, X } from 'lucide-react';
import ProtectedMediaImage from '@/components/ProtectedMediaImage';
import { useNotifications } from '@/components/notifications/NotificationProvider';
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
  const { addNotification } = useNotifications();
  const [submissions, setSubmissions] = useState<SoumissionBien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [rejectingSubmissionId, setRejectingSubmissionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const updateSubmissionStatus = (submissionId: string, statut: SubmissionStatus, justification_refus = '') => {
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submissionId
          ? {
              ...item,
              statut,
              justification_refus: justification_refus || item.justification_refus,
            }
          : item,
      ),
    );
  };

  const handlePublish = async (submission: SoumissionBien) => {
    setIsProcessingId(submission.id);
    try {
      const response = await PatrimoineService.publierSoumission(submission.id);
      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: response.message || 'Publication impossible',
          message: '',
        });
        return;
      }

      updateSubmissionStatus(submission.id, 'publie');
      addNotification({
        type: 'info',
        titre: 'Soumission publiée',
        message: '',
      });
    } catch (actionError) {
      console.error('Erreur publication soumission:', actionError);
      addNotification({
        type: 'alerte',
        titre: 'Erreur de connexion',
        message: '',
      });
    } finally {
      setIsProcessingId(null);
    }
  };

  const openRejectModal = (submissionId: string) => {
    setRejectingSubmissionId(submissionId);
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectingSubmissionId(null);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectingSubmissionId || rejectReason.trim().length < 10) {
      return;
    }

    setIsProcessingId(rejectingSubmissionId);
    try {
      const response = await PatrimoineService.refuserSoumission(rejectingSubmissionId, rejectReason.trim());
      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: response.message || 'Refus impossible',
          message: '',
        });
        return;
      }

      updateSubmissionStatus(rejectingSubmissionId, 'refuse', rejectReason.trim());
      addNotification({
        type: 'info',
        titre: 'Soumission refusée',
        message: '',
      });
      closeRejectModal();
    } catch (actionError) {
      console.error('Erreur refus soumission:', actionError);
      addNotification({
        type: 'alerte',
        titre: 'Erreur de connexion',
        message: '',
      });
    } finally {
      setIsProcessingId(null);
    }
  };

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

                  {submission.statut === 'en_examen' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePublish(submission)}
                        disabled={isProcessingId === submission.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
                      >
                        {isProcessingId === submission.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Publier
                      </button>
                      <button
                        type="button"
                        onClick={() => openRejectModal(submission.id)}
                        disabled={isProcessingId === submission.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        <X className="h-3.5 w-3.5" />
                        Refuser
                      </button>
                    </>
                  )}
                </div>

                {submission.statut === 'refuse' && submission.justification_refus ? (
                  <p className="mt-2 text-xs text-red-700">Motif: {submission.justification_refus}</p>
                ) : null}
              </article>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Aucune soumission pour ce filtre.</p>
          )}
        </div>
      </section>

      {rejectingSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-black/5 bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-base font-semibold text-zinc-900">Refuser la soumission</h2>
            <p className="mt-1 text-sm text-zinc-600">Saisissez un motif de refus (minimum 10 caractères).</p>

            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              placeholder="Motif du refus..."
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRejectModal}
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessingId === rejectingSubmissionId || rejectReason.trim().length < 10}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isProcessingId === rejectingSubmissionId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
