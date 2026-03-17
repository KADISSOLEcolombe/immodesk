"use client";

import { useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PaymentStatus, usePayments } from '@/components/payments/PaymentProvider';

type PendingAdminAction = { paymentId: string; type: 'cancel_24h' | 'partial_refund' } | null;

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

const initialPaymentIssues: PaymentIssue[] = [
  { id: 'p-1', tenantName: 'Afi Koutou', propertyTitle: 'Studio moderne proche université', amount: 75000, reason: 'Paiement non reçu après échéance', status: 'open' },
  { id: 'p-2', tenantName: 'Kossi Mensah', propertyTitle: 'Appartement meublé à Bè', amount: 180000, reason: 'Demande de correction montant charges', status: 'open' },
  { id: 'p-3', tenantName: 'Yao Napo', propertyTitle: 'T2 proche du marché', amount: 110000, reason: 'Litige clos', status: 'resolved' },
];

export default function AdminPaymentsPage() {
  const { addNotification } = useNotifications();
  const {
    filterPayments,
    updatePaymentStatus,
    cancelPaymentWithin24h,
    partialRefundPayment,
    isCancelableWithin24h,
    getNetAmount,
    interventions,
    exportInterventionsCsv,
    exportInterventionsPdf,
  } = usePayments();

  const [paymentIssues, setPaymentIssues] = useState<PaymentIssue[]>(initialPaymentIssues);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'mobile_money' | 'card' | 'manual'>('all');
  const [refundReason, setRefundReason] = useState<Record<string, string>>({});
  const [partialAmount, setPartialAmount] = useState<Record<string, string>>({});
  const [refundFeedback, setRefundFeedback] = useState('');
  const [pendingAdminAction, setPendingAdminAction] = useState<PendingAdminAction>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'issues' | 'audit'>('global');

  const globalPayments = useMemo(
    () => filterPayments({ status: paymentStatusFilter, channel: paymentTypeFilter }),
    [filterPayments, paymentStatusFilter, paymentTypeFilter],
  );

  const intervenePayment = (paymentId: string, nextStatus: PaymentStatus) => {
    updatePaymentStatus(paymentId, nextStatus);
    addNotification({ category: 'payment', title: `Intervention admin: ${paymentId} -> ${nextStatus}.` });
  };

  const handleCancel24h = (paymentId: string) => {
    const reason = refundReason[paymentId]?.trim() || 'Annulation administrative <24h';
    const result = cancelPaymentWithin24h(paymentId, reason, 'super_admin');
    setRefundFeedback(result.message);
    if (result.ok) addNotification({ category: 'payment', title: `Annulation 24h effectuée (${paymentId}).` });
  };

  const handlePartialRefund = (paymentId: string) => {
    const reason = refundReason[paymentId]?.trim() || 'Régularisation';
    const amount = Number(partialAmount[paymentId] || '0');
    const result = partialRefundPayment(paymentId, amount, reason, 'super_admin');
    setRefundFeedback(result.message);
    if (result.ok) {
      addNotification({ category: 'payment', title: `Remboursement partiel appliqué (${paymentId}).` });
      setPartialAmount((c) => ({ ...c, [paymentId]: '' }));
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAdminAction) return;
    if (pendingAdminAction.type === 'cancel_24h') handleCancel24h(pendingAdminAction.paymentId);
    else handlePartialRefund(pendingAdminAction.paymentId);
    setPendingAdminAction(null);
  };

  const resolvePaymentIssue = (id: string) => {
    const target = paymentIssues.find((i) => i.id === id);
    setPaymentIssues((c) => c.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)));
    if (target) addNotification({ category: 'payment', title: `Incident paiement résolu: ${target.propertyTitle}.` });
  };

  const tabs = [
    { id: 'global', label: 'Vue globale' },
    { id: 'issues', label: 'Incidents' },
    { id: 'audit', label: 'Audit log' },
  ] as const;

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
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | PaymentStatus)}
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
          </div>

          <div className="space-y-2">
            {globalPayments.slice(0, 10).map((payment) => (
              <article key={payment.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{payment.reference} · {payment.tenantName}</p>
                    <p className="text-xs text-zinc-500">{payment.propertyTitle} · {payment.month}</p>
                    <p className="text-sm text-zinc-700">{payment.channel} · {payment.amount} FCFA · {payment.status} · net {getNetAmount(payment)} FCFA</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => intervenePayment(payment.id, 'success')} className="inline-flex rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
                      Forcer réussi
                    </button>
                    <button type="button" onClick={() => intervenePayment(payment.id, 'failed')} className="inline-flex rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
                      Forcer échec
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    value={refundReason[payment.id] || ''}
                    onChange={(e) => setRefundReason((c) => ({ ...c, [payment.id]: e.target.value }))}
                    placeholder="Justification"
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900"
                  />
                  <input
                    type="number"
                    min={0}
                    value={partialAmount[payment.id] || ''}
                    onChange={(e) => setPartialAmount((c) => ({ ...c, [payment.id]: e.target.value }))}
                    placeholder="Montant partiel"
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!isCancelableWithin24h(payment)}
                      onClick={() => setPendingAdminAction({ paymentId: payment.id, type: 'cancel_24h' })}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Annuler &lt;24h
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAdminAction({ paymentId: payment.id, type: 'partial_refund' })}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Remb. partiel
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {refundFeedback && <p className="mt-3 text-sm font-medium text-zinc-700">{refundFeedback}</p>}
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
                  <button type="button" className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
                    Initier remboursement
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Audit log */}
      {activeTab === 'audit' && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => exportInterventionsCsv(interventions)} className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">Export CSV</button>
            <button type="button" onClick={() => exportInterventionsPdf(interventions, 'Audit remboursements et interventions')} className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">Export PDF</button>
          </div>
          <div className="space-y-2">
            {interventions.length === 0 && <p className="text-sm text-zinc-500">Aucune intervention enregistrée.</p>}
            {interventions.slice(0, 12).map((item) => (
              <article key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-900">{item.type} · {item.paymentReference}</p>
                <p className="text-xs text-zinc-500">Par {item.actor} le {new Date(item.createdAt).toLocaleString('fr-TG')}</p>
                <p className="text-sm text-zinc-700">Motif: {item.reason}</p>
                <p className="text-sm text-zinc-700">Montant impacté: {currencyFormatter.format(item.amount)}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Confirmation modal */}
      {pendingAdminAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">Confirmer l&apos;intervention</h3>
            <p className="mt-2 text-sm text-zinc-600">
              {pendingAdminAction.type === 'cancel_24h'
                ? "Tu es sur le point d'annuler ce paiement (fenêtre 24h)."
                : "Tu es sur le point d'appliquer un remboursement partiel."}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Justification: {refundReason[pendingAdminAction.paymentId]?.trim() || 'Aucune justification saisie'}
            </p>
            {pendingAdminAction.type === 'partial_refund' && (
              <p className="mt-1 text-xs text-zinc-500">Montant: {partialAmount[pendingAdminAction.paymentId] || '0'} FCFA</p>
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setPendingAdminAction(null)} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                Annuler
              </button>
              <button type="button" onClick={confirmPendingAction} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
