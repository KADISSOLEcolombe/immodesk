/**
 * scene-manager.ts — Gestion des scènes de la visite virtuelle.
 * Orchestre le chargement, la sauvegarde et le préchargement des scènes.
 */

import { Engine } from './engine';
import { HotspotManager } from './hotspot-manager';
import { TourData, TourScene } from '@/types/tour360';

export class SceneManager {
  private engine: Engine;
  private hotspotManager: HotspotManager;

  public tourData: TourData = {
    name:         'Ma Visite Virtuelle',
    initialScene: null,
    scenes:       {},
  };

  public currentSceneId: string | null = null;
  private _preloadCache: Map<string, HTMLImageElement> = new Map();

  // Callbacks
  public onSceneLoaded: ((id: string, sceneData: TourScene) => void) | null = null;
  public onScenesChange: (() => void) | null = null;

  constructor(engine: Engine, hotspotManager: HotspotManager) {
    this.engine         = engine;
    this.hotspotManager = hotspotManager;
  }

  /* ── Gestion des scènes ─────────────────────────────────────────────── */

  public addScene(id: string, name: string, imageUrl: string): TourScene | null {
    if (!id || this.tourData.scenes[id]) return null;
    this.tourData.scenes[id] = { name, image: imageUrl, hotspots: [] };
    if (!this.tourData.initialScene) {
      this.tourData.initialScene = id;
    }
    this.onScenesChange?.();
    return this.tourData.scenes[id];
  }

  public removeScene(id: string) {
    if (!this.tourData.scenes[id]) return;

    delete this.tourData.scenes[id];

    // Nettoyer les hotspots navigate qui pointent vers cette scène
    Object.values(this.tourData.scenes).forEach(scene => {
      scene.hotspots = scene.hotspots.filter(
        h => !(h.type === 'navigate' && h.target === id)
      );
    });

    // Recalculer la scène initiale si nécessaire
    if (this.tourData.initialScene === id) {
      const remaining = Object.keys(this.tourData.scenes);
      this.tourData.initialScene = remaining[0] ?? null;
    }

    this.onScenesChange?.();

    // Si la scène courante est supprimée, charger une autre
    if (this.currentSceneId === id) {
      const remaining = Object.keys(this.tourData.scenes);
      this.currentSceneId = null; 
      if (remaining.length > 0) {
        this.loadScene(remaining[0]);
      } else {
        this.hotspotManager.removeAllHotspots();
        this.engine.loadPanorama(null);
      }
    }
  }

  public renameScene(id: string, newName: string) {
    if (this.tourData.scenes[id]) {
      this.tourData.scenes[id].name = newName;
      this.onScenesChange?.();
    }
  }

  /* ── Chargement ─────────────────────────────────────────────────────── */

  public saveCurrentScene() {
    if (!this.currentSceneId) return;
    const scene = this.tourData.scenes[this.currentSceneId];
    if (scene) scene.hotspots = this.hotspotManager.serialize();
  }

  public async loadScene(sceneId: string) {
    if (sceneId === this.currentSceneId) return;
    const scene = this.tourData.scenes[sceneId];
    if (!scene) { console.warn(`[SceneManager] Scène inconnue: ${sceneId}`); return; }

    this.saveCurrentScene();
    this.currentSceneId = sceneId;

    // Supprimer les hotspots de la scène précédente
    this.hotspotManager.removeAllHotspots();

    // Charger le panorama
    await this.engine.loadPanorama(scene.image);

    // Recréer les hotspots
    (scene.hotspots || []).forEach(h => {
      this.hotspotManager.createHotspot(h.yaw, h.pitch, h);
    });

    this.onSceneLoaded?.(sceneId, scene);

    // Précharger les scènes voisines
    this._preloadNeighbors(sceneId);
  }

  /* ── Accès aux données ──────────────────────────────────────────────── */

  public getSceneIds(): string[] {
    return Object.keys(this.tourData.scenes);
  }

  public getScene(id: string): TourScene | null {
    return this.tourData.scenes[id] ?? null;
  }

  public getCurrentScene(): TourScene | null {
    return this.currentSceneId ? this.tourData.scenes[this.currentSceneId] : null;
  }

  /* ── Import / Export ────────────────────────────────────────────────── */

  public async importTour(data: TourData) {
    this.currentSceneId = null;
    this.hotspotManager.removeAllHotspots();
    this.tourData = data;
    this.onScenesChange?.();
    if (data.initialScene && data.scenes[data.initialScene]) {
      await this.loadScene(data.initialScene);
    } else {
      const first = Object.keys(data.scenes)[0];
      if (first) await this.loadScene(first);
    }
  }

  public exportTour(): TourData {
    this.saveCurrentScene();
    return JSON.parse(JSON.stringify(this.tourData));
  }

  /* ── Préchargement ──────────────────────────────────────────────────── */

  private _preloadNeighbors(sceneId: string) {
    const scene = this.tourData.scenes[sceneId];
    if (!scene) return;
    scene.hotspots
      .filter(h => h.type === 'navigate' && h.target)
      .forEach(h => {
        const target = this.tourData.scenes[h.target!];
        if (target?.image && !this._preloadCache.has(target.image)) {
          const img = new Image();
          img.src = target.image;
          this._preloadCache.set(target.image, img);
        }
      });
  }
}
