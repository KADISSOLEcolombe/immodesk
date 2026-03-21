import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { Locataire, Bail, AvisLocataire } from '@/types/api';

export class LocationsService {
  // ===== LOCATAIRES =====
  static async getLocataires(params?: { proprietaire?: string }): Promise<StandardApiResponse<Locataire[]>> {
    return await apiClient.get<Locataire[]>('/locations/locataires/', params);
  }

  static async createLocataire(data: Partial<Locataire>): Promise<StandardApiResponse<Locataire>> {
    return await apiClient.post<Locataire>('/locations/locataires/', data);
  }

  static async getLocataire(id: string): Promise<StandardApiResponse<Locataire>> {
    return await apiClient.get<Locataire>(`/locations/locataires/${id}/`);
  }

  static async updateLocataire(id: string, data: Partial<Locataire>): Promise<StandardApiResponse<Locataire>> {
    return await apiClient.put<Locataire>(`/locations/locataires/${id}/`, data);
  }

  static async deleteLocataire(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/locations/locataires/${id}/`);
  }

  // ===== BAUX =====
  static async getBaux(params?: { actif?: boolean; proprietaire?: string }): Promise<StandardApiResponse<Bail[]>> {
    return await apiClient.get<Bail[]>('/locations/baux/', params);
  }

  static async createBail(data: Partial<Bail>): Promise<StandardApiResponse<Bail>> {
    return await apiClient.post<Bail>('/locations/baux/', data);
  }

  static async getBail(id: string): Promise<StandardApiResponse<Bail>> {
    return await apiClient.get<Bail>(`/locations/baux/${id}/`);
  }

  static async updateBail(id: string, data: Partial<Bail>): Promise<StandardApiResponse<Bail>> {
    return await apiClient.put<Bail>(`/locations/baux/${id}/`, data);
  }

  static async reviserBail(id: string): Promise<StandardApiResponse<Bail>> {
    return await apiClient.patch<Bail>(`/locations/baux/${id}/reviser/`);
  }

  static async terminerBail(id: string): Promise<StandardApiResponse<any>> {
    return await apiClient.post<any>(`/locations/baux/${id}/terminer/`);
  }

  static async getMonBail(): Promise<StandardApiResponse<Bail>> {
    return await apiClient.get<Bail>('/locations/baux/mon-bail/');
  }

  // ===== AVIS =====
  static async createAvis(data: Partial<AvisLocataire>): Promise<StandardApiResponse<AvisLocataire>> {
    return await apiClient.post<AvisLocataire>('/locations/avis/', data);
  }

  static async getAvisParBien(bienId: string): Promise<StandardApiResponse<AvisLocataire[]>> {
    return await apiClient.get<AvisLocataire[]>(`/locations/avis/bien/${bienId}/`);
  }

  static async updateAvis(id: string, data: Partial<AvisLocataire>): Promise<StandardApiResponse<AvisLocataire>> {
    return await apiClient.put<AvisLocataire>(`/locations/avis/${id}/`, data);
  }
}
