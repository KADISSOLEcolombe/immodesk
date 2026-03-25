import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { Paiement, Depense, Balance, StatutPaiement } from '@/types/api';

type BalanceApiItem = {
  bien_id: string;
  adresse: string;
  periode_debut: string;
  periode_fin: string;
  total_revenus: number | string;
  total_depenses: number | string;
  benefice_net: number | string;
  nombre_paiements: number;
  nombre_depenses: number;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

  return {
    date_debut: toIsoDate(start),
    date_fin: toIsoDate(end),
  };
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeBalanceGlobale = (items: BalanceApiItem[]): Balance => {
  const normalizedItems = items.map((item) => ({
    ...item,
    total_revenus: toNumber(item.total_revenus),
    total_depenses: toNumber(item.total_depenses),
    benefice_net: toNumber(item.benefice_net),
  }));

  const total_global_revenus = normalizedItems.reduce((sum, item) => sum + item.total_revenus, 0);
  const total_global_depenses = normalizedItems.reduce((sum, item) => sum + item.total_depenses, 0);

  return {
    periode_debut: normalizedItems[0]?.periode_debut || '',
    periode_fin: normalizedItems[0]?.periode_fin || '',
    items: normalizedItems,
    total_global_revenus,
    total_global_depenses,
    benefice_net_global: total_global_revenus - total_global_depenses,
  };
};

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

  static async updatePaiementStatut(id: string, statut: StatutPaiement): Promise<StandardApiResponse<Paiement>> {
    return await apiClient.patch<Paiement>(`/comptabilite/paiements/${id}/`, { statut });
  }

  static async deletePaiement(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/comptabilite/paiements/${id}/`);
  }

  static async getHistoriquePaiements(bailId: string): Promise<StandardApiResponse<Paiement[]>> {
    return await apiClient.get<Paiement[]>(`/comptabilite/paiements/historique/${bailId}/`);
  }

  // ===== DÉPENSES =====
  static async getDepenses(params?: {
    bien?: string;
    bien_id?: string;
    proprietaire?: string;
    categorie?: 'travaux' | 'taxe' | 'frais_agence' | 'copropriete' | 'autre';
    date_debut?: string;
    date_fin?: string;
  }): Promise<StandardApiResponse<Depense[]>> {
    return await apiClient.get<Depense[]>('/comptabilite/depenses/', params);
  }

  static async createDepense(data: Partial<Depense> | FormData): Promise<StandardApiResponse<Depense>> {
    if (data instanceof FormData) {
      return await apiClient.upload<Depense>('/comptabilite/depenses/', data);
    }

    return await apiClient.post<Depense>('/comptabilite/depenses/', data);
  }

  static async getDepense(id: string): Promise<StandardApiResponse<Depense>> {
    return await apiClient.get<Depense>(`/comptabilite/depenses/${id}/`);
  }

  static async updateDepense(id: string, data: Partial<Depense> | FormData): Promise<StandardApiResponse<Depense>> {
    if (data instanceof FormData) {
      return await apiClient.uploadPut<Depense>(`/comptabilite/depenses/${id}/`, data);
    }

    return await apiClient.put<Depense>(`/comptabilite/depenses/${id}/`, data);
  }

  static async deleteDepense(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/comptabilite/depenses/${id}/`);
  }

  // ===== BALANCE =====
  static async getBalanceGlobale(params?: { 
    periode_debut?: string; 
    periode_fin?: string;
    date_debut?: string;
    date_fin?: string;
    proprietaire?: string;
  }): Promise<StandardApiResponse<Balance>> {
    const fallbackRange = getCurrentMonthRange();
    const queryParams = {
      date_debut: params?.date_debut || params?.periode_debut || fallbackRange.date_debut,
      date_fin: params?.date_fin || params?.periode_fin || fallbackRange.date_fin,
      proprietaire: params?.proprietaire,
    };

    const response = await apiClient.get<BalanceApiItem[]>('/comptabilite/balance/', queryParams);

    if (!response.success || !response.data) {
      return {
        ...response,
        data: null,
      };
    }

    return {
      ...response,
      data: normalizeBalanceGlobale(response.data),
    };
  }

  static async getBalanceBien(bienId: string, params?: { 
    periode_debut?: string; 
    periode_fin?: string;
    date_debut?: string;
    date_fin?: string;
  }): Promise<StandardApiResponse<Balance>> {
    const fallbackRange = getCurrentMonthRange();
    const queryParams = {
      date_debut: params?.date_debut || params?.periode_debut || fallbackRange.date_debut,
      date_fin: params?.date_fin || params?.periode_fin || fallbackRange.date_fin,
    };

    const response = await apiClient.get<BalanceApiItem>(`/comptabilite/balance/${bienId}/`, queryParams);

    if (!response.success || !response.data) {
      return {
        ...response,
        data: null,
      };
    }

    return {
      ...response,
      data: normalizeBalanceGlobale([response.data]),
    };
  }

  static async export2044(params?: { 
    annee?: number;
    proprietaire?: string;
  }): Promise<StandardApiResponse<any>> {
    return await apiClient.get<any>('/comptabilite/export/2044/', params);
  }
}
