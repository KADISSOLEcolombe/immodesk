"use client";

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { Paiement, Balance } from '@/types/api';
import { formatCurrency } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

// Mapping statut backend vers UI
const mapStatutToUI = (statut: string): 'received' | 'pending' | 'late' => {
  switch (statut) {
    case 'valide':
    case 'confirmé':
      return 'received';
    case 'en_attente':
      return 'pending';
    case 'en_retard':
    case 'annule':
      return 'late';
    default:
      return 'pending';
  }
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
  status: mapStatutToUI(paiement.statut),
  reference: paiement.transaction_ref,
  channel: paiement.source_paiement === 'manuel' ? 'manual' : 'online',
});

export default function OwnerPaymentsPage() {
  const { addNotification } = useNotifications();
  
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les paiements et la balance depuis le backend
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

      // Charger les paiements et la balance en parallèle
      const [paiementsResponse, balanceResponse] = await Promise.all([
        ComptabiliteService.getPaiements(),
        ComptabiliteService.getBalanceGlobale({
          periode_debut: defaultDebut,
          periode_fin: defaultFin,
        }),
      ]);

      if (paiementsResponse.success && paiementsResponse.data) {
        const mappedPayments = paiementsResponse.data.map(mapPaiementToUI);
        setPayments(mappedPayments);
      }

      if (balanceResponse.success && balanceResponse.data) {
        setBalance(balanceResponse.data);
      }
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
    return payments.filter((p) => p.channel === 'manual' && p.status === 'pending');
  }, [payments]);

  const ownerCollections = useMemo(() => {
    return payments.filter((p) => p.status === 'received');
  }, [payments]);

  const confirmManualPayment = async (paymentId: string) => {
    try {
      // TODO: Appeler l'API pour confirmer le paiement
      addNotification({
        type: 'paiement',
        titre: 'Paiement confirmé',
        message: `Le paiement manuel ${paymentId} a été confirmé.`,
      });
    } catch (err) {
      console.error('Erreur lors de la confirmation:', err);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <CreditCard className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Paiements & loyers</h1>
      </div>

      {/* Résumé */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Solde net propriétaire</h2>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            <span className="text-zinc-500">Chargement...</span>
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-3xl font-bold text-zinc-900">{currencyFormatter.format(ownerNetBalance)}</p>
        )}
      </section>

      {/* Paiements récents */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Paiements récents</h2>
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
                  <p className="mt-1 text-sm text-zinc-700">{currencyFormatter.format(payment.amount)} · {payment.date}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {payment.status === 'received' ? 'Perçu' : 'En retard'}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Paiements manuels à confirmer */}
      <section className="mb-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Paiements manuels à confirmer</h2>
        <div className="space-y-2">
          {manualPending.length === 0 && <p className="text-sm text-zinc-500">Aucun paiement manuel en attente.</p>}
          {manualPending.map((item) => (
            <article key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-sm font-medium text-zinc-900">{item.propertyTitle} · {item.tenantName}</p>
              <p className="text-xs text-zinc-500">{currencyFormatter.format(item.amount)} · {item.date}</p>
              <button
                type="button"
                onClick={() => confirmManualPayment(item.id)}
                className="mt-2 inline-flex rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Confirmer
              </button>
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
