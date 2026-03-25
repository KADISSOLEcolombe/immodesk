import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { AuthService } from '@/lib/auth-service';

export interface Notification {
  id: string;
  user?: string;
  type: 'quittance' | 'alerte' | 'info' | 'paiement' | 'bail';
  titre: string;
  message: string;
  lien?: string;
  lue: boolean;
  date_envoi: string;
}

export type AlertMode = 'individuel' | 'multidiffusion' | 'diffusion';

export interface SendAdminAlertPayload {
  message: string;
  mode_envoi: AlertMode;
  destinataires?: string[];
  bien_id?: string | null;
}

type BackendAlerte = {
  id: string;
  type_alerte: string;
  message: string;
  lue: boolean;
  mode_envoi: string;
  date_envoi: string;
  bien?: string | null;
  bail?: string | null;
};

const mapBackendAlertType = (typeAlerte: string): Notification['type'] => {
  switch (typeAlerte) {
    case 'paiement_confirme':
    case 'paiement_echoue':
    case 'loyer_a_payer':
    case 'loyer_impaye':
      return 'paiement';
    case 'fin_bail':
    case 'revision_loyer':
      return 'bail';
    case 'information':
      return 'info';
    default:
      return 'alerte';
  }
};

const mapBackendAlertTitle = (typeAlerte: string): string => {
  switch (typeAlerte) {
    case 'paiement_confirme':
      return 'Paiement confirmé';
    case 'paiement_echoue':
      return 'Paiement échoué';
    case 'loyer_a_payer':
      return 'Rappel de paiement';
    case 'loyer_impaye':
      return 'Loyer impayé';
    case 'fin_bail':
      return 'Fin de bail';
    case 'revision_loyer':
      return 'Révision de loyer';
    case 'information':
      return 'Information';
    default:
      return 'Alerte';
  }
};

const mapBackendAlerteToNotification = (item: BackendAlerte): Notification => ({
  id: item.id,
  type: mapBackendAlertType(item.type_alerte),
  titre: mapBackendAlertTitle(item.type_alerte),
  message: item.message,
  lue: item.lue,
  date_envoi: item.date_envoi,
});

export class NotificationsService {
  // Lister les notifications de l'utilisateur
  static async getNotifications(): Promise<StandardApiResponse<Notification[]>> {
    const response = await apiClient.get<BackendAlerte[]>('/notifications/alertes/');

    if (!response.success || !response.data) {
      return {
        ...response,
        data: null,
      };
    }

    return {
      ...response,
      data: response.data.map(mapBackendAlerteToNotification),
    };
  }

  // Marquer une notification comme lue
  static async markAsRead(id: string): Promise<StandardApiResponse<Notification>> {
    const response = await apiClient.patch<BackendAlerte>(`/notifications/alertes/${id}/lire/`);

    if (!response.success || !response.data) {
      return {
        ...response,
        data: null,
      };
    }

    return {
      ...response,
      data: mapBackendAlerteToNotification(response.data),
    };
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(): Promise<StandardApiResponse<{ count: number }>> {
    return apiClient.post('/notifications/alertes/marquer-toutes-lues/');
  }

  // Supprimer une notification
  static async deleteNotification(id: string): Promise<StandardApiResponse<void>> {
    return apiClient.delete(`/notifications/alertes/${id}/`);
  }

  // Compter les notifications non lues
  static async countUnread(): Promise<StandardApiResponse<{ count: number }>> {
    return apiClient.get('/notifications/alertes/non-lues/count/');
  }

  // Télécharger une quittance PDF
  static async downloadQuittance(paiementId: string): Promise<Blob> {
    const accessToken = AuthService.getAccessToken();
    if (!accessToken) {
      throw new Error('Utilisateur non authentifié');
    }

    const response = await fetch(
      `${AuthService.getApiBaseUrl()}/notifications/quittances/${paiementId}/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) throw new Error('Failed to download quittance');
    return response.blob();
  }

  // Envoyer une alerte manuelle (Admin uniquement)
  static async sendAdminAlert(payload: SendAdminAlertPayload): Promise<StandardApiResponse<{ alertes_envoyees: number }>> {
    return apiClient.post('/notifications/alertes/envoyer/', payload);
  }

  // Compatibilité descendante
  static async sendAlert(
    userIds: string[],
    _titre: string,
    message: string,
    _lien?: string,
  ): Promise<StandardApiResponse<{ alertes_envoyees: number }>> {
    return this.sendAdminAlert({
      message,
      mode_envoi: userIds.length <= 1 ? 'individuel' : 'multidiffusion',
      destinataires: userIds,
    });
  }
}
