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
  categorie_nom?: string;
  adresse?: string;
  description?: string;
  loyer_hc?: number;
  charges?: number;
  latitude?: number | null;
  longitude?: number | null;
  lien_maps?: string;
  type_logement: string;
  categorie_logement?: string;
  nb_pieces?: number;
  surface_m2?: number;
  standing?: string;
  etage?: string | number | null;
  amenagement?: string;
  espaces_exterieurs?: string[];
  accessibilite?: string[];
  photos?: PublicBienPhoto[];
  has_virtual_tour?: boolean;

  // Legacy fields (some environments may still expose these)
  titre?: string;
  adresse_complete?: string;
  surface?: number;
  nombre_pieces?: number;
  nombre_chambres?: number;
  loyer_mensuel?: number;
  depot_garantie?: number;
  meuble?: boolean;
  images?: string[];
  note_moyenne?: number;
  nombre_avis?: number;
}

export interface PublicBienPhoto {
  id: string;
  fichier: string;
  ordre: number;
  created_at: string;
}

export interface PublicBienDetail {
  id: string;
  categorie_nom: string;
  immeuble_nom?: string | null;
  adresse: string;
  description: string;
  loyer_hc: number;
  charges: number;
  equipements?: string[];
  latitude?: number | null;
  longitude?: number | null;
  lien_maps?: string;
  note_moyenne?: number;
  type_logement?: string;
  categorie_logement?: string;
  nb_pieces?: number;
  surface_m2?: number;
  standing?: string;
  etage?: string | number | null;
  amenagement?: string;
  espaces_exterieurs?: string[];
  accessibilite?: string[];
  usage_special?: string;
  photos?: PublicBienPhoto[];
  has_virtual_tour?: boolean;
}

export interface PublicBienOwnerContact {
  bien_id: string;
  adresse: string;
  contact: {
    email: string;
    nom: string;
  };
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
  static async getPropertyDetails(id: string): Promise<StandardApiResponse<PublicBienDetail>> {
    return apiClient.get<PublicBienDetail>(`/public/biens/${id}/`);
  }

  // Contact du proprietaire (donnees publiques non sensibles)
  static async getPropertyOwnerContact(
    id: string
  ): Promise<StandardApiResponse<PublicBienOwnerContact>> {
    return apiClient.get<PublicBienOwnerContact>(`/public/biens/${id}/contact-proprio/`);
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

  // Récupérer la config d'une visite virtuelle (sécurisé par token)
  static async getVirtualTourConfig(token: string): Promise<StandardApiResponse<any>> {
    // On passe le token en paramètre de requête car MonAccesVisiteView le supporte maintenant
    return apiClient.get('/visites/mon-acces/', { token });
  }
}
