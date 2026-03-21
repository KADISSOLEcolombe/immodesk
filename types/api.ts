// Types correspondants aux modèles Django

// ===== UTILISATEURS =====
export type UserRole = 'superadmin' | 'proprietaire' | 'locataire';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

// ===== PATRIMOINE =====
export interface Categorie {
  id: string;
  nom: string;
  type_detail: string;
  created_at: string;
}

export type TypeLogement = 'studio' | 't1' | 't2' | 't3' | 't4' | 'house' | 'villa' | 'commercial';
export type StatutBien = 'vacant' | 'loue' | 'maintenance' | 'reservation';

export interface Immeuble {
  id: string;
  proprietaire: string;
  nom: string;
  description: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
  lien_maps: string;
  type_logement: TypeLogement;
  nombre_etages: number | null;
  annee_construction: number | null;
  created_at: string;
  updated_at: string;
}

export interface Bien {
  id: string;
  immeuble: string | null;
  proprietaire: string;
  categorie: string;
  titre: string;
  description: string;
  adresse_complete: string;
  surface: number;
  nombre_pieces: number;
  nombre_chambres: number;
  nombre_salles_bain: number;
  etage: number | null;
  numero_appartement: string;
  statut: StatutBien;
  loyer_mensuel: number;
  charges_mensuelles: number;
  depot_garantie: number;
  date_disponibilite: string | null;
  meuble: boolean;
  parking: boolean;
  ascenseur: boolean;
  balcon: boolean;
  jardin: boolean;
  piscine: boolean;
  climatisation: boolean;
  chauffage: boolean;
  securite: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface SoumissionBien {
  id: string;
  proprietaire: string;
  titre: string;
  description: string;
  adresse_complete: string;
  surface: number;
  nombre_pieces: number;
  nombre_chambres: number;
  loyer_mensuel: number;
  charges_mensuelles: number;
  depot_garantie: number;
  meuble: boolean;
  images: string[];
  statut: 'brouillon' | 'soumis' | 'publie' | 'refuse';
  commentaire_refus: string | null;
  date_soumission: string;
  date_publication: string | null;
  created_at: string;
  updated_at: string;
}

// ===== LOCATIONS =====
export interface Locataire {
  id: string;
  user: string;
  telephone: string;
  date_naissance: string;
  lieu_naissance: string;
  nationalite: string;
  piece_identite: string;
  numero_piece: string;
  date_expiration_piece: string;
  revenu_mensuel: number;
  profession: string;
  employeur: string;
  telephone_employeur: string;
  references_personnelles: string;
  garant_nom: string | null;
  garant_telephone: string | null;
  garant_revenu: number | null;
  garant_profession: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bail {
  id: string;
  locataire: string;
  bien: string;
  date_debut: string;
  date_fin: string;
  loyer_mensuel: number;
  charges_mensuelles: number;
  depot_garantie: number;
  indexation_annuelle: boolean;
  taux_indexation: number;
  date_derniere_revision: string | null;
  montant_apres_revision: number | null;
  conditions_particulieres: string;
  statut: 'actif' | 'termine' | 'suspendu';
  date_signature: string;
  created_at: string;
  updated_at: string;
}

export interface AvisLocataire {
  id: string;
  locataire: string;
  bien: string;
  note: number; // 1-5
  commentaire: string;
  date_avis: string;
  created_at: string;
  updated_at: string;
}

// ===== COMPTABILITÉ =====
export type StatutPaiement = 'paye' | 'en_retard' | 'impaye';
export type SourcePaiement = 'manuel' | 'mixx_by_yas' | 'moov_money' | 'carte_bancaire';
export type CategorieDepense = 'travaux' | 'taxe' | 'frais_agence' | 'copropriete' | 'autre';

export interface Paiement {
  id: string;
  bail: string;
  bail_id?: string; // pour les listes
  bail_detail?: {
    id: string;
    loyer_mensuel: number;
    locataire_nom: string;
    bien_adresse: string;
  };
  intitule: string;
  montant: number;
  date_paiement: string;
  mois_concerne: string; // Format YYYY-MM-01
  statut: StatutPaiement;
  source_paiement: SourcePaiement;
  transaction_ref?: string;
  created_at: string;
}

export interface Depense {
  id: string;
  bien: string;
  bien_id?: string; // pour les listes
  categorie: CategorieDepense;
  intitule: string;
  montant: number;
  description: string;
  date_depense: string;
  justificatif?: string | null;
  created_at: string;
}

export interface BalanceItem {
  bien_id: string;
  adresse: string;
  periode_debut: string;
  periode_fin: string;
  total_revenus: number;
  total_depenses: number;
  benefice_net: number;
  nombre_paiements: number;
  nombre_depenses: number;
}

export interface Balance {
  periode_debut: string;
  periode_fin: string;
  items: BalanceItem[];
  total_global_revenus: number;
  total_global_depenses: number;
  benefice_net_global: number;
}

// ===== PAIEMENTS EN LIGNE (Module 5) =====
export type MoyenPaiement = 'mixx_by_yas' | 'moov_money' | 'carte_bancaire';
export type StatutTransaction = 'en_attente' | 'valide' | 'echoue' | 'annule';

export interface TransactionPaiement {
  id: string;
  bail: string;
  locataire: string;
  montant: number;
  moyen_paiement: MoyenPaiement;
  statut: StatutTransaction;
  reference: string; // Format: IMD-YYYY-XXXX
  numero_telephone?: string | null; // Mobile Money uniquement
  derniers_chiffres_carte?: string | null; // Carte uniquement (4 derniers chiffres)
  date_initiation: string;
  date_validation?: string | null;
  mois_concerne: string; // Format YYYY-MM-01
  message_retour?: string;
}

export interface ConfigSimulateur {
  id: string;
  moyen_paiement: MoyenPaiement;
  taux_succes: number; // 0-100
  delai_secondes: number;
  actif: boolean;
}

// Legacy types (gardés pour compatibilité)
export type PaymentChannel = 'mobile_money' | 'card' | 'manual';
export type MobileOperator = 'mix' | 'moov' | 'tmoney';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'canceled';

export interface Transaction {
  id: string;
  reference: string;
  bail: string;
  montant: number;
  canal: PaymentChannel;
  operateur?: MobileOperator;
  telephone?: string;
  carte_derniers_chiffres?: string;
  statut: PaymentStatus;
  date_initiation: string;
  date_paiement?: string;
  date_echec?: string;
  motif_echec?: string;
  created_at: string;
  updated_at: string;
}
