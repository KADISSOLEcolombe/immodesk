"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthService } from '@/lib/auth-service';
import { PaiementService } from '@/lib/paiement-service';
import { ComptabiliteService } from '@/lib/comptabilite-service';
import { Transaction, Paiement } from '@/types/api';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'canceled';
export type PaymentChannel = 'mobile_money' | 'card' | 'manual';
export type MobileOperator = 'mix' | 'moov' | 'tmoney';

export type PaymentRecord = {
  id: string;
  tenantName: string;
  propertyTitle: string;
  month: string;
  amount: number;
  channel: PaymentChannel;
  operator?: MobileOperator;
  phone?: string;
  cardLast4?: string;
  status: PaymentStatus;
  source: 'auto' | 'manual';
  createdAt: string;
  reference: string;
  refundedAmount: number;
  receiptGenerated: boolean;
  receiptEmailed: boolean;
};

type PaymentFilters = {
  from?: string;
  to?: string;
  status?: 'all' | PaymentStatus;
  channel?: 'all' | PaymentChannel;
};

type StartMobilePayload = {
  tenantName: string;
  propertyTitle: string;
  month: string;
  amount: number;
  operator: MobileOperator;
  phone: string;
};

type PaymentContextValue = {
  payments: PaymentRecord[];
  isLoading: boolean;
  error: string | null;
  filters: PaymentFilters;
  updateFilters: (filters: Partial<PaymentFilters>) => void;
  startMobilePayment: (payload: StartMobilePayload) => Promise<{ success: boolean; reference?: string; error?: string }>;
  getPaymentStatus: (reference: string) => Promise<{ status: PaymentStatus; details?: any }>;
  generateReceipt: (paymentId: string) => Promise<void>;
  emailReceipt: (paymentId: string, email: string) => Promise<void>;
  refundPayment: (paymentId: string, amount: number, reason: string) => Promise<void>;
  refreshPayments: () => Promise<void>;
  getOwnerBalance: () => number;
};

const PaymentContext = createContext<PaymentContextValue | null>(null);

// Mock data pour transition (sera remplacé par les vraies données du backend)
const mockPayments: PaymentRecord[] = [
  {
    id: 'p-1',
    tenantName: 'Kossi Mensah',
    propertyTitle: 'Appartement meublé à Bè',
    month: 'Janvier 2026',
    amount: 180000,
    channel: 'mobile_money',
    operator: 'tmoney',
    phone: '90 00 00 00',
    status: 'success',
    source: 'auto',
    createdAt: '2026-01-05T10:30:00Z',
    reference: 'TXN-20260105-001',
    refundedAmount: 0,
    receiptGenerated: true,
    receiptEmailed: true,
  },
  {
    id: 'p-2',
    tenantName: 'Ama Koffi',
    propertyTitle: 'Studio à Lomé',
    month: 'Janvier 2026',
    amount: 75000,
    channel: 'mobile_money',
    operator: 'moov',
    phone: '91 00 00 00',
    status: 'pending',
    source: 'auto',
    createdAt: '2026-01-10T14:15:00Z',
    reference: 'TXN-20260110-002',
    refundedAmount: 0,
    receiptGenerated: false,
    receiptEmailed: false,
  },
];

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<PaymentRecord[]>(mockPayments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({});

  // Rafraîchir les paiements depuis le backend
  const refreshPayments = async () => {
    if (!AuthService.isAuthenticated()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les transactions depuis le backend
      const transactionsResponse = await PaiementService.getHistoriqueTransactions();
      
      // Récupérer les paiements enregistrés
      const paiementsResponse = await ComptabiliteService.getPaiements();

      if (transactionsResponse.success && paiementsResponse.success) {
        // Transformer les données du backend vers le format frontend
        const transformedPayments: PaymentRecord[] = paiementsResponse.data!.map((paiement) => ({
          id: paiement.id,
          tenantName: paiement.bail_detail?.locataire_nom || 'Locataire inconnu',
          propertyTitle: paiement.bail_detail?.bien_adresse || `Bien ${paiement.bail}`,
          month: new Date(paiement.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          amount: paiement.montant,
          channel: (paiement.source_paiement === 'manuel' ? 'manual' : 'mobile_money') as PaymentChannel,
          status: paiement.statut as PaymentStatus,
          source: 'manual' as const,
          createdAt: paiement.date_paiement,
          reference: paiement.transaction_ref || '',
          refundedAmount: 0,
          receiptGenerated: false,
          receiptEmailed: false,
        }));

        setPayments(transformedPayments);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des paiements:', error);
      setError('Impossible de charger les paiements');
    } finally {
      setIsLoading(false);
    }
  };

  // Démarrer un paiement Mobile Money
  const startMobilePayment = async (payload: StartMobilePayload) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Récupérer le bail correspondant au locataire et au bien
      // Pour l'instant, on simule
      
      const response = await PaiementService.initierPaiement({
        bail: 'bail-id-placeholder', // TODO: Récupérer le vrai bail ID
        montant: payload.amount,
        canal: 'mobile_money',
        operateur: payload.operator,
        telephone: payload.phone,
      });

      if (response.success && response.data) {
        // Ajouter le paiement à la liste locale
        const newPayment: PaymentRecord = {
          id: response.data.id,
          tenantName: payload.tenantName,
          propertyTitle: payload.propertyTitle,
          month: payload.month,
          amount: payload.amount,
          channel: 'mobile_money',
          operator: payload.operator,
          phone: payload.phone,
          status: 'pending',
          source: 'auto',
          createdAt: response.data.date_initiation,
          reference: response.data.reference,
          refundedAmount: 0,
          receiptGenerated: false,
          receiptEmailed: false,
        };

        setPayments(prev => [newPayment, ...prev]);
        
        return { success: true, reference: response.data.reference };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      return { success: false, error: 'Erreur technique lors du paiement' };
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir le statut d'un paiement
  const getPaymentStatus = async (reference: string) => {
    try {
      const response = await PaiementService.getStatutTransaction(reference);
      
      if (response.success && response.data) {
        return {
          status: response.data.statut,
          details: response.data,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      throw error;
    }
  };

  // Générer un reçu PDF
  const generateReceipt = async (paymentId: string) => {
    try {
      // TODO: Implémenter la génération PDF avec jsPDF
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      // Simulation de génération PDF
      console.log('Génération du reçu pour le paiement:', paymentId);
      
      // Marquer comme généré
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, receiptGenerated: true } : p
      ));
    } catch (error) {
      console.error('Erreur lors de la génération du reçu:', error);
      throw error;
    }
  };

  // Envoyer le reçu par email
  const emailReceipt = async (paymentId: string, email: string) => {
    try {
      // TODO: Implémenter l'envoi d'email
      console.log('Envoi du reçu par email:', paymentId, email);
      
      // Marquer comme envoyé
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, receiptEmailed: true } : p
      ));
    } catch (error) {
      console.error('Erreur lors de l\'envoi du reçu:', error);
      throw error;
    }
  };

  // Rembourser un paiement
  const refundPayment = async (paymentId: string, amount: number, reason: string) => {
    try {
      // TODO: Implémenter le remboursement via le backend
      console.log('Remboursement du paiement:', paymentId, amount, reason);
      
      // Mettre à jour le statut
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { 
          ...p, 
          status: 'refunded', 
          refundedAmount: amount 
        } : p
      ));
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
      throw error;
    }
  };

  // Obtenir le solde du propriétaire
  const getOwnerBalance = () => {
    // Calculer le solde à partir des paiements réussis
    const successfulPayments = payments.filter(p => p.status === 'success');
    const totalCollected = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = payments.reduce((sum, p) => sum + p.refundedAmount, 0);
    
    return totalCollected - totalRefunded - 50000; // Simuler des frais
  };

  const updateFilters = (newFilters: Partial<PaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const value: PaymentContextValue = {
    payments,
    isLoading,
    error,
    filters,
    updateFilters,
    startMobilePayment,
    getPaymentStatus,
    generateReceipt,
    emailReceipt,
    refundPayment,
    refreshPayments,
    getOwnerBalance,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error('usePayments must be used inside PaymentProvider');
  }

  return context;
}
