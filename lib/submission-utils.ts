import { DonneesFormulaireSoumission } from '@/types/api';
import { normalizeMediaUrl } from '@/lib/utils';

export type SubmissionPropertyInfo = {
  adresse: string;
  type: string;
  loyer: number;
  charges: number;
  surface: number;
  pieces: number;
  description: string;
  equipements: string[];
  photos: string[];
  standing: string;
  etage: string;
  categorie: string;
  amenagement: string;
  accessibilite: string[];
  espacesExterieurs: string[];
  mapsLink: string;
  latitude: number | null;
  longitude: number | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function normalizePhotoCandidate(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }

    return normalizeMediaUrl(trimmed.replaceAll('\\\\', '/'));
  }

  if (value && typeof value === 'object') {
    const asRecord = value as Record<string, unknown>;
    const urlCandidate =
      (typeof asRecord.fichier === 'string' && asRecord.fichier) ||
      (typeof asRecord.url === 'string' && asRecord.url) ||
      (typeof asRecord.path === 'string' && asRecord.path) ||
      null;

    return urlCandidate ? normalizeMediaUrl(urlCandidate.replaceAll('\\\\', '/')) : null;
  }

  return null;
}

export function getSubmissionPropertyInfo(data: DonneesFormulaireSoumission): SubmissionPropertyInfo {
  const rawData = data as unknown as Record<string, unknown>;

  const photoCandidates: unknown[] = [
    ...(Array.isArray(data.photos) ? data.photos : []),
    ...(Array.isArray(rawData.images) ? rawData.images : []),
    ...(Array.isArray(rawData.photos_urls) ? rawData.photos_urls : []),
    ...(Array.isArray(rawData.fichiers) ? rawData.fichiers : []),
    rawData.photo_principale,
  ];

  const photos = Array.from(
    new Set(photoCandidates.map(normalizePhotoCandidate).filter((entry): entry is string => Boolean(entry))),
  );

  return {
    adresse: data.adresse || 'Adresse non spécifiée',
    type: data.type_logement || 'Type non spécifié',
    loyer: Number(data.loyer_hc || 0),
    charges: Number(data.charges || 0),
    surface: Number(data.surface_m2 || 0),
    pieces: Number(data.nb_pieces || 0),
    description: data.description || '',
    equipements: toStringArray(data.equipements),
    photos,
    standing: typeof data.standing === 'string' ? data.standing : '',
    etage: typeof data.etage === 'string' || typeof data.etage === 'number' ? String(data.etage) : '',
    categorie: typeof data.categorie_logement === 'string' ? data.categorie_logement : '',
    amenagement: typeof data.amenagement === 'string' ? data.amenagement : '',
    accessibilite: toStringArray(data.accessibilite),
    espacesExterieurs: toStringArray(data.espaces_exterieurs),
    mapsLink: typeof data.lien_maps === 'string' ? data.lien_maps : '',
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
  };
}
