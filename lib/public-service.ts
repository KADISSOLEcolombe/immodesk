import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { Bien } from '@/types/api';

export interface ContactForm {
  nom: string;
  email: string;
  telephone?: string;
  sujet: string;
  message: string;
}

export interface PublicBienPreview {
  id: string;
  titre: string;
  adresse_complete: string;
  surface: number;
  nombre_pieces: number;
  nombre_chambres: number;
  loyer_mensuel: number;
  depot_garantie: number;
  meuble: boolean;
  images: string[];
  type_logement: string;
  note_moyenne?: number;
  nombre_avis?: number;
}

export interface SearchFilters {
  type_logement?: string;
  ville?: string;
  loyer_min?: number;
  loyer_max?: number;
  surface_min?: number;
  surface_max?: number;
  nombre_chambres?: number;
  meuble?: boolean;
}

export class PublicService {
  // Lister les biens vacants (public)
  static async getAvailableProperties(
    filters?: SearchFilters,
    page?: number
  ): Promise<StandardApiResponse<PublicBienPreview[]>> {
    const params: Record<string, string | number | boolean> = { ...filters };
    if (page) params.page = page;
    return apiClient.get<PublicBienPreview[]>('/public/biens/', params);
  }

  // Détail d'un bien public
  static async getPropertyDetails(id: string): Promise<StandardApiResponse<PublicBienPreview>> {
    return apiClient.get<PublicBienPreview>(`/public/biens/${id}/`);
  }

  // Recherche de biens
  static async searchProperties(
    query: string,
    filters?: SearchFilters
  ): Promise<StandardApiResponse<PublicBienPreview[]>> {
    const params: Record<string, string | number | boolean> = { q: query, ...filters };
    return apiClient.get<PublicBienPreview[]>('/public/biens/recherche/', params);
  }

  // Formulaire de contact
  static async submitContactForm(form: ContactForm): Promise<StandardApiResponse<{ id: string }>> {
    return apiClient.post('/public/contact/', form);
  }

  // Demande de visite pour un bien
  static async requestVisit(
    bienId: string,
    nom: string,
    email: string,
    telephone: string,
    message?: string
  ): Promise<StandardApiResponse<{ demande_id: string }>> {
    return apiClient.post('/public/demandes-visite/', {
      bien_id: bienId,
      nom,
      email,
      telephone,
      message,
    });
  }

  // Liste des villes disponibles
  static async getAvailableCities(): Promise<StandardApiResponse<string[]>> {
    return apiClient.get<string[]>('/public/villes/');
  }

  // Types de logement disponibles
  static async getPropertyTypes(): Promise<
    StandardApiResponse<{ value: string; label: string }[]>
  > {
    return apiClient.get('/public/types-logement/');
  }

  // Avis d'un bien (public)
  static async getPropertyReviews(bienId: string): Promise<
    StandardApiResponse<{
      note_moyenne: number;
      nombre_avis: number;
      avis: Array<{
        id: string;
        note: number;
        commentaire: string;
        date_avis: string;
        locataire_nom: string;
      }>;
    }>
  > {
    return apiClient.get(`/public/biens/${bienId}/avis/`);
  }
}
