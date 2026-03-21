import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { Transaction } from '@/types/api';

export interface SimulateurConfig {
  mobile_money: {
    enabled: boolean;
    success_rate: number;
    delay_min: number;
    delay_max: number;
  };
  carte_bancaire: {
    enabled: boolean;
    success_rate: number;
    delay_min: number;
    delay_max: number;
  };
}

export class PaiementService {
  // ===== TRANSACTIONS =====
  static async initierPaiement(data: {
    bail: string;
    montant: number;
    canal: 'mobile_money' | 'card';
    operateur?: 'mix' | 'moov' | 'tmoney';
    telephone?: string;
  }): Promise<StandardApiResponse<Transaction>> {
    return await apiClient.post<Transaction>('/paiement/initier/', data);
  }

  static async getStatutTransaction(reference: string): Promise<StandardApiResponse<Transaction>> {
    return await apiClient.get<Transaction>(`/paiement/statut/${reference}/`);
  }

  static async getHistoriqueTransactions(params?: { 
    bail?: string;
    locataire?: string;
    statut?: string;
  }): Promise<StandardApiResponse<Transaction[]>> {
    return await apiClient.get<Transaction[]>('/paiement/historique/', params);
  }

  static async getHistoriqueTransactionsParBail(bailId: string): Promise<StandardApiResponse<Transaction[]>> {
    return await apiClient.get<Transaction[]>(`/paiement/historique/bail/${bailId}/`);
  }

  static async annulerTransaction(reference: string): Promise<StandardApiResponse<Transaction>> {
    return await apiClient.post<Transaction>(`/paiement/annuler/${reference}/`);
  }

  // ===== SIMULATEUR (Admin seulement) =====
  static async getSimulateurConfig(): Promise<StandardApiResponse<SimulateurConfig>> {
    return await apiClient.get<SimulateurConfig>('/paiement/simulateur/config/');
  }

  static async updateSimulateurConfig(config: SimulateurConfig): Promise<StandardApiResponse<SimulateurConfig>> {
    return await apiClient.put<SimulateurConfig>('/paiement/simulateur/config/update/', config);
  }

  static async forcerSuccesTransaction(reference: string): Promise<StandardApiResponse<Transaction>> {
    return await apiClient.post<Transaction>(`/paiement/simulateur/forcer-succes/${reference}/`);
  }

  static async forcerEchecTransaction(reference: string): Promise<StandardApiResponse<Transaction>> {
    return await apiClient.post<Transaction>(`/paiement/simulateur/forcer-echec/${reference}/`);
  }
}
