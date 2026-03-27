/**
 * types/tour360.ts
 * Centralisation des interfaces pour le module de visite virtuelle 360°.
 */

export type MediaType = 'image360' | 'video360';

export interface TourHotspot {
  id: string;
  yaw: number;     // Rotation horizontale (degrés)
  pitch: number;   // Rotation verticale (degrés)
  type: 'navigate' | 'info';
  target?: string;      // ID de la scène cible (pour navigate)
  label?: string;       // Texte affiché (pour navigate)
  title?: string;       // Titre de la popup (pour info)
  description?: string; // Contenu de la popup (pour info)
}

export interface TourScene {
  name: string;
  image: string;
  hotspots: TourHotspot[];
}

export interface TourData {
  name: string;
  initialScene: string | null;
  scenes: Record<string, TourScene>;
}

export interface TourAssetMetadata {
  initialFov?: number;
  sceneName?: string;
  [key: string]: any;
}

export interface TourAsset {
  id: string;
  propertyId: string;
  fileName: string;
  fileUrl: string;
  mediaType: MediaType;
  durationMinutes: number;
  accessMode: 'code' | 'free';
  createdAt: string;
  
  // Champs spécifiques Tour360
  panorama?: boolean;
  hotspots?: TourHotspot[];
  metadata?: TourAssetMetadata;
}
