import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { AuthService } from '@/lib/auth-service';

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

export interface AdminPaymentStats {
  total_transactions: number;
  valide: number;
  echoue: number;
  en_attente: number;
  annule: number;
  total_manuel: number;
  montant_total: string;
}

export interface AdminUserStats {
  total_utilisateurs: number;
  proprietaires: number;
  locataires: number;
  nouveaux_ce_mois: number;
}

export interface AdminVisitStats {
  total_visites: number;
  utilisees: number;
  non_utilisees: number;
  revenus_visites: string;
}

export interface AdminSubmissionStats {
  total_soumissions: number;
  en_examen: number;
  publie: number;
  refuse: number;
}

export interface AdminGlobalStats {
  utilisateurs: AdminUserStats;
  paiements: AdminPaymentStats;
  visites: AdminVisitStats;
  soumissions: AdminSubmissionStats;
}

export interface AdminMonthlyPaymentTrendPoint {
  mois: string;
  valides: number;
  enAttente: number;
  echoues: number;
}

export class StatsService {
  private static readonly monthFormatter = new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
  });

  private static toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private static getMonthBounds(date: Date): { start: Date; end: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
    };
  }

  private static formatShortMonth(date: Date): string {
    const raw = this.monthFormatter.format(date);
    const normalized = raw.replace('.', '').trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private static buildFallbackError<T>(message: string): StandardApiResponse<T> {
    return {
      success: false,
      code: 'RESOURCE_NOT_FOUND',
      message,
      messageKey: 'resource.not_found',
      data: null,
      timestamp: new Date().toISOString(),
      errors: null,
      pagination: null,
    };
  }

  // Tableau de bord principal
  static async getDashboard(): Promise<StandardApiResponse<DashboardStats>> {
    const userRole = AuthService.getUserRole();

    if (userRole === 'superadmin') {
      const adminGlobal = await this.getAdminGlobalStats();
      if (adminGlobal.success && adminGlobal.data) {
        const data = adminGlobal.data;
        const monthlyRevenue = Number(data.paiements.montant_total || '0');
        const dashboard: DashboardStats = {
          total_immeubles: 0,
          total_biens: 0,
          biens_vacants: 0,
          biens_loues: 0,
          total_locataires: data.utilisateurs.locataires,
          baux_actifs: 0,
          baux_termines: 0,
          revenus_mois: monthlyRevenue,
          revenus_annee: monthlyRevenue,
          depenses_mois: 0,
          benefice_net: monthlyRevenue,
        };

        return {
          ...adminGlobal,
          data: dashboard,
        };
      }
    }

    const ownerPortfolio = await apiClient.get<{
      total_biens: number;
      biens_loues: number;
      biens_vacants: number;
      revenus_mois_courant: string;
      depenses_mois_courant: string;
      solde_mois_courant: string;
    }>('/stats/proprio/portefeuille/');

    if (ownerPortfolio.success && ownerPortfolio.data) {
      const data = ownerPortfolio.data;
      const revenusMois = Number(data.revenus_mois_courant || '0');
      const depensesMois = Number(data.depenses_mois_courant || '0');
      const dashboard: DashboardStats = {
        total_immeubles: 0,
        total_biens: data.total_biens,
        biens_vacants: data.biens_vacants,
        biens_loues: data.biens_loues,
        total_locataires: 0,
        baux_actifs: 0,
        baux_termines: 0,
        revenus_mois: revenusMois,
        revenus_annee: revenusMois,
        depenses_mois: depensesMois,
        benefice_net: Number(data.solde_mois_courant || '0'),
      };

      return {
        ...ownerPortfolio,
        data: dashboard,
      };
    }

    return this.buildFallbackError<DashboardStats>('Aucune statistique de dashboard disponible.');
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

  static async getAdminGlobalStats(params?: { source?: string }): Promise<StandardApiResponse<AdminGlobalStats>> {
    return apiClient.get<AdminGlobalStats>('/stats/admin/global/', params || {});
  }
 
  static async getAdminPaymentStats(params?: {
    date_debut?: string;
    date_fin?: string;
    source?: string;
  }): Promise<StandardApiResponse<AdminPaymentStats>> {
    return apiClient.get<AdminPaymentStats>('/stats/admin/paiements/', params || {});
  }
 
  static async getAdminUserStats(): Promise<StandardApiResponse<AdminUserStats>> {
    return apiClient.get<AdminUserStats>('/stats/admin/utilisateurs/');
  }
 
  static async getAdminVisitStats(): Promise<StandardApiResponse<AdminVisitStats>> {
    return apiClient.get<AdminVisitStats>('/stats/admin/visites/');
  }
 
  static async getAdminSubmissionStats(): Promise<StandardApiResponse<AdminSubmissionStats>> {
    return apiClient.get<AdminSubmissionStats>('/stats/admin/soumissions/');
  }
 
  static async getAdminMonthlyPaymentTrend(
    months: number = 6,
    source: string = 'all'
  ): Promise<StandardApiResponse<AdminMonthlyPaymentTrendPoint[]>> {
    const safeMonths = Number.isFinite(months) && months > 0 ? Math.floor(months) : 6;
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
 
    const monthStarts = Array.from({ length: safeMonths }, (_, index) => {
      const monthDate = new Date(currentMonthStart);
      monthDate.setMonth(currentMonthStart.getMonth() - (safeMonths - 1 - index));
      return monthDate;
    });
 
    const responses = await Promise.all(
      monthStarts.map(async (monthStart) => {
        const { start, end } = this.getMonthBounds(monthStart);
        const response = await this.getAdminPaymentStats({
          date_debut: this.toIsoDate(start),
          date_fin: this.toIsoDate(end),
          source,
        });

        return {
          monthStart,
          response,
        };
      })
    );

    const hasSuccess = responses.some(({ response }) => response.success && response.data);
    if (!hasSuccess) {
      return this.buildFallbackError<AdminMonthlyPaymentTrendPoint[]>('Aucune tendance mensuelle disponible.');
    }

    const data: AdminMonthlyPaymentTrendPoint[] = responses.map(({ monthStart, response }) => ({
      mois: this.formatShortMonth(monthStart),
      valides: response.success && response.data ? response.data.valide : 0,
      enAttente: response.success && response.data ? response.data.en_attente : 0,
      echoues: response.success && response.data ? response.data.echoue : 0,
    }));

    return {
      success: true,
      code: 'OPERATION_SUCCESS',
      message: 'Tendance mensuelle des paiements récupérée.',
      messageKey: 'operation.success',
      data,
      timestamp: new Date().toISOString(),
      errors: null,
      pagination: null,
    };
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
    const accessToken = AuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('Utilisateur non authentifié');
    }

    const params = new URLSearchParams({ format });
    if (periodeDebut) params.append('date_debut', periodeDebut);
    if (periodeFin) params.append('date_fin', periodeFin);

    const response = await fetch(
      `${AuthService.getApiBaseUrl()}/stats/export/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) throw new Error('Failed to export stats');
    return response.blob();
  }
}
