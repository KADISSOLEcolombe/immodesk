/**
 * tour-serializer.ts — Export/import JSON de la visite virtuelle.
 * Fournit aussi des données de démonstration.
 */

import { TourData, TourScene, TourHotspot } from '@/types/tour360';

export class TourSerializer {

  /* ── Export ─────────────────────────────────────────────────────────── */

  /**
   * Exporte les données en JSON et déclenche un téléchargement.
   */
  static exportToFile(tourData: TourData, filename = 'visite-virtuelle.json'): string {
    const clean = TourSerializer.cleanTourData(tourData);
    const json  = JSON.stringify(clean, null, 2);
    
    if (typeof window !== 'undefined') {
      const blob  = new Blob([json], { type: 'application/json' });
      const url   = URL.createObjectURL(blob);

      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    return json;
  }

  /* ── Import ─────────────────────────────────────────────────────────── */

  /**
   * Importe depuis un fichier File (input[type=file]).
   */
  static importFromFile(file: File): Promise<TourData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw       = JSON.parse(e.target?.result as string);
          const validated = TourSerializer.validateTourData(raw);
          resolve(validated);
        } catch (err: any) {
          reject(new Error('Fichier JSON invalide : ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  }

  /* ── Nettoyage ──────────────────────────────────────────────────────── */

  /**
   * Retourne une copie propre sans champs techniques superflus.
   */
  static cleanTourData(data: TourData): TourData {
    const clean: TourData = {
      name:         data.name || 'Visite Virtuelle',
      initialScene: data.initialScene,
      scenes:       {},
    };

    Object.entries(data.scenes || {}).forEach(([id, scene]) => {
      clean.scenes[id] = {
        name:     scene.name || id,
        image:    scene.image || '',
        hotspots: (scene.hotspots || []).map(h => {
          const base: TourHotspot = {
            id:    h.id,
            type:  h.type,
            yaw:   round(h.yaw),
            pitch: round(h.pitch),
          };
          if (h.type === 'navigate') {
            base.target = h.target || '';
            if (h.label) base.label = h.label;
          } else {
            base.title       = h.title       || '';
            base.description = h.description || '';
          }
          return base;
        }),
      };
    });

    return clean;
  }

  /* ── Validation ─────────────────────────────────────────────────────── */

  static validateTourData(data: any): TourData {
    if (!data || typeof data !== 'object') throw new Error('Format de données invalide');
    if (!data.scenes || typeof data.scenes !== 'object') throw new Error('Aucune scène trouvée');

    const validated: TourData = {
      name: data.name || 'Visite Virtuelle',
      initialScene: data.initialScene,
      scenes: {}
    };

    Object.entries(data.scenes).forEach(([id, scene]: [string, any]) => {
      validated.scenes[id] = {
        name:     scene.name || id,
        image:    scene.image || '',
        hotspots: (scene.hotspots || []).map((h: any) => ({
          id:          h.id || `hs-${Math.random().toString(36).substr(2, 9)}`,
          type:        h.type || 'info',
          yaw:         round(h.yaw),
          pitch:       round(h.pitch),
          target:      h.target,
          label:       h.label,
          title:       h.title,
          description: h.description
        }))
      };
    });

    if (!validated.initialScene && Object.keys(validated.scenes).length > 0) {
      validated.initialScene = Object.keys(validated.scenes)[0];
    }

    return validated;
  }

  /* ── Données de démonstration ───────────────────────────────────────── */

  static generateDemoData(): TourData {
    return {
      name:         'Visite Démo — Appartement',
      initialScene: 'salon',
      scenes: {
        salon: {
          name:  'Salon',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Above_Gotham.jpg/2560px-Above_Gotham.jpg',
          hotspots: [
            {
              id:     'hs-cuisine',
              type:   'navigate',
              yaw:    45,
              pitch:  -8,
              target: 'cuisine',
              label:  'Vers la Cuisine',
            },
            {
              id:          'hs-canape',
              type:        'info',
              yaw:         -90,
              pitch:       5,
              title:       'Canapé',
              description: 'Canapé en cuir naturel, 3 places, réalisé par un artisan local.',
            },
            {
              id:          'hs-biblio',
              type:        'info',
              yaw:         160,
              pitch:       10,
              title:       'Bibliothèque',
              description: 'Bibliothèque sur mesure en chêne massif, 400 ouvrages.',
            },
          ],
        },
        cuisine: {
          name:  'Cuisine',
          image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=2560',
          hotspots: [
            {
              id:     'hs-salon',
              type:   'navigate',
              yaw:    -135,
              pitch:  -5,
              target: 'salon',
              label:  'Vers le Salon',
            },
            {
              id:          'hs-ilot',
              type:        'info',
              yaw:         30,
              pitch:       5,
              title:       'Îlot central',
              description: 'Plan de travail en marbre de Carrare blanc, 3m × 1,2m.',
            },
          ],
        },
      },
    };
  }
}

function round(n: number) { return Math.round((n ?? 0) * 100) / 100; }
