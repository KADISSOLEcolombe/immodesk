import { apiClient, StandardApiResponse } from '@/lib/api-client';

export type VisiteConfig = {
  id: string;
  bien: string;      // Note: this often contains the object or a related value
  bien_id: string;   // The actual UUID of the property
  config?: any;
  prix?: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type CompteEphemere = {
  id: string;
  identifiant: string;
  mot_de_passe_clair?: string;
  visite: string;
  date_creation: string;
  date_expiration: string;
  est_actif: boolean;
};

export class VirtualVisitService {
  static async getVisites(): Promise<StandardApiResponse<VisiteConfig[]>> {
    return await apiClient.get<VisiteConfig[]>('/visites/');
  }

  static async getVisite(id: string): Promise<StandardApiResponse<VisiteConfig>> {
    return await apiClient.get<VisiteConfig>(`/visites/${id}/`);
  }

  static async createVisite(data: Partial<VisiteConfig>): Promise<StandardApiResponse<VisiteConfig>> {
    return await apiClient.post<VisiteConfig>('/visites/', data);
  }

  static async updateVisite(id: string, data: Partial<VisiteConfig>): Promise<StandardApiResponse<VisiteConfig>> {
    return await apiClient.put<VisiteConfig>(`/visites/${id}/`, data);
  }

  static async deleteVisite(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/visites/${id}/`);
  }

  static async getComptesEphemeres(): Promise<StandardApiResponse<CompteEphemere[]>> {
    return await apiClient.get<CompteEphemere[]>('/visites/comptes-ephemeres/');
  }

  static async getTransactions(): Promise<StandardApiResponse<any[]>> {
    return await apiClient.get<any[]>('/visites/transactions/');
  }

  static async updateCompteEphemere(id: string, data: Partial<CompteEphemere>): Promise<StandardApiResponse<CompteEphemere>> {
    return await apiClient.put<CompteEphemere>(`/visites/comptes-ephemeres/${id}/`, data);
  }

  static async deleteCompteEphemere(id: string): Promise<StandardApiResponse<void>> {
    return await apiClient.delete<void>(`/visites/comptes-ephemeres/${id}/`);
  }

  static async demanderVisite(pk: string, data: {
    email_visiteur: string;
    nom_visiteur?: string;
    moyen_paiement: string;
    numero_telephone?: string;
    numero_carte?: string;
    date_expiration?: string;
    cvv?: string;
  }): Promise<StandardApiResponse<any>> {
    return await apiClient.post<any>(`/visites/${pk}/demander/`, data);
  }

  static async connexion(identifiant: string, code: string): Promise<StandardApiResponse<{ token: string }>> {
    return await apiClient.post<{ token: string }>('/visites/connexion/', { identifiant, code });
  }
}
