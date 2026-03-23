import { apiClient, StandardApiResponse } from '@/lib/api-client';
import { AuthService } from '@/lib/auth-service';

export interface Notification {
  id: string;
  user: string;
  type: 'quittance' | 'alerte' | 'info';
  titre: string;
  message: string;
  lien?: string;
  lue: boolean;
  date_envoi: string;
}

export class NotificationsService {
  // Lister les notifications de l'utilisateur
  static async getNotifications(): Promise<StandardApiResponse<Notification[]>> {
    return apiClient.get<Notification[]>('/notifications/');
  }

  // Marquer une notification comme lue
  static async markAsRead(id: string): Promise<StandardApiResponse<Notification>> {
    return apiClient.patch<Notification>(`/notifications/${id}/`, { lue: true });
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(): Promise<StandardApiResponse<{ count: number }>> {
    return apiClient.post('/notifications/marquer-toutes-lues/');
  }

  // Supprimer une notification
  static async deleteNotification(id: string): Promise<StandardApiResponse<void>> {
    return apiClient.delete(`/notifications/${id}/`);
  }

  // Compter les notifications non lues
  static async countUnread(): Promise<StandardApiResponse<{ count: number }>> {
    return apiClient.get('/notifications/non-lues/count/');
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
  static async sendAlert(
    userIds: string[],
    titre: string,
    message: string,
    lien?: string
  ): Promise<StandardApiResponse<{ sent: number }>> {
    return apiClient.post('/notifications/envoyer-alerte/', {
      utilisateurs: userIds,
      titre,
      message,
      lien,
    });
  }
}
