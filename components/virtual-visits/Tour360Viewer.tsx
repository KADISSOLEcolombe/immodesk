'use client';

import { useEffect, useRef } from 'react';
import { Engine } from '@/lib/tour360/engine';
import { HotspotManager } from '@/lib/tour360/hotspot-manager';
import { SceneManager } from '@/lib/tour360/scene-manager';
import { TourData } from '@/types/tour360';

interface Tour360ViewerProps {
  tourData: TourData;
  onSceneChange?: (sceneId: string) => void;
  className?: string;
}

/**
 * Composant React pour la visualisation 360°.
 * Initialise le moteur Three.js et gère le cycle de vie du canvas.
 */
export function Tour360Viewer({ tourData, onSceneChange, className }: Tour360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!containerRef.current || !tourData) return;

    // 1. Initialiser le moteur
    const engine = new Engine(containerRef.current);
    engineRef.current = engine;

    // 2. Initialiser les gestionnaires
    const hotspotMgr = new HotspotManager(engine.scene);
    const sceneMgr = new SceneManager(engine, hotspotMgr);

    // 3. Configurer le mode preview (pas d'édition par défaut)
    engine.setMode('preview');

    // 4. Callback de changement de scène
    if (onSceneChange) {
      sceneMgr.onSceneLoaded = (id) => onSceneChange(id);
    }

    // 5. Charger la visite (import du format JSON)
    sceneMgr.importTour(tourData).catch((err) => {
      console.error('[Tour360Viewer] Erreur lors de l\'import de la visite:', err);
    });

    // 6. Cleanup au démontage du composant
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [tourData, onSceneChange]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[400px] overflow-hidden bg-zinc-950 ${className || ''}`}
    />
  );
}
