// Export centralisé de tous les services API

export { AuthService } from './auth-service';
export type { StandardApiResponse } from './api-client';
export { apiClient } from './api-client';
export { PatrimoineService } from './patrimoine-service';
export { LocationsService } from './locations-service';
export { ComptabiliteService } from './comptabilite-service';
export { PaiementService } from './paiement-service';
export { PaiementEnLigneService } from './paiement-en-ligne-service';

// Nouveaux services intégrés
export { NotificationsService } from './notifications-service';
export { StatsService } from './stats-service';
export { PublicService } from './public-service';
