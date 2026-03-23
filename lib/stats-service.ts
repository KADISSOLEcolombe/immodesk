import { apiClient, StandardApiResponse } from '@/lib/api-client';

export interface DashboardStats {
  total_immeubles: number;
  total_biens: number;
  biens_vacants: number;
  biens_loues: number;
  total_locataires: number;
  baux_actifs: number;
  baux_termines: number;
  revenus_mois: number;
  revenus_annee: number;
  depenses_mois: number;
  benefice_net: number;
}

export interface MonthlyRevenue {
  mois: string;
  revenus: number;
  depenses: number;
  benefice: number;
}

export interface OccupationRate {
  bien_id: string;
  adresse: string;
  taux_occupation: number;
  jours_loues: number;
  jours_vacants: number;
}

export interface FinancialMetrics {
  loyer_moyen: number;
  duree_moyenne_bail: number;
  taux_impayes: number;
  retard_moyen_paiement: number;
}

export class StatsService {
  // Tableau de bord principal
  static async getDashboard(): Promise<StandardApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/stats/dashboard/');
  }

  // Évolution mensuelle (pour graphiques)
  static async getMonthlyRevenue(
    annee?: number
  ): Promise<StandardApiResponse<MonthlyRevenue[]>> {
    const params = annee ? { annee } : {};
    return apiClient.get<MonthlyRevenue[]>('/stats/evolution-mensuelle/', params);
  }

  // Taux d'occupation par bien
  static async getOccupationRates(
    dateDebut?: string,
    dateFin?: string
  ): Promise<StandardApiResponse<OccupationRate[]>> {
    const params: Record<string, string> = {};
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    return apiClient.get<OccupationRate[]>('/stats/taux-occupation/', params);
  }

  // Métriques financières
  static async getFinancialMetrics(): Promise<StandardApiResponse<FinancialMetrics>> {
    return apiClient.get<FinancialMetrics>('/stats/metriques-financieres/');
  }

  // Performance par immeuble
  static async getBuildingPerformance(immeubleId: string): Promise<
    StandardApiResponse<{
      revenus: number;
      depenses: number;
      benefice: number;
      biens_count: number;
    }>
  > {
    return apiClient.get(`/stats/immeubles/${immeubleId}/performance/`);
  }

  // Export des statistiques (PDF ou Excel)
  static async exportStats(
    format: 'pdf' | 'excel',
    periodeDebut?: string,
    periodeFin?: string
  ): Promise<Blob> {
    const params = new URLSearchParams({ format });
    if (periodeDebut) params.append('date_debut', periodeDebut);
    if (periodeFin) params.append('date_fin', periodeFin);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/stats/export/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );
    if (!response.ok) throw new Error('Failed to export stats');
    return response.blob();
  }
}
