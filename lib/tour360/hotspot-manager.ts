/**
 * hotspot-manager.ts — Gestion des hotspots (création, suppression, drag, sélection)
 * Chaque hotspot est une sphère Three.js positionnée sur la surface intérieure de la sphère 360°.
 */

import * as THREE from 'three';
import { TourHotspot } from '@/types/tour360';

/* Palette de couleurs par type et état */
const COLORS = {
  navigate: { normal: 0x3b82f6, hover: 0x93c5fd, selected: 0xf59e0b },
  info:     { normal: 0x10b981, hover: 0x6ee7b7, selected: 0xf59e0b },
};

const HOTSPOT_RADIUS = 0.38; // Taille de la sphère hotspot (unités Three.js)
const SPHERE_RADIUS  = 10;   // Rayon de placement (doit correspondre à engine.ts)

export interface HotspotInstance {
  mesh: THREE.Mesh;
  data: TourHotspot;
}

export class HotspotManager {
  private scene: THREE.Scene;
  public hotspots: HotspotInstance[] = [];
  public selectedHotspot: HotspotInstance | null = null;
  public hoveredHotspot: HotspotInstance | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /* ── Création ───────────────────────────────────────────────────────── */

  public createHotspot(yaw: number, pitch: number, data: Partial<TourHotspot> = {}): HotspotInstance {
    const hotspotData: TourHotspot = {
      id: data.id || `hs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type:        'navigate',
      target:      '',
      label:       '',
      title:       '',
      description: '',
      ...data,
      yaw,
      pitch,
    };

    const colors   = COLORS[hotspotData.type] || COLORS.navigate;
    const geo      = new THREE.SphereGeometry(HOTSPOT_RADIUS, 20, 20);
    const mat      = new THREE.MeshBasicMaterial({
      color:       colors.normal,
      transparent: true,
      opacity:     0.88,
    });
    const mesh     = new THREE.Mesh(geo, mat);

    // Anneau de contour (ring)
    const ringGeo  = new THREE.TorusGeometry(HOTSPOT_RADIUS + 0.05, 0.06, 8, 32);
    const ringMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const ring     = new THREE.Mesh(ringGeo, ringMat);
    mesh.add(ring);

    mesh.position.copy(this._toPosition(yaw, pitch));
    // Faire pointer le hotspot vers l'intérieur (vers la caméra)
    mesh.lookAt(0, 0, 0);

    mesh.userData.isHotspot  = true;
    mesh.userData.hotspotRef = null;

    this.scene.add(mesh);

    const hotspot: HotspotInstance = { mesh, data: hotspotData };
    mesh.userData.hotspotRef = hotspot;
    this.hotspots.push(hotspot);

    return hotspot;
  }

  /* ── Suppression ────────────────────────────────────────────────────── */

  public removeHotspot(hotspot: HotspotInstance) {
    if (!hotspot) return;
    this.scene.remove(hotspot.mesh);
    hotspot.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    const idx = this.hotspots.indexOf(hotspot);
    if (idx !== -1) this.hotspots.splice(idx, 1);
    if (this.selectedHotspot === hotspot) this.selectedHotspot = null;
    if (this.hoveredHotspot  === hotspot) this.hoveredHotspot  = null;
  }

  public removeAllHotspots() {
    [...this.hotspots].forEach(h => this.removeHotspot(h));
  }

  /* ── Sélection / Survol ─────────────────────────────────────────────── */

  public selectHotspot(hotspot: HotspotInstance | null) {
    if (this.selectedHotspot && this.selectedHotspot !== hotspot) {
      this._applyColor(this.selectedHotspot, 'normal');
    }
    this.selectedHotspot = hotspot;
    if (hotspot) this._applyColor(hotspot, 'selected');
  }

  public clearSelection() {
    if (this.selectedHotspot) {
      this._applyColor(this.selectedHotspot, 'normal');
      this.selectedHotspot = null;
    }
  }

  public hoverHotspot(hotspot: HotspotInstance | null) {
    if (this.hoveredHotspot && this.hoveredHotspot !== hotspot && this.hoveredHotspot !== this.selectedHotspot) {
      this._applyColor(this.hoveredHotspot, 'normal');
    }
    this.hoveredHotspot = hotspot;
    if (hotspot && hotspot !== this.selectedHotspot) {
      this._applyColor(hotspot, 'hover');
    }
  }

  /* ── Déplacement ────────────────────────────────────────────────────── */

  public moveHotspot(hotspot: HotspotInstance, yaw: number, pitch: number) {
    hotspot.data.yaw   = yaw;
    hotspot.data.pitch = pitch;
    hotspot.mesh.position.copy(this._toPosition(yaw, pitch));
    hotspot.mesh.lookAt(0, 0, 0);
  }

  /* ── Mise à jour des données ────────────────────────────────────────── */

  public updateHotspotData(hotspot: HotspotInstance, data: Partial<TourHotspot>) {
    Object.assign(hotspot.data, data);
    hotspot.mesh.userData.hotspotRef = hotspot;
    this._applyColor(hotspot, hotspot === this.selectedHotspot ? 'selected' : 'normal');
  }

  /* ── Utilitaires de raycasting ──────────────────────────────────────── */

  public getMeshes(): THREE.Object3D[] {
    return this.hotspots.map(h => h.mesh);
  }

  public findByMesh(mesh: THREE.Object3D): HotspotInstance | null {
    let target: THREE.Object3D | null = mesh;
    while (target && !target.userData.isHotspot && target.parent) {
      target = target.parent;
    }
    return target?.userData.hotspotRef || null;
  }

  /* ── Sérialisation ──────────────────────────────────────────────────── */

  public serialize(): TourHotspot[] {
    return this.hotspots.map(h => {
      const d    = h.data;
      const base: TourHotspot = {
        id:    d.id,
        type:  d.type,
        yaw:   this._round(d.yaw),
        pitch: this._round(d.pitch),
      };
      if (d.type === 'navigate') {
        base.target = d.target || '';
        base.label  = d.label  || '';
      } else {
        base.title       = d.title       || '';
        base.description = d.description || '';
      }
      return base;
    });
  }

  /* ── Méthodes privées ───────────────────────────────────────────────── */

  private _toPosition(yaw: number, pitch: number): THREE.Vector3 {
    const y = yaw   * (Math.PI / 180);
    const p = pitch * (Math.PI / 180);
    return new THREE.Vector3(
      SPHERE_RADIUS * Math.cos(p) * Math.sin(y),
      SPHERE_RADIUS * Math.sin(p),
      SPHERE_RADIUS * Math.cos(p) * Math.cos(y),
    );
  }

  private _applyColor(hotspot: HotspotInstance, state: 'normal' | 'hover' | 'selected') {
    const palette = COLORS[hotspot.data.type] || COLORS.navigate;
    const material = hotspot.mesh.material as THREE.MeshBasicMaterial;
    material.color.setHex((palette as any)[state] ?? palette.normal);
  }

  private _round(n: number) { return Math.round(n * 100) / 100; }
}
