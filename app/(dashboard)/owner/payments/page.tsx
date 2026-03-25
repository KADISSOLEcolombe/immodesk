"use client";

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { PaiementEnLigneService } from '@/lib/paiement-en-ligne-service';
import { LocationsService } from '@/lib/locations-service';
import { Paiement, Balance, Bail, TransactionPaiement } from '@/types/api';
import { formatCurrency } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

// Mapping statut backend comptabilité vers UI
const mapComptaStatutToUI = (statut: string): 'received' | 'pending' | 'late' => {
  switch (statut) {
    case 'paye':
      return 'received';
    case 'en_retard':
      return 'pending';
    case 'impaye':
      return 'late';
    default:
      return 'pending';
  }
};

const mapTransactionStatutToUI = (statut: TransactionPaiement['statut']): 'received' | 'pending' | 'late' => {
  switch (statut) {
    case 'valide':
      return 'received';
    case 'en_attente':
      return 'pending';
    case 'echoue':
    case 'annule':
      return 'late';
    default:
      return 'pending';
  }
};

const transactionStatusLabel = (statut: TransactionPaiement['statut']) => {
  switch (statut) {
    case 'valide':
      return 'Validé';
    case 'en_attente':
      return 'En attente';
    case 'echoue':
      return 'Échoué';
    case 'annule':
      return 'Annulé';
    default:
      return 'Inconnu';
  }
};

const moyenPaiementLabel = (moyen: TransactionPaiement['moyen_paiement']) => {
  switch (moyen) {
    case 'mixx_by_yas':
      return 'Mixx by Yas';
    case 'moov_money':
      return 'Moov Money';
    case 'carte_bancaire':
      return 'Carte bancaire';
    default:
      return moyen;
  }
};

type BailOwnerView = Bail & {
  locataire_nom?: string;
  bien_adresse?: string;
};

interface PaymentUI {
  id: string;
  propertyTitle: string;
  tenantName: string;
  amount: number;
  date: string;
  status: 'received' | 'pending' | 'late';
  reference?: string;
  channel: 'online' | 'manual';
}

const mapPaiementToUI = (paiement: Paiement): PaymentUI => ({
  id: paiement.id,
  propertyTitle: paiement.bail_detail?.bien_adresse || 'Bien inconnu',
  tenantName: paiement.bail_detail?.locataire_nom || 'Locataire inconnu',
  amount: paiement.montant,
  date: new Date(paiement.date_paiement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
  status: mapComptaStatutToUI(paiement.statut),
  reference: paiement.transaction_ref,
  channel: paiement.source_paiement === 'manuel' ? 'manual' : 'online',
});

interface OwnerTransactionUI {
  id: string;
  reference: string;
  bailId: string;
  propertyTitle: string;
  tenantName: string;
  amount: number;
  month: string;
  method: string;
  status: TransactionPaiement['statut'];
  initiatedAt: string;
  message?: string;
}

export default function OwnerPaymentsPage() {
  const { addNotification } = useNotifications();
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [onlineTransactions, setOnlineTransactions] = useState<OwnerTransactionUI[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingReference, setRefreshingReference] = useState<string | null>(null);
  const [baux, setBaux] = useState<BailOwnerView[]>([]);
  const [bauxLoading, setBauxLoading] = useState(false);
  const [bauxActionId, setBauxActionId] = useState<string | null>(null);

  // Charger les paiements comptables, transactions en ligne et la balance
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Définir les dates par défaut (début et fin du mois courant)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const defaultDebut = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const defaultFin = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      // Charger comptabilité, balance et baux du propriétaire en parallèle
      const [paiementsResponse, balanceResponse, bauxResponse] = await Promise.all([
        ComptabiliteService.getPaiements({ page_size: 100 }),
        ComptabiliteService.getBalanceGlobale({
          periode_debut: defaultDebut,
          periode_fin: defaultFin,
        }),
        LocationsService.getBaux({ actif: true }),
      ]);

      if (paiementsResponse.success && paiementsResponse.data) {
        const mappedPayments = paiementsResponse.data.map(mapPaiementToUI);
        setPayments(mappedPayments);
      }

      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      }

      const bauxList = ((bauxResponse.data || []) as BailOwnerView[]);
      setBaux(bauxList);
      if (bauxList.length > 0) {
        const results = await Promise.allSettled(
          bauxList.map(async (bail) => {
            const transactionResponse = await PaiementEnLigneService.getHistoriqueParBail(bail.id);
            if (!transactionResponse.success || !transactionResponse.data) {
              return [] as OwnerTransactionUI[];
            }
            return transactionResponse.data.map((tx) => ({
              id: tx.id,
              reference: tx.reference,
              bailId: bail.id,
              propertyTitle: bail.bien_adresse || 'Bien inconnu',
              tenantName: bail.locataire_nom || 'Locataire inconnu',
              amount: tx.montant,
              month: new Date(tx.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
              method: moyenPaiementLabel(tx.moyen_paiement),
              status: tx.statut,
              initiatedAt: tx.date_initiation,
              message: tx.message_retour,
            }));
          })
        );
        const merged = results
          .filter((result): result is PromiseFulfilledResult<OwnerTransactionUI[]> => result.status === 'fulfilled')
          .flatMap((result) => result.value)
          .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());
        setOnlineTransactions(merged);
      } else {
        setOnlineTransactions([]);
      }
      // Actions réviser/terminer bail
      const handleReviserBail = async (bailId: string) => {
        setBauxActionId(bailId);
        try {
          const response = await LocationsService.reviserBail(bailId);
          if (!response.success) {
            addNotification({
              type: 'bail',
              titre: 'Révision échouée',
              message: response.message || 'Impossible de réviser le bail.',
            });
            return;
          }
          addNotification({
            type: 'bail',
            titre: 'Bail révisé',
            message: 'Le bail a été révisé avec succès.',
          });
          // Refresh baux
          loadData();
        } catch (err) {
          addNotification({
            type: 'bail',
            titre: 'Erreur technique',
            message: 'Erreur lors de la révision du bail.',
          });
        } finally {
          setBauxActionId(null);
        }
      };

      const handleTerminerBail = async (bailId: string) => {
        setBauxActionId(bailId);
        try {
          const response = await LocationsService.terminerBail(bailId);
          if (!response.success) {
            addNotification({
              type: 'bail',
              titre: 'Fin échouée',
              message: response.message || 'Impossible de terminer le bail.',
            });
            return;
          }
          addNotification({
            type: 'bail',
            titre: 'Bail terminé',
            message: 'Le bail a été terminé avec succès.',
          });
          // Refresh baux
          loadData();
        } catch (err) {
          addNotification({
            type: 'bail',
            titre: 'Erreur technique',
            message: 'Erreur lors de la terminaison du bail.',
          });
        } finally {
          setBauxActionId(null);
        }
      };
          {/* Section Mes baux propriétaire */}
          <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">Mes baux actifs</h2>
            {bauxLoading || isLoading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <p className="mt-2 text-sm text-zinc-500">Chargement des baux...</p>
              </div>
            ) : baux.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun bail actif.</p>
            ) : (
              <div className="space-y-3">
                {baux.map((bail) => (
                  <article key={bail.id} className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{bail.bien_adresse || 'Bien inconnu'} · {bail.locataire_nom || 'Locataire inconnu'}</p>
                      <p className="text-xs text-zinc-500">Début: {bail.date_debut} · Fin: {bail.date_fin}</p>
                      <p className="text-xs text-zinc-500">Loyer: {currencyFormatter.format(bail.loyer_mensuel)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={bauxActionId === bail.id}
                        onClick={() => handleReviserBail(bail.id)}
                        className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
                      >
                        {bauxActionId === bail.id ? 'Révision...' : 'Réviser'}
                      </button>
                      <button
                        type="button"
                        disabled={bauxActionId === bail.id}
                        onClick={() => handleTerminerBail(bail.id)}
                        className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {bauxActionId === bail.id ? 'Fin...' : 'Terminer'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des paiements');
    } finally {
      setIsLoading(false);
    }
  };

  const ownerNetBalance = useMemo(() => {
    return balance?.benefice_net_global || 0;
  }, [balance]);

  const recentPayments = useMemo(() => {
    return payments.slice(0, 5); // 5 derniers paiements
  }, [payments]);

  const manualPending = useMemo(() => {
    return payments.filter((p) => p.channel === 'manual' && (p.status === 'pending' || p.status === 'late'));
  }, [payments]);

  const ownerCollections = useMemo(() => {
    return onlineTransactions.filter((t) => t.status === 'valide');
  }, [onlineTransactions]);

  const onlinePendingCount = useMemo(() => {
    return onlineTransactions.filter((t) => t.status === 'en_attente').length;
  }, [onlineTransactions]);

  const refreshTransactionStatus = async (reference: string) => {
    try {
      setRefreshingReference(reference);
      const response = await PaiementEnLigneService.getStatutTransaction(reference);
      if (!response.success || !response.data) {
        addNotification({
          type: 'paiement',
          titre: 'Statut non mis à jour',
          message: response.message || 'Impossible de récupérer le statut de la transaction.',
        });
        return;
      }

      const transactionData = response.data;

      setOnlineTransactions((current) =>
        current.map((item) =>
          item.reference === reference
            ? {
                ...item,
                status: transactionData.statut,
                message: transactionData.message_retour,
              }
            : item
        )
      );

      addNotification({
        type: 'paiement',
        titre: `Transaction ${reference}`,
        message: `Statut actuel: ${transactionStatusLabel(transactionData.statut)}.`,
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut transaction:', err);
      addNotification({
        type: 'paiement',
        titre: 'Erreur réseau',
        message: 'Impossible de mettre à jour le statut de la transaction.',
      });
    } finally {
      setRefreshingReference(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <CreditCard className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Paiements & loyers</h1>
      </div>

      {/* Résumé */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-600">Solde net propriétaire</h2>
          {isLoading ? (
            <div className="mt-3 flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              <span className="text-zinc-500">Chargement...</span>
            </div>
          ) : error ? (
            <p className="mt-3 text-red-600">{error}</p>
          ) : (
            <p className="mt-3 text-2xl font-bold text-zinc-900">{currencyFormatter.format(ownerNetBalance)}</p>
          )}
        </article>

        <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-600">Transactions en ligne</h2>
          <p className="mt-3 text-2xl font-bold text-zinc-900">{onlineTransactions.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Toutes références confondues</p>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-600">En attente plateforme</h2>
          <p className="mt-3 text-2xl font-bold text-orange-700">{onlinePendingCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Transactions à suivre</p>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-600">Paiements manuels non soldés</h2>
          <p className="mt-3 text-2xl font-bold text-zinc-900">{manualPending.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Retard/impayé manuel</p>
        </article>
      </section>

      {/* Paiements récents */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Paiements comptables récents</h2>
        {isLoading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500">Chargement...</p>
          </div>
        ) : recentPayments.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun paiement récent.</p>
        ) : (
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <article key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{payment.propertyTitle}</p>
                  <p className="text-xs text-zinc-500">{payment.tenantName}</p>
                  <p className="mt-1 text-sm text-zinc-700">{currencyFormatter.format(payment.amount)} · {payment.date} · {payment.channel === 'manual' ? 'Manuel' : 'En ligne'}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === 'received' ? 'bg-green-100 text-green-700' : payment.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                  {payment.status === 'received' ? 'Perçu' : payment.status === 'pending' ? 'En attente' : 'En retard'}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Transactions en ligne côté propriétaire */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Transactions en ligne (par bail)</h2>
        {isLoading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500">Chargement des transactions...</p>
          </div>
        ) : onlineTransactions.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune transaction en ligne disponible.</p>
        ) : (
          <div className="space-y-3">
            {onlineTransactions.slice(0, 12).map((tx) => {
              const uiStatus = mapTransactionStatutToUI(tx.status);
              return (
                <article key={tx.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{tx.reference} · {tx.tenantName}</p>
                      <p className="text-xs text-zinc-500">{tx.propertyTitle} · {tx.month}</p>
                      <p className="mt-1 text-sm text-zinc-700">{currencyFormatter.format(tx.amount)} · {tx.method}</p>
                      {tx.message && <p className="mt-1 text-xs text-zinc-500">{tx.message}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${uiStatus === 'received' ? 'bg-green-100 text-green-700' : uiStatus === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {transactionStatusLabel(tx.status)}
                      </span>
                      <button
                        type="button"
                        disabled={refreshingReference === tx.reference}
                        onClick={() => refreshTransactionStatus(tx.reference)}
                        className="inline-flex rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
                      >
                        {refreshingReference === tx.reference ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Actualisation
                          </>
                        ) : (
                          'Rafraîchir statut'
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Paiements manuels à confirmer */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Paiements manuels à traiter</h2>
        <div className="space-y-2">
          {manualPending.length === 0 && <p className="text-sm text-zinc-500">Aucun paiement manuel en attente.</p>}
          {manualPending.map((item) => (
            <article key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-sm font-medium text-zinc-900">{item.propertyTitle} · {item.tenantName}</p>
              <p className="text-xs text-zinc-500">{currencyFormatter.format(item.amount)} · {item.date}</p>
              <p className="mt-2 text-xs text-zinc-500">
                Le rapprochement manuel se gère via le module comptabilité détaillé.
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Encaissements plateforme */}
      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Encaissements (plateforme)</h2>
        <div className="space-y-1">
          {ownerCollections.length === 0 && <p className="text-sm text-zinc-500">Aucun encaissement enregistré.</p>}
          {ownerCollections.slice(0, 8).map((item) => (
            <p key={item.id} className="text-sm text-zinc-700">
              {item.reference} · {item.propertyTitle} · {currencyFormatter.format(item.amount)}
            </p>
          ))}
        </div>
      </section>
    </>
  );
}
