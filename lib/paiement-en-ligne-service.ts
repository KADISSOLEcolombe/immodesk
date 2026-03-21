import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { TransactionPaiement, MoyenPaiement, ConfigSimulateur } from '@/types/api';

export interface InitierPaiementData {
  bail: string;
  montant: number;
  moyen_paiement: MoyenPaiement;
  numero_telephone?: string;
  mois_concerne: string; // Format YYYY-MM-01
}

export class PaiementEnLigneService {
  // ===== TRANSACTIONS LOCATAIRE =====
  
  /**
   * Initier une transaction de paiement
   */
  static async initierPaiement(data: InitierPaiementData): Promise<StandardApiResponse<TransactionPaiement>> {
    return await apiClient.post<TransactionPaiement>('/paiement/initier/', data);
  }

  /**
   * Vérifier le statut d'une transaction
   */
  static async getStatutTransaction(reference: string): Promise<StandardApiResponse<TransactionPaiement>> {
    return await apiClient.get<TransactionPaiement>(`/paiement/statut/${reference}/`);
  }

  /**
   * Obtenir l'historique des transactions du locataire connecté
   */
  static async getHistoriqueTransactions(): Promise<StandardApiResponse<TransactionPaiement[]>> {
    return await apiClient.get<TransactionPaiement[]>('/paiement/historique/');
  }

  /**
   * Obtenir l'historique des transactions pour un bail spécifique
   */
  static async getHistoriqueParBail(bailId: string): Promise<StandardApiResponse<TransactionPaiement[]>> {
    return await apiClient.get<TransactionPaiement[]>(`/paiement/historique/bail/${bailId}/`);
  }

  /**
   * Annuler une transaction en attente
   */
  static async annulerTransaction(reference: string): Promise<StandardApiResponse<TransactionPaiement>> {
    return await apiClient.post<TransactionPaiement>(`/paiement/annuler/${reference}/`);
  }

  // ===== ADMINISTRATION SIMULATEUR (Super Admin) =====

  /**
   * Obtenir la configuration du simulateur
   */
  static async getConfigSimulateur(): Promise<StandardApiResponse<ConfigSimulateur[]>> {
    return await apiClient.get<ConfigSimulateur[]>('/paiement/simulateur/config/');
  }

  /**
   * Mettre à jour la configuration du simulateur
   */
  static async updateConfigSimulateur(configs: Partial<ConfigSimulateur>[]): Promise<StandardApiResponse<ConfigSimulateur[]>> {
    return await apiClient.put<ConfigSimulateur[]>('/paiement/simulateur/config/update/', configs);
  }

  /**
   * Forcer le succès d'une transaction (débogage)
   */
  static async forcerSucces(reference: string): Promise<StandardApiResponse<TransactionPaiement>> {
    return await apiClient.post<TransactionPaiement>(`/paiement/simulateur/forcer-succes/${reference}/`);
  }

  /**
   * Forcer l'échec d'une transaction (débogage)
   */
  static async forcerEchec(reference: string): Promise<StandardApiResponse<TransactionPaiement>> {
    return await apiClient.post<TransactionPaiement>(`/paiement/simulateur/forcer-echec/${reference}/`);
  }
}

// Export singleton
export const paiementService = new PaiementEnLigneService();
