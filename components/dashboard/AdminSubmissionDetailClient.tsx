"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, MapPin, User, X } from 'lucide-react';
import ProtectedMediaImage from '@/components/ProtectedMediaImage';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { getSubmissionPropertyInfo } from '@/lib/submission-utils';
import { SoumissionBien } from '@/types/api';

type SubmissionStatus = 'en_examen' | 'publie' | 'refuse';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

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

export default function AdminSubmissionDetailClient({ id }: { id: string }) {
  const { addNotification } = useNotifications();
  const [submission, setSubmission] = useState<SoumissionBien | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await PatrimoineService.getSoumission(id);
        if (!response.success || !response.data) {
          setError(response.message || 'Soumission introuvable.');
          return;
        }

        setSubmission(response.data);
      } catch (loadError) {
        console.error('Erreur detail soumission:', loadError);
        setError('Erreur serveur lors du chargement de la soumission.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmission();
  }, [id]);

  const info = useMemo(() => {
    if (!submission) {
      return null;
    }

    return getSubmissionPropertyInfo(submission.donnees_formulaire);
  }, [submission]);

  const refreshSubmission = async () => {
    const response = await PatrimoineService.getSoumission(id);
    if (response.success && response.data) {
      setSubmission(response.data);
    }
  };

  const approveSubmission = async () => {
    if (!submission) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await PatrimoineService.publierSoumission(submission.id);
      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: response.message || 'Erreur lors de la publication',
          message: '',
        });
        return;
      }

      addNotification({
        type: 'info',
        titre: 'Soumission approuvée et publiée',
        message: '',
      });
      await refreshSubmission();
    } catch (actionError) {
      console.error('Erreur publication soumission:', actionError);
      addNotification({
        type: 'alerte',
        titre: 'Erreur de connexion',
        message: '',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectSubmission = async () => {
    if (!submission || rejectReason.trim().length < 10) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await PatrimoineService.refuserSoumission(submission.id, rejectReason.trim());
      if (!response.success) {
        addNotification({
          type: 'alerte',
          titre: response.message || 'Erreur lors du refus',
          message: '',
        });
        return;
      }

      addNotification({
        type: 'info',
        titre: 'Soumission refusée',
        message: '',
      });
      setRejectReason('');
      await refreshSubmission();
    } catch (actionError) {
      console.error('Erreur refus soumission:', actionError);
      addNotification({
        type: 'alerte',
        titre: 'Erreur de connexion',
        message: '',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-600">Chargement de la soumission...</span>
      </div>
    );
  }

  if (error || !submission || !info) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error || 'Soumission introuvable.'}</p>
        <Link
          href="/admin/submissions"
          className="mt-4 inline-flex rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Retour aux soumissions
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Link
        href="/admin/submissions"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux soumissions
      </Link>

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Détails de la soumission</h1>
            <p className="mt-1 text-sm text-zinc-600">Soumise le {new Date(submission.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[submission.statut]}`}>
            {statusLabel[submission.statut]}
          </span>
        </div>
      </article>

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-zinc-900">Images du bien</h2>
        {info.photos.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
            Aucune image fournie pour cette soumission.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {info.photos.map((photo, index) => (
              <div key={`${submission.id}-photo-${index}`} className="group overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                <ProtectedMediaImage
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-zinc-900">Détails du bien</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Adresse</p>
            <p className="mt-1 text-sm text-zinc-900">{info.adresse}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Type</p>
            <p className="mt-1 text-sm text-zinc-900">{info.type}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Loyer HC</p>
            <p className="mt-1 text-sm text-zinc-900">{currencyFormatter.format(info.loyer)}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Charges</p>
            <p className="mt-1 text-sm text-zinc-900">{currencyFormatter.format(info.charges)}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Surface / Pièces</p>
            <p className="mt-1 text-sm text-zinc-900">{info.surface || '-'} m² · {info.pieces || '-'} pièce(s)</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Propriétaire</p>
            <p className="mt-1 text-sm text-zinc-900 inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {submission.proprietaire_email || submission.proprietaire}
            </p>
          </div>
          {info.standing ? (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-xs font-medium uppercase text-zinc-500">Standing</p>
              <p className="mt-1 text-sm text-zinc-900">{info.standing}</p>
            </div>
          ) : null}
          {info.categorie ? (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-xs font-medium uppercase text-zinc-500">Catégorie</p>
              <p className="mt-1 text-sm text-zinc-900">{info.categorie}</p>
            </div>
          ) : null}
        </div>

        {info.description ? (
          <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Description</p>
            <p className="mt-1 text-sm text-zinc-700">{info.description}</p>
          </div>
        ) : null}

        {submission.statut === 'refuse' && submission.justification_refus ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-xs font-medium uppercase text-red-600">Motif du refus</p>
            <p className="mt-1 text-sm text-red-700">{submission.justification_refus}</p>
          </div>
        ) : null}
      </article>

      {(info.equipements.length > 0 || info.accessibilite.length > 0 || info.espacesExterieurs.length > 0 || info.mapsLink) && (
        <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-zinc-900">Informations complémentaires</h2>

          {info.equipements.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-900">Équipements</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {info.equipements.map((item, idx) => (
                  <span key={idx} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{item}</span>
                ))}
              </div>
            </div>
          ) : null}

          {info.accessibilite.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-900">Accessibilité</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {info.accessibilite.map((item, idx) => (
                  <span key={idx} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{item}</span>
                ))}
              </div>
            </div>
          ) : null}

          {info.espacesExterieurs.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-900">Espaces extérieurs</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {info.espacesExterieurs.map((item, idx) => (
                  <span key={idx} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{item}</span>
                ))}
              </div>
            </div>
          ) : null}

          {info.mapsLink ? (
            <a
              href={info.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Ouvrir la localisation Google Maps
            </a>
          ) : null}
        </article>
      )}

      {submission.statut === 'en_examen' ? (
        <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-zinc-900">Décision admin</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <button
              type="button"
              onClick={approveSubmission}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approuver et publier
            </button>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Motif du refus (minimum 10 caractères)..."
                className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-red-400"
                rows={3}
              />
              <button
                type="button"
                onClick={rejectSubmission}
                disabled={isProcessing || rejectReason.trim().length < 10}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Refuser la soumission
              </button>
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}
