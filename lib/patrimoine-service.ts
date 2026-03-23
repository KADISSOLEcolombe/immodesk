import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { Bien, Categorie, Immeuble, PhotoBien, SoumissionBien } from '@/types/api';

export class PatrimoineService {
  // ===== CATÉGORIES =====
  static async getCategories(): Promise<StandardApiResponse<Categorie[]>> {
    return await apiClient.get<Categorie[]>('/patrimoine/categories/');
  }

  static async createCategory(data: Partial<Categorie>): Promise<StandardApiResponse<Categorie>> {
    return await apiClient.post<Categorie>('/patrimoine/categories/', data);
  }

  static async updateCategory(id: string, data: Partial<Categorie>): Promise<StandardApiResponse<Categorie>> {
    return await apiClient.put<Categorie>(`/patrimoine/categories/${id}/`, data);
  }

  static async deleteCategory(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/patrimoine/categories/${id}/`);
  }

  // ===== IMMEUBLES =====
  static async getImmeubles(params?: { proprietaire?: string }): Promise<StandardApiResponse<Immeuble[]>> {
    return await apiClient.get<Immeuble[]>('/patrimoine/immeubles/', params);
  }

  static async createImmeuble(data: Partial<Immeuble>): Promise<StandardApiResponse<Immeuble>> {
    return await apiClient.post<Immeuble>('/patrimoine/immeubles/', data);
  }

  static async getImmeuble(id: string): Promise<StandardApiResponse<Immeuble>> {
    return await apiClient.get<Immeuble>(`/patrimoine/immeubles/${id}/`);
  }

  static async updateImmeuble(id: string, data: Partial<Immeuble>): Promise<StandardApiResponse<Immeuble>> {
    return await apiClient.put<Immeuble>(`/patrimoine/immeubles/${id}/`, data);
  }

  static async deleteImmeuble(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/patrimoine/immeubles/${id}/`);
  }

  static async getImmeubleBiens(id: string): Promise<StandardApiResponse<Bien[]>> {
    return await apiClient.get<Bien[]>(`/patrimoine/immeubles/${id}/biens/`);
  }

  // ===== BIENS =====
  static async getBiens(params?: { 
    proprietaire?: string; 
    statut?: string; 
    page?: number; 
    page_size?: number 
  }): Promise<StandardApiResponse<Bien[]>> {
    return await apiClient.get<Bien[]>('/patrimoine/biens/', params);
  }

  static async getBien(id: string): Promise<StandardApiResponse<Bien>> {
    return await apiClient.get<Bien>(`/patrimoine/biens/${id}/`);
  }

  static async createBien(data: Partial<Bien>): Promise<StandardApiResponse<Bien>> {
    return await apiClient.post<Bien>('/patrimoine/biens/', data);
  }

  static async updateBien(id: string, data: Partial<Bien>): Promise<StandardApiResponse<Bien>> {
    return await apiClient.put<Bien>(`/patrimoine/biens/${id}/`, data);
  }

  static async patchBienStatut(id: string, statut: string): Promise<StandardApiResponse<Bien>> {
    return await apiClient.patch<Bien>(`/patrimoine/biens/${id}/statut/`, { statut });
  }

  static async deleteBien(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/patrimoine/biens/${id}/`);
  }

  static async getBienPhotos(id: string): Promise<StandardApiResponse<PhotoBien[]>> {
    return await apiClient.get<PhotoBien[]>(`/patrimoine/biens/${id}/photos/`);
  }

  static async addBienPhotos(id: string, formData: FormData): Promise<StandardApiResponse<PhotoBien[]>> {
    return await apiClient.upload<PhotoBien[]>(`/patrimoine/biens/${id}/photos/`, formData);
  }

  static async getBiensPublic(): Promise<StandardApiResponse<Bien[]>> {
    return await apiClient.get<Bien[]>('/patrimoine/biens/public/');
  }

  // ===== SOUMISSIONS =====
  static async getSoumissions(params?: { proprietaire?: string }): Promise<StandardApiResponse<SoumissionBien[]>> {
    return await apiClient.get<SoumissionBien[]>('/patrimoine/soumissions/', params);
  }

  static async getSoumission(id: string): Promise<StandardApiResponse<SoumissionBien>> {
    return await apiClient.get<SoumissionBien>(`/patrimoine/soumissions/${id}/`);
  }

  static async createSoumission(data: Partial<SoumissionBien>): Promise<StandardApiResponse<SoumissionBien>> {
    return await apiClient.post<SoumissionBien>('/patrimoine/soumissions/', data);
  }

  static async updateSoumission(id: string, data: Partial<SoumissionBien>): Promise<StandardApiResponse<SoumissionBien>> {
    return await apiClient.put<SoumissionBien>(`/patrimoine/soumissions/${id}/`, data);
  }

  static async publierSoumission(id: string): Promise<StandardApiResponse<any>> {
    return await apiClient.post<any>(`/patrimoine/soumissions/${id}/publier/`);
  }

  static async refuserSoumission(id: string, justification_refus: string): Promise<StandardApiResponse<any>> {
    return await apiClient.post<any>(`/patrimoine/soumissions/${id}/refuser/`, { justification_refus });
  }

  static async relancerSoumission(id: string): Promise<StandardApiResponse<any>> {
    return await apiClient.post<any>(`/patrimoine/soumissions/${id}/relancer/`);
  }
}
