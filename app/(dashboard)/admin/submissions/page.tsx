"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, Eye, X, Loader2, Home, MapPin, Euro, User } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { SoumissionBien, DonneesFormulaireSoumission } from '@/types/api';

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

// Helper to extract property info from donnees_formulaire
function getPropertyInfo(data: DonneesFormulaireSoumission) {
  return {
    adresse: data.adresse || 'Adresse non spécifiée',
    type: data.type_logement || 'Type non spécifié',
    loyer: data.loyer_hc || 0,
    charges: data.charges || 0,
    surface: data.surface_m2 || 0,
    pieces: data.nb_pieces || 0,
    description: data.description || '',
    equipements: data.equipements || [],
    photos: data.photos || [],
  };
}

export default function AdminSubmissionsPage() {
  const { addNotification } = useNotifications();
  const [submissions, setSubmissions] = useState<SoumissionBien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<SoumissionBien | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleOpenDetail = (submission: SoumissionBien) => {
    setSelectedSubmission(submission);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      const response = await PatrimoineService.publierSoumission(id);
      if (response.success) {
        addNotification({
          category: 'success',
          title: 'Soumission approuvée et publiée avec succès',
        });
        await loadSubmissions();
        handleCloseDetail();
      } else {
        addNotification({
          category: 'error',
          title: response.message || 'Erreur lors de la publication',
        });
      }
    } catch (err) {
      addNotification({
        category: 'error',
        title: 'Erreur de connexion',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedSubmission || !rejectReason.trim()) return;

    setIsProcessing(true);
    try {
      const response = await PatrimoineService.refuserSoumission(selectedSubmission.id, rejectReason);
      if (response.success) {
        addNotification({
          category: 'success',
          title: 'Soumission refusée',
        });
        setIsRejectModalOpen(false);
        setRejectReason('');
        await loadSubmissions();
        handleCloseDetail();
      } else {
        addNotification({
          category: 'error',
          title: response.message || 'Erreur lors du refus',
        });
      }
    } catch (err) {
      addNotification({
        category: 'error',
        title: 'Erreur de connexion',
      });
    } finally {
      setIsProcessing(false);
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
            const info = getPropertyInfo(submission.donnees_formulaire);
            return (
              <article key={submission.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">{info.adresse}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Propriétaire: {submission.proprietaire_email || submission.proprietaire} · {info.type}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                      Loyer: {currencyFormatter.format(info.loyer)} / Charges: {currencyFormatter.format(info.charges)}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[submission.statut]}`}>
                    {statusLabel[submission.statut]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(submission)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Voir détails
                  </button>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Aucune soumission pour ce filtre.</p>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">Détails de la soumission</h2>
              <button
                onClick={handleCloseDetail}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const info = getPropertyInfo(selectedSubmission.donnees_formulaire);
                return (
                  <div className="space-y-6">
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusClass[selectedSubmission.statut]}`}>
                        {statusLabel[selectedSubmission.statut]}
                      </span>
                      <span className="text-sm text-zinc-500">
                        Soumis le {new Date(selectedSubmission.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Property info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Home className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase">Type</span>
                        </div>
                        <p className="mt-1 font-medium text-zinc-900">{info.type}</p>
                      </div>

                      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <MapPin className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase">Surface</span>
                        </div>
                        <p className="mt-1 font-medium text-zinc-900">{info.surface} m² · {info.pieces} pièce(s)</p>
                      </div>

                      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Euro className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase">Loyer HC</span>
                        </div>
                        <p className="mt-1 font-medium text-zinc-900">{currencyFormatter.format(info.loyer)}</p>
                      </div>

                      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Euro className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase">Charges</span>
                        </div>
                        <p className="mt-1 font-medium text-zinc-900">{currencyFormatter.format(info.charges)}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900">Adresse</h3>
                      <p className="mt-1 text-sm text-zinc-600">{info.adresse}</p>
                    </div>

                    {/* Description */}
                    {info.description && (
                      <div>
                        <h3 className="text-sm font-medium text-zinc-900">Description</h3>
                        <p className="mt-1 text-sm text-zinc-600">{info.description}</p>
                      </div>
                    )}

                    {/* Equipements */}
                    {info.equipements.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-zinc-900">Équipements</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {info.equipements.map((eq, idx) => (
                            <span key={idx} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Owner info */}
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <User className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase">Propriétaire</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-700">{selectedSubmission.proprietaire_email || selectedSubmission.proprietaire}</p>
                    </div>

                    {/* Rejection reason if refused */}
                    {selectedSubmission.statut === 'refuse' && selectedSubmission.justification_refus && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <h3 className="text-sm font-medium text-red-900">Motif du refus</h3>
                        <p className="mt-1 text-sm text-red-700">{selectedSubmission.justification_refus}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            {selectedSubmission.statut === 'en_examen' && (
              <div className="sticky bottom-0 border-t border-zinc-100 bg-white px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleOpenReject}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Refuser
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedSubmission.id)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approuver et publier
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Refuser la soumission</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Veuillez indiquer le motif du refus. Cette information sera communiquée au propriétaire.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus (minimum 10 caractères)..."
              className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              rows={4}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing || rejectReason.trim().length < 10}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
