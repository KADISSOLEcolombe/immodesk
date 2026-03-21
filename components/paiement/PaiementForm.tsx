"use client";

import { useState } from 'react';
import { CreditCard, Smartphone, Wallet, Check, Loader2, AlertCircle } from 'lucide-react';
import { PaiementEnLigneService, InitierPaiementData } from '@/lib/paiement-en-ligne-service';
import { MoyenPaiement, TransactionPaiement } from '@/types/api';
import { formatCurrency } from '@/lib/utils';

interface PaiementFormProps {
  bailId: string;
  montantParDefaut?: number;
  moisConcerne?: string;
  onSuccess?: (transaction: TransactionPaiement) => void;
  onError?: (error: string) => void;
}

const moyensPaiement = [
  { 
    id: 'moov_money' as MoyenPaiement, 
    label: 'Moov Money', 
    icon: Smartphone,
    description: 'Paiement via Moov Money',
    requirePhone: true
  },
  { 
    id: 'mixx_by_yas' as MoyenPaiement, 
    label: 'Mixx by Yas', 
    icon: Wallet,
    description: 'Paiement via Mixx by Yas',
    requirePhone: true
  },
  { 
    id: 'carte_bancaire' as MoyenPaiement, 
    label: 'Carte Bancaire', 
    icon: CreditCard,
    description: 'Paiement par carte bancaire',
    requirePhone: false
  },
];

export function PaiementForm({ 
  bailId, 
  montantParDefaut = 0, 
  moisConcerne,
  onSuccess,
  onError 
}: PaiementFormProps) {
  const [moyenSelectionne, setMoyenSelectionne] = useState<MoyenPaiement | null>(null);
  const [montant, setMontant] = useState(montantParDefaut);
  const [telephone, setTelephone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionEnCours, setTransactionEnCours] = useState<TransactionPaiement | null>(null);
  const [statusVerification, setStatusVerification] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');

  const handleInitierPaiement = async () => {
    if (!moyenSelectionne) {
      onError?.('Veuillez sélectionner un moyen de paiement');
      return;
    }

    if (montant <= 0) {
      onError?.('Le montant doit être supérieur à 0');
      return;
    }

    const moyen = moyensPaiement.find(m => m.id === moyenSelectionne);
    if (moyen?.requirePhone && !telephone) {
      onError?.('Veuillez saisir votre numéro de téléphone');
      return;
    }

    setIsLoading(true);
    try {
      const data: InitierPaiementData = {
        bail: bailId,
        montant,
        moyen_paiement: moyenSelectionne,
        numero_telephone: moyen?.requirePhone ? telephone : undefined,
        mois_concerne: moisConcerne || new Date().toISOString().slice(0, 7) + '-01',
      };

      const response = await PaiementEnLigneService.initierPaiement(data);
      
      if (response.success && response.data) {
        setTransactionEnCours(response.data);
        // Vérifier le statut après un délai
        setTimeout(() => verifierStatut(response.data!.reference), 3000);
      } else {
        onError?.(response.message || 'Erreur lors de l\'initiation du paiement');
      }
    } catch (error) {
      onError?.('Erreur technique lors du paiement');
    } finally {
      setIsLoading(false);
    }
  };

  const verifierStatut = async (reference: string) => {
    setStatusVerification('checking');
    try {
      const response = await PaiementEnLigneService.getStatutTransaction(reference);
      if (response.success && response.data) {
        setTransactionEnCours(response.data);
        if (response.data.statut === 'valide') {
          setStatusVerification('success');
          onSuccess?.(response.data);
        } else if (response.data.statut === 'echoue' || response.data.statut === 'annule') {
          setStatusVerification('failed');
          onError?.(response.data.message_retour || 'Le paiement a échoué');
        } else {
          // Toujours en attente, vérifier à nouveau
          setTimeout(() => verifierStatut(reference), 3000);
        }
      }
    } catch (error) {
      setStatusVerification('failed');
      onError?.('Erreur lors de la vérification du statut');
    }
  };

  const handleAnnuler = async () => {
    if (!transactionEnCours) return;
    
    try {
      await PaiementEnLigneService.annulerTransaction(transactionEnCours.reference);
      setTransactionEnCours(null);
      setStatusVerification('idle');
    } catch (error) {
      onError?.('Erreur lors de l\'annulation');
    }
  };

  // Affichage du statut de la transaction en cours
  if (transactionEnCours) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="text-center">
          {statusVerification === 'checking' && (
            <>
              <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Traitement en cours...</h3>
              <p className="text-sm text-zinc-600">Référence: {transactionEnCours.reference}</p>
              <p className="text-sm text-zinc-500 mt-2">Veuillez valider le paiement sur votre téléphone</p>
            </>
          )}
          
          {statusVerification === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Paiement réussi !</h3>
              <p className="text-sm text-zinc-600">Référence: {transactionEnCours.reference}</p>
              <p className="text-lg font-bold text-green-700 mt-2">
                {formatCurrency(transactionEnCours.montant)}
              </p>
            </>
          )}
          
          {statusVerification === 'failed' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Paiement échoué</h3>
              <p className="text-sm text-zinc-600">{transactionEnCours.message_retour || 'Une erreur est survenue'}</p>
              <button
                onClick={() => {
                  setTransactionEnCours(null);
                  setStatusVerification('idle');
                }}
                className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium"
              >
                Réessayer
              </button>
            </>
          )}

          {statusVerification === 'checking' && (
            <button
              onClick={handleAnnuler}
              className="mt-4 px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Annuler la transaction
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">Effectuer un paiement</h3>
      
      {/* Montant */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 mb-2">Montant à payer</label>
        <div className="relative">
          <input
            type="number"
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="0"
            min="0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">XOF</span>
        </div>
        {montantParDefaut > 0 && montant !== montantParDefaut && (
          <button
            onClick={() => setMontant(montantParDefaut)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Réinitialiser à {formatCurrency(montantParDefaut)}
          </button>
        )}
      </div>

      {/* Moyens de paiement */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 mb-2">Moyen de paiement</label>
        <div className="space-y-3">
          {moyensPaiement.map((moyen) => {
            const Icon = moyen.icon;
            const isSelected = moyenSelectionne === moyen.id;
            
            return (
              <button
                key={moyen.id}
                onClick={() => setMoyenSelectionne(moyen.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-zinc-900 bg-zinc-50' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${isSelected ? 'text-zinc-900' : 'text-zinc-700'}`}>
                    {moyen.label}
                  </p>
                  <p className="text-sm text-zinc-500">{moyen.description}</p>
                </div>
                {isSelected && (
                  <div className="ml-auto w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Numéro de téléphone si nécessaire */}
      {moyensPaiement.find(m => m.id === moyenSelectionne)?.requirePhone && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="90 XX XX XX"
          />
          <p className="mt-1 text-xs text-zinc-500">Vous recevrez une notification sur ce numéro</p>
        </div>
      )}

      {/* Bouton de paiement */}
      <button
        onClick={handleInitierPaiement}
        disabled={isLoading || !moyenSelectionne || montant <= 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            Payer {formatCurrency(montant)}
          </>
        )}
      </button>
    </div>
  );
}
