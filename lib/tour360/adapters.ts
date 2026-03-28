/**
 * adapters.ts
 * Convertit entre le modèle de données de l'application (TourAsset)
 * et le modèle attendu par le moteur 360 (TourData).
 */

import { TourAsset, TourData, TourScene } from '@/types/tour360';

/**
 * Convertit un TourAsset (stockage local/API) vers TourData (moteur).
 */
export function convertTourAssetToTourData(asset: TourAsset): TourData {
  // On crée une scène initiale à partir de l'asset
  const mainScene: TourScene = {
    name: asset.metadata?.sceneName || 'Vue principale',
    image: asset.fileUrl,
    hotspots: asset.hotspots || [],
  };

  const tourData: TourData = {
    name: asset.metadata?.sceneName || `Visite ${asset.id}`,
    initialScene: asset.id,
    scenes: {
      [asset.id]: mainScene,
    },
  };

  // Log pour vérification (suggestion utilisateur)
  console.log('[Tour360 Adapter] Converted TourAsset to TourData:', JSON.stringify(tourData, null, 2));

  return tourData;
}

/**
 * Inverse : Convertit TourData (moteur) vers TourAsset (stockage).
 * Note: Cette version simplifiée prend la scène initiale comme asset principal.
 */
export function convertTourDataToTourAsset(tourData: TourData, propertyId: string): TourAsset {
  const sceneId = tourData.initialScene || Object.keys(tourData.scenes)[0];
  const scene = tourData.scenes[sceneId];

  return {
    id: sceneId,
    propertyId: propertyId,
    fileName: `tour-${sceneId}.jpg`,
    fileUrl: scene.image,
    mediaType: 'image360',
    durationMinutes: 15,
    accessMode: 'code',
    createdAt: new Date().toISOString(),
    panorama: true,
    hotspots: scene.hotspots,
    metadata: {
      sceneName: scene.name,
    },
  };
}
