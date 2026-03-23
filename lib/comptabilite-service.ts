import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { Paiement, Depense, Balance } from '@/types/api';

export class ComptabiliteService {
  // ===== PAIEMENTS =====
  static async getPaiements(params?: {
    bail?: string;
    bail_id?: string;
    statut?: 'paye' | 'en_retard' | 'impaye';
    mois?: string;
    source?: 'manuel' | 'mixx_by_yas' | 'moov_money' | 'carte_bancaire';
    page?: number;
    page_size?: number;
  }): Promise<StandardApiResponse<Paiement[]>> {
    return await apiClient.get<Paiement[]>('/comptabilite/paiements/', params);
  }

  static async createPaiement(data: Partial<Paiement>): Promise<StandardApiResponse<Paiement>> {
    return await apiClient.post<Paiement>('/comptabilite/paiements/', data);
  }

  static async getPaiement(id: string): Promise<StandardApiResponse<Paiement>> {
    return await apiClient.get<Paiement>(`/comptabilite/paiements/${id}/`);
  }

  static async updatePaiement(id: string, data: Partial<Paiement>): Promise<StandardApiResponse<Paiement>> {
    return await apiClient.put<Paiement>(`/comptabilite/paiements/${id}/`, data);
  }

  static async deletePaiement(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/comptabilite/paiements/${id}/`);
  }

  static async getHistoriquePaiements(bailId: string): Promise<StandardApiResponse<Paiement[]>> {
    return await apiClient.get<Paiement[]>(`/comptabilite/paiements/historique/${bailId}/`);
  }

  // ===== DÉPENSES =====
  static async getDepenses(params?: { bien?: string; proprietaire?: string }): Promise<StandardApiResponse<Depense[]>> {
    return await apiClient.get<Depense[]>('/comptabilite/depenses/', params);
  }

  static async createDepense(data: Partial<Depense>): Promise<StandardApiResponse<Depense>> {
    return await apiClient.post<Depense>('/comptabilite/depenses/', data);
  }

  static async getDepense(id: string): Promise<StandardApiResponse<Depense>> {
    return await apiClient.get<Depense>(`/comptabilite/depenses/${id}/`);
  }

  static async updateDepense(id: string, data: Partial<Depense>): Promise<StandardApiResponse<Depense>> {
    return await apiClient.put<Depense>(`/comptabilite/depenses/${id}/`, data);
  }

  static async deleteDepense(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/comptabilite/depenses/${id}/`);
  }

  // ===== BALANCE =====
  static async getBalanceGlobale(params?: { 
    periode_debut?: string; 
    periode_fin?: string;
    proprietaire?: string;
  }): Promise<StandardApiResponse<Balance>> {
    return await apiClient.get<Balance>('/comptabilite/balance/', params);
  }

  static async getBalanceBien(bienId: string, params?: { 
    periode_debut?: string; 
    periode_fin?: string;
  }): Promise<StandardApiResponse<Balance>> {
    return await apiClient.get<Balance>(`/comptabilite/balance/${bienId}/`, params);
  }

  static async export2044(params?: { 
    annee?: number;
    proprietaire?: string;
  }): Promise<StandardApiResponse<any>> {
    return await apiClient.get<any>('/comptabilite/export/2044/', params);
  }
}
