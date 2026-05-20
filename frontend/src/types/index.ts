// ================================================================
//  TYPES TYPESCRIPT — DIGITRANS-SCM Supply Chain
// ================================================================

// ─── Auth ──────────────────────────────────────────────────────────
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT_TERRAIN';
  actif: boolean;
}

export interface AuthState {
  user: Utilisateur | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Utilisateur;
}

// ─── Produits & Catégories ─────────────────────────────────────────
export interface Categorie {
  id: number;
  nom: string;
  description?: string;
}

export interface Produit {
  id: number;
  reference: string;
  nom: string;
  description?: string;
  prixUnitaire: number;
  unite: string;
  categorie?: Categorie;
  actif: boolean;
  createdAt: string;
}

// ─── Entrepôts ─────────────────────────────────────────────────────
export type TypeEntrepot =
  | 'PLANTATION'
  | 'TRANSFORMATION'
  | 'POINT_VENTE'
  | 'ENTREPOT_CENTRAL';

export interface Entrepot {
  id: number;
  nom: string;
  adresse: string;
  ville?: string;
  type: TypeEntrepot;
  latitude?: number;
  longitude?: number;
}

// ─── Stocks ────────────────────────────────────────────────────────
export interface Stock {
  id: number;
  produit: Produit;
  entrepot: Entrepot;
  quantite: number;
  seuilAlerte: number;
  quantiteMax?: number;
  enAlerte: boolean; // quantite < seuilAlerte
  updatedAt: string;
}

// ─── Fournisseurs ──────────────────────────────────────────────────
export type StatutFournisseur =
  | 'ACTIF'
  | 'INACTIF'
  | 'SUSPENDU'
  | 'EN_EVALUATION';

export interface Fournisseur {
  id: number;
  raisonSociale: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  numeroContribuable?: string;
  statut: StatutFournisseur;
  scoreFiabilite: number;
  createdAt: string;
}

// ─── Commandes ─────────────────────────────────────────────────────
export type StatutCommande =
  | 'BROUILLON'
  | 'SOUMISE'
  | 'VALIDEE'
  | 'EN_COURS_LIVRAISON'
  | 'LIVREE_PARTIELLE'
  | 'LIVREE'
  | 'ANNULEE';

export interface LigneCommande {
  id: number;
  produit: Produit;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixUnitaire: number;
  montantLigne: number;
}

export interface CommandeFournisseur {
  id: number;
  numero: string;
  fournisseur: Fournisseur;
  entrepotDestination?: Entrepot;
  statut: StatutCommande;
  datePrevueLivraison: string;
  montantTotal: number;
  notes?: string;
  lignes: LigneCommande[];
  createdAt: string;
}

// ─── Livraisons ────────────────────────────────────────────────────
export type StatutLivraison =
  | 'PLANIFIEE'
  | 'EN_TRANSIT'
  | 'AU_PORT_DOUALA'
  | 'EN_DEDOUANEMENT'
  | 'LIVREE'
  | 'REJETEE'
  | 'PARTIELLE';

export interface Livraison {
  id: number;
  numero: string;
  commande: CommandeFournisseur;
  statut: StatutLivraison;
  dateExpedition?: string;
  dateLivraisonEffective?: string;
  transporteur?: string;
  numeroTracking?: string;
  latitudeActuelle?: number;
  longitudeActuelle?: number;
  notes?: string;
  createdAt: string;
}

// ─── Mouvements de stock ───────────────────────────────────────────
export type TypeMouvement =
  | 'ENTREE'
  | 'SORTIE'
  | 'TRANSFERT'
  | 'AJUSTEMENT_POSITIF'
  | 'AJUSTEMENT_NEGATIF';

export interface MouvementStock {
  id: number;
  produit: Produit;
  entrepotSource?: Entrepot;
  entrepotDestination?: Entrepot;
  livraison?: Livraison;
  type: TypeMouvement;
  quantite: number;
  dateMouvement: string;
  motif?: string;
  operateur?: string;
}

// ─── Dashboard KPIs ────────────────────────────────────────────────
export interface DashboardKpis {
  stocksEnAlerte: number;
  commandesEnCours: number;
  livraisonsAujourdhui: number;
  livraisonsEnRetard: number;
  tauxDisponibiliteOffline: number;
  valeurTotaleStock: number;
  fournisseursActifs: number;
}

// ─── Pagination ────────────────────────────────────────────────────
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ─── API Response générique ────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}
