package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// ═══════════════════════════════════════════════════════════════════
//  ENTITÉS SUPPLY CHAIN — DIGITRANS-SCM
//  Modélisation du flux : Fournisseur → Stock → Commande → Livraison
// ═══════════════════════════════════════════════════════════════════

// ─── Classe de base avec audit ──────────────────────────────────────
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
abstract class BaseEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

// ─── Catégorie de produit ───────────────────────────────────────────
@Entity
@Table(name = "categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class Categorie extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String nom;

    @Column(length = 255)
    private String description;

    @OneToMany(mappedBy = "categorie", cascade = CascadeType.ALL)
    private List<Produit> produits = new ArrayList<>();
}

// ─── Produit ────────────────────────────────────────────────────────
@Entity
@Table(name = "produits")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class Produit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String reference;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(nullable = false, length = 20)
    private String unite; // kg, tonne, carton, litre...

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    private Categorie categorie;

    @Column(nullable = false)
    @Builder.Default
    private Boolean actif = true;
}

// ─── Entrepôt / Site de stockage ────────────────────────────────────
@Entity
@Table(name = "entrepots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class Entrepot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(nullable = false, length = 255)
    private String adresse;

    @Column(length = 100)
    private String ville;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeEntrepot type; // PLANTATION, TRANSFORMATION, POINT_VENTE

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @OneToMany(mappedBy = "entrepot", cascade = CascadeType.ALL)
    private List<Stock> stocks = new ArrayList<>();
}

enum TypeEntrepot {
    PLANTATION, TRANSFORMATION, POINT_VENTE, ENTREPOT_CENTRAL
}

// ─── Stock ──────────────────────────────────────────────────────────
@Entity
@Table(name = "stocks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"produit_id", "entrepot_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class Stock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_id", nullable = false)
    private Entrepot entrepot;

    @Column(nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantite = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal seuilAlerte = BigDecimal.ZERO; // Alerte si quantite < seuil

    @Column(precision = 12, scale = 3)
    private BigDecimal quantiteMax; // Capacité max de l'entrepôt
}

// ─── Fournisseur ────────────────────────────────────────────────────
@Entity
@Table(name = "fournisseurs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class Fournisseur extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String raisonSociale;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String telephone;

    @Column(length = 255)
    private String adresse;

    @Column(length = 100)
    private String ville;

    @Column(length = 20)
    private String numeroContribuable; // NIF Cameroun

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutFournisseur statut = StatutFournisseur.ACTIF;

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal scoreFiabilite = BigDecimal.valueOf(5.0); // Note /5

    @OneToMany(mappedBy = "fournisseur", cascade = CascadeType.ALL)
    private List<CommandeFournisseur> commandes = new ArrayList<>();
}

enum StatutFournisseur {
    ACTIF, INACTIF, SUSPENDU, EN_EVALUATION
}

// ─── Commande Fournisseur ───────────────────────────────────────────
@Entity
@Table(name = "commandes_fournisseurs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class CommandeFournisseur extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String numero; // CMD-2026-0001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_destination_id")
    private Entrepot entrepotDestination;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutCommande statut = StatutCommande.BROUILLON;

    @Column(nullable = false)
    private LocalDateTime datePrevueLivraison;

    @Column(precision = 15, scale = 2)
    private BigDecimal montantTotal;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneCommande> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Livraison> livraisons = new ArrayList<>();
}

enum StatutCommande {
    BROUILLON, SOUMISE, VALIDEE, EN_COURS_LIVRAISON, LIVREE_PARTIELLE, LIVREE, ANNULEE
}

// ─── Ligne de Commande ──────────────────────────────────────────────
@Entity
@Table(name = "lignes_commande")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class LigneCommande extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeFournisseur commande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantiteCommandee;

    @Column(precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantiteRecue = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;
}

// ─── Livraison ──────────────────────────────────────────────────────
@Entity
@Table(name = "livraisons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class Livraison extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String numero; // LIV-2026-0001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeFournisseur commande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutLivraison statut = StatutLivraison.PLANIFIEE;

    @Column
    private LocalDateTime dateExpedition;

    @Column
    private LocalDateTime dateLivraisonEffective;

    @Column(length = 100)
    private String transporteur;

    @Column(length = 50)
    private String numeroTracking; // Référence Port de Douala

    @Column(precision = 9, scale = 6)
    private BigDecimal latitudeActuelle;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitudeActuelle;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "livraison", cascade = CascadeType.ALL)
    @Builder.Default
    private List<MouvementStock> mouvements = new ArrayList<>();
}

enum StatutLivraison {
    PLANIFIEE, EN_TRANSIT, AU_PORT_DOUALA, EN_DEDOUANEMENT, LIVREE, REJETEE, PARTIELLE
}

// ─── Mouvement de Stock ─────────────────────────────────────────────
@Entity
@Table(name = "mouvements_stock")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class MouvementStock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_source_id")
    private Entrepot entrepotSource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_destination_id")
    private Entrepot entrepotDestination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "livraison_id")
    private Livraison livraison;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeMouvement type; // ENTREE, SORTIE, TRANSFERT, AJUSTEMENT

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantite;

    @Column(nullable = false)
    private LocalDateTime dateMouvement;

    @Column(length = 500)
    private String motif;

    @Column(length = 100)
    private String operateur; // Nom de l'agent terrain
}

enum TypeMouvement {
    ENTREE, SORTIE, TRANSFERT, AJUSTEMENT_POSITIF, AJUSTEMENT_NEGATIF
}
