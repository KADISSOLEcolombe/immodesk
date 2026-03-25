"use client";

import { useMemo, useState, useEffect } from 'react';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { PaiementEnLigneService } from '@/lib/paiement-en-ligne-service';
import { ConfigSimulateur, Paiement, StatutPaiement } from '@/types/api';

type PaymentStatusUI = 'pending' | 'success' | 'failed' | 'refunded' | 'canceled';

type PaymentRecord = {
  id: string;
  reference: string;
  tenantName: string;
  propertyTitle: string;
  amount: number;
  month: string;
  channel: 'mobile_money' | 'card' | 'manual';
  status: PaymentStatusUI;
  createdAt: string;
};

type PaymentIssueStatus = 'open' | 'resolved';

type PaymentIssue = {
  id: string;
  tenantName: string;
  propertyTitle: string;
  amount: number;
  reason: string;
  status: PaymentIssueStatus;
};

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

// Map backend status to UI status
const mapBackendStatus = (statut: StatutPaiement): PaymentStatusUI => {
  const mapping: Record<StatutPaiement, PaymentStatusUI> = {
    'paye': 'success',
    'en_retard': 'pending',
    'impaye': 'failed',
  };
  return mapping[statut] || 'pending';
};

// Map UI status to backend status
const mapUIStatusToBackend = (status: PaymentStatusUI): StatutPaiement => {
  const mapping: Record<PaymentStatusUI, StatutPaiement> = {
    'success': 'paye',
    'pending': 'en_retard',
    'failed': 'impaye',
    'refunded': 'paye', // refunded is still 'paye' in backend
    'canceled': 'impaye', // canceled maps to 'impaye'
  };
  return mapping[status] || 'en_retard';
};

const mapStatusLabel = (status: PaymentStatusUI): string => {
  const labels: Record<PaymentStatusUI, string> = {
    pending: 'En retard',
    success: 'Paye',
    failed: 'Impaye',
    refunded: 'Rembourse',
    canceled: 'Annule',
  };

  return labels[status];
};

// Map backend source to UI channel
const mapBackendSource = (source: string): 'mobile_money' | 'card' | 'manual' => {
  if (source === 'manuel') return 'manual';
  if (source === 'carte_bancaire') return 'card';
  return 'mobile_money'; // mixx_by_yas, moov_money
};

// Transform backend Paiement to frontend PaymentRecord
const transformPaiement = (p: Paiement): PaymentRecord => ({
  id: p.id,
  reference: p.transaction_ref || p.id.slice(0, 8).toUpperCase(),
  tenantName: p.bail_detail?.locataire_nom || 'Locataire',
  propertyTitle: p.bail_detail?.bien_adresse || p.intitule || (p.bail ? `Bail ${p.bail.slice(0, 8)}` : 'Bien non renseigné'),
  amount: p.montant,
  month: new Date(p.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  channel: mapBackendSource(p.source_paiement),
  status: mapBackendStatus(p.statut),
  createdAt: p.created_at,
});

const initialPaymentIssues: PaymentIssue[] = [
  { id: 'p-1', tenantName: 'Afi Koutou', propertyTitle: 'Studio moderne proche université', amount: 75000, reason: 'Paiement non reçu après échéance', status: 'open' },
  { id: 'p-2', tenantName: 'Kossi Mensah', propertyTitle: 'Appartement meublé à Bè', amount: 180000, reason: 'Demande de correction montant charges', status: 'open' },
  { id: 'p-3', tenantName: 'Yao Napo', propertyTitle: 'T2 proche du marché', amount: 110000, reason: 'Litige clos', status: 'resolved' },
];

export default function AdminPaymentsPage() {
  const { addNotification } = useNotifications();

  // Data states
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });

  // Filter states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | PaymentStatusUI>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'mobile_money' | 'card' | 'manual'>('all');
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [nextStatusByPayment, setNextStatusByPayment] = useState<Record<string, PaymentStatusUI>>({});
  const [configs, setConfigs] = useState<ConfigSimulateur[]>([]);
  const [configsDraft, setConfigsDraft] = useState<Record<string, { taux_succes: number; delai_secondes: number }>>({});
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [isSavingConfigFor, setIsSavingConfigFor] = useState<string | null>(null);
  const [forceReference, setForceReference] = useState('');
  const [forceActionLoading, setForceActionLoading] = useState<'success' | 'failed' | null>(null);

  // Issues state (kept for UI compatibility)
  const [paymentIssues, setPaymentIssues] = useState<PaymentIssue[]>(initialPaymentIssues);
  const [activeTab, setActiveTab] = useState<'global' | 'simulateur' | 'issues' | 'audit'>('global');

  // Fetch payments from API
  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ComptabiliteService.getPaiements({
        statut: paymentStatusFilter === 'all' ? undefined : mapUIStatusToBackend(paymentStatusFilter),
      });
      if (response.success && response.data) {
        const transformed = response.data.map(transformPaiement);
        // Apply frontend filters
        let filtered = transformed;
        if (paymentTypeFilter !== 'all') {
          filtered = filtered.filter(p => p.channel === paymentTypeFilter);
        }
        setPayments(filtered);
        setNextStatusByPayment(
          filtered.reduce<Record<string, PaymentStatusUI>>((acc, payment) => {
            acc[payment.id] = payment.status;
            return acc;
          }, {}),
        );
        setPagination(response.pagination || {
          current_page: 1,
          total_pages: 1,
          total_count: transformed.length,
        });
      } else {
        setError(response.message || 'Erreur lors du chargement des paiements');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPayments();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchPayments();
  }, [paymentStatusFilter, paymentTypeFilter]);

  const fetchSimulateurConfig = async () => {
    setIsLoadingConfigs(true);
    try {
      const response = await PaiementEnLigneService.getConfigSimulateur();
      if (!response.success || !response.data) {
        addNotification({ type: 'alerte', titre: response.message || 'Impossible de charger la configuration simulateur', message: '' });
        return;
      }

      setConfigs(response.data);
      setConfigsDraft(
        response.data.reduce<Record<string, { taux_succes: number; delai_secondes: number }>>((acc, item) => {
          acc[item.moyen_paiement] = {
            taux_succes: Number(item.taux_succes),
            delai_secondes: Number(item.delai_secondes),
          };
          return acc;
        }, {}),
      );
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Erreur serveur simulateur', message: '' });
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'simulateur') {
      fetchSimulateurConfig();
    }
  }, [activeTab]);

  const intervenePayment = async (paymentId: string) => {
    const nextStatus = nextStatusByPayment[paymentId];
    if (!nextStatus) {
      return;
    }

    setUpdateLoading(paymentId);
    try {
      const response = await ComptabiliteService.updatePaiementStatut(paymentId, mapUIStatusToBackend(nextStatus));
      if (response.success) {
        addNotification({ type: 'paiement', titre: `Paiement ${paymentId} mis à jour: ${mapStatusLabel(nextStatus)}`, message: '' });
        // Update local state
        setPayments(prev => prev.map(p => 
          p.id === paymentId ? { ...p, status: nextStatus } : p
        ));
      } else {
        addNotification({ type: 'paiement', titre: `Erreur: ${response.message || 'Mise à jour échouée'}`, message: '' });
      }
    } catch (err) {
      addNotification({ type: 'paiement', titre: 'Erreur de connexion lors de la mise à jour', message: '' });
    } finally {
      setUpdateLoading(null);
    }
  };

  const resolvePaymentIssue = (id: string) => {
    const target = paymentIssues.find((i) => i.id === id);
    setPaymentIssues((c) => c.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)));
    if (target) addNotification({ type: 'paiement', titre: `Incident paiement résolu: ${target.propertyTitle}.`, message: '' });
  };

  const saveOneConfig = async (moyenPaiement: string) => {
    const draft = configsDraft[moyenPaiement];
    if (!draft) {
      return;
    }

    if (draft.taux_succes < 0 || draft.taux_succes > 100 || draft.delai_secondes < 0) {
      addNotification({ type: 'alerte', titre: 'Valeurs invalides', message: 'Le taux doit etre entre 0 et 100 et le delai >= 0.' });
      return;
    }

    setIsSavingConfigFor(moyenPaiement);
    try {
      const response = await PaiementEnLigneService.updateConfigSimulateur({
        moyen_paiement: moyenPaiement as 'mixx_by_yas' | 'moov_money' | 'carte_bancaire',
        taux_succes: draft.taux_succes,
        delai_secondes: draft.delai_secondes,
      });

      if (!response.success || !response.data) {
        addNotification({ type: 'alerte', titre: response.message || 'Echec mise a jour simulateur', message: '' });
        return;
      }

      setConfigs((current) =>
        current.map((item) =>
          item.moyen_paiement === response.data?.moyen_paiement
            ? { ...item, taux_succes: response.data.taux_succes, delai_secondes: response.data.delai_secondes }
            : item,
        ),
      );

      addNotification({ type: 'info', titre: `Configuration ${moyenPaiement} mise a jour`, message: '' });
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Erreur serveur', message: 'Impossible de sauvegarder la configuration.' });
    } finally {
      setIsSavingConfigFor(null);
    }
  };

  const forceTransaction = async (mode: 'success' | 'failed') => {
    const reference = forceReference.trim();
    if (!reference) {
      addNotification({ type: 'alerte', titre: 'Reference requise', message: 'Saisis une reference transaction.' });
      return;
    }

    setForceActionLoading(mode);
    try {
      const response = mode === 'success'
        ? await PaiementEnLigneService.forcerSucces(reference)
        : await PaiementEnLigneService.forcerEchec(reference);

      if (!response.success) {
        addNotification({ type: 'alerte', titre: response.message || 'Operation refusee', message: '' });
        return;
      }

      addNotification({
        type: 'paiement',
        titre: mode === 'success' ? 'Transaction forcee en succes' : 'Transaction forcee en echec',
        message: reference,
      });

      fetchPayments();
    } catch (err) {
      addNotification({ type: 'alerte', titre: 'Erreur serveur', message: 'Impossible de forcer la transaction.' });
    } finally {
      setForceActionLoading(null);
    }
  };

  // Export to CSV
  const exportPaymentsCsv = () => {
    const headers = ['ID', 'Référence', 'Locataire', 'Bien', 'Montant', 'Mois', 'Canal', 'Statut', 'Date'];
    const rows = payments.map(p => [
      p.id,
      p.reference,
      p.tenantName,
      p.propertyTitle,
      p.amount,
      p.month,
      p.channel,
      p.status,
      p.createdAt,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({ type: 'paiement', titre: 'Export CSV des paiements téléchargé.', message: '' });
  };

  const tabs = [
    { id: 'global', label: 'Vue globale' },
    { id: 'simulateur', label: 'Simulateur' },
    { id: 'issues', label: 'Incidents' },
    { id: 'audit', label: 'Audit log' },
  ] as const;

  // Filter payments locally for display
  const filteredPayments = useMemo(() => {
    return payments;
  }, [payments]);

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <CreditCard className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Gestion des paiements</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vue globale */}
      {activeTab === 'global' && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | PaymentStatusUI)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="success">Réussi</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
              <option value="canceled">Annulé</option>
            </select>
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value as 'all' | 'mobile_money' | 'card' | 'manual')}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="all">Tous canaux</option>
              <option value="mobile_money">Mobile money</option>
              <option value="card">Carte</option>
              <option value="manual">Manuel</option>
            </select>
            <button
              type="button"
              onClick={exportPaymentsCsv}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Export CSV
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <span className="ml-3 text-zinc-500">Chargement des paiements...</span>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={fetchPayments}
                className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-500">Aucun paiement trouvé</p>
            </div>
          )}

          {/* Payments list */}
          {!loading && !error && filteredPayments.length > 0 && (
            <div className="space-y-2">
              {filteredPayments.slice(0, 20).map((payment) => (
                <article key={payment.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{payment.reference} · {payment.tenantName}</p>
                      <p className="text-xs text-zinc-500">{payment.propertyTitle} · {payment.month}</p>
                      <p className="text-sm text-zinc-700">
                        {currencyFormatter.format(payment.amount)} · 
                        <span className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          payment.status === 'success' ? 'bg-green-100 text-green-700' :
                          payment.status === 'failed' || payment.status === 'canceled' ? 'bg-red-100 text-red-700' :
                          payment.status === 'refunded' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {payment.status === 'success' ? 'Payé' :
                           payment.status === 'failed' ? 'Échoué' :
                           payment.status === 'canceled' ? 'Annulé' :
                           payment.status === 'refunded' ? 'Remboursé' :
                           'En attente'}
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">({payment.channel})</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={nextStatusByPayment[payment.id] || payment.status}
                        onChange={(event) =>
                          setNextStatusByPayment((current) => ({
                            ...current,
                            [payment.id]: event.target.value as PaymentStatusUI,
                          }))
                        }
                        className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900"
                      >
                        <option value="success">Paye</option>
                        <option value="pending">En retard</option>
                        <option value="failed">Impaye</option>
                      </select>
                      <button
                        type="button"
                        disabled={updateLoading === payment.id}
                        onClick={() => intervenePayment(payment.id)}
                        className="inline-flex rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                      >
                        {updateLoading === payment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Appliquer statut'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination info */}
          {!loading && !error && filteredPayments.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
              <span>Affichage de {filteredPayments.length} sur {pagination.total_count} paiements</span>
              <span>Page {pagination.current_page} / {pagination.total_pages}</span>
            </div>
          )}
        </section>
      )}

      {activeTab === 'simulateur' && (
        <section className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Configuration du simulateur</h2>
            <p className="mt-1 text-sm text-zinc-500">Ajuste taux de succes et delai par moyen de paiement.</p>
          </div>

          {isLoadingConfigs ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => {
                const draft = configsDraft[config.moyen_paiement] || {
                  taux_succes: Number(config.taux_succes),
                  delai_secondes: Number(config.delai_secondes),
                };

                return (
                  <article key={config.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
                      <div>
                        <p className="text-xs text-zinc-500">Moyen</p>
                        <p className="text-sm font-medium text-zinc-900">{config.moyen_paiement}</p>
                      </div>
                      <label className="text-xs text-zinc-500">
                        Taux succes (%)
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.taux_succes}
                          onChange={(event) =>
                            setConfigsDraft((current) => ({
                              ...current,
                              [config.moyen_paiement]: {
                                ...draft,
                                taux_succes: Number(event.target.value),
                              },
                            }))
                          }
                          className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
                        />
                      </label>
                      <label className="text-xs text-zinc-500">
                        Delai (secondes)
                        <input
                          type="number"
                          min={0}
                          value={draft.delai_secondes}
                          onChange={(event) =>
                            setConfigsDraft((current) => ({
                              ...current,
                              [config.moyen_paiement]: {
                                ...draft,
                                delai_secondes: Number(event.target.value),
                              },
                            }))
                          }
                          className="mt-1 h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={isSavingConfigFor === config.moyen_paiement}
                        onClick={() => saveOneConfig(config.moyen_paiement)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                      >
                        {isSavingConfigFor === config.moyen_paiement ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sauvegarder'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">Statut simulateur: {config.actif ? 'Actif' : 'Desactive'}</p>
                  </article>
                );
              })}
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Forcer succes/echec</h3>
            <p className="mt-1 text-xs text-zinc-500">Action de debug sur transaction en_attente (reference exacte).</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={forceReference}
                onChange={(event) => setForceReference(event.target.value)}
                placeholder="Ex: IMD-2026-0001"
                className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
              />
              <button
                type="button"
                disabled={forceActionLoading !== null}
                onClick={() => forceTransaction('success')}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {forceActionLoading === 'success' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Forcer succes'}
              </button>
              <button
                type="button"
                disabled={forceActionLoading !== null}
                onClick={() => forceTransaction('failed')}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {forceActionLoading === 'failed' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Forcer echec'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Incidents */}
      {activeTab === 'issues' && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-3">
            {paymentIssues.map((issue) => (
              <article key={issue.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-zinc-900">{issue.propertyTitle}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${issue.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {issue.status === 'resolved' ? 'Résolu' : 'Ouvert'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">Locataire: {issue.tenantName}</p>
                <p className="text-sm text-zinc-700">Montant: {currencyFormatter.format(issue.amount)}</p>
                <p className="text-sm text-zinc-700">Motif: {issue.reason}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => resolvePaymentIssue(issue.id)}
                    disabled={issue.status === 'resolved'}
                    className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Marquer résolu
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Audit log - Simplified */}
      {activeTab === 'audit' && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">Les logs d'audit détaillés sont disponibles dans le backend.</p>
            <p className="text-sm text-zinc-500">Utilisez l'export CSV dans l'onglet "Vue globale" pour l'historique des paiements.</p>
          </div>
        </section>
      )}
    </>
  );
}
