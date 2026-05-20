-- ================================================================
--  DIGITRANS-SCM — Migration Flyway V1
--  Schéma initial Supply Chain | AGROCAM S.A.
--  Base : MySQL 8.0 | Fuseau : Africa/Douala (UTC+1)
--  Auteurs : DONGMO WOZE, KENNETH TAGNE, KAMGA Ludovic
-- ================================================================

SET NAMES utf8mb4;
SET time_zone = '+01:00';

-- ─── Utilisateurs ─────────────────────────────────────────────────
CREATE TABLE utilisateurs (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(100)  NOT NULL,
    prenom       VARCHAR(100)  NOT NULL,
    email        VARCHAR(150)  NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255)  NOT NULL,
    role         ENUM('ADMIN','MANAGER','AGENT_TERRAIN') NOT NULL DEFAULT 'AGENT_TERRAIN',
    actif        TINYINT(1)    NOT NULL DEFAULT 1,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Catégories produits ───────────────────────────────────────────
CREATE TABLE categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Produits ──────────────────────────────────────────────────────
CREATE TABLE produits (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    reference     VARCHAR(50)   NOT NULL UNIQUE,
    nom           VARCHAR(150)  NOT NULL,
    description   VARCHAR(500),
    prix_unitaire DECIMAL(10,2) NOT NULL,
    unite         VARCHAR(20)   NOT NULL,
    categorie_id  BIGINT,
    actif         TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_produit_categorie FOREIGN KEY (categorie_id)
        REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Entrepôts / Sites de stockage ────────────────────────────────
CREATE TABLE entrepots (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom        VARCHAR(150) NOT NULL,
    adresse    VARCHAR(255) NOT NULL,
    ville      VARCHAR(100),
    type       ENUM('PLANTATION','TRANSFORMATION','POINT_VENTE','ENTREPOT_CENTRAL') NOT NULL,
    latitude   DECIMAL(9,6),
    longitude  DECIMAL(9,6),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Stocks ────────────────────────────────────────────────────────
CREATE TABLE stocks (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    produit_id       BIGINT        NOT NULL,
    entrepot_id      BIGINT        NOT NULL,
    quantite         DECIMAL(12,3) NOT NULL DEFAULT 0,
    seuil_alerte     DECIMAL(12,3) NOT NULL DEFAULT 0,
    quantite_max     DECIMAL(12,3),
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stock_produit_entrepot (produit_id, entrepot_id),
    CONSTRAINT fk_stock_produit  FOREIGN KEY (produit_id)  REFERENCES produits(id),
    CONSTRAINT fk_stock_entrepot FOREIGN KEY (entrepot_id) REFERENCES entrepots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Fournisseurs ──────────────────────────────────────────────────
CREATE TABLE fournisseurs (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    raison_sociale      VARCHAR(200) NOT NULL,
    email               VARCHAR(100) NOT NULL UNIQUE,
    telephone           VARCHAR(20),
    adresse             VARCHAR(255),
    ville               VARCHAR(100),
    numero_contribuable VARCHAR(20),
    statut              ENUM('ACTIF','INACTIF','SUSPENDU','EN_EVALUATION') NOT NULL DEFAULT 'ACTIF',
    score_fiabilite     DECIMAL(3,2) DEFAULT 5.00,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Commandes Fournisseurs ────────────────────────────────────────
CREATE TABLE commandes_fournisseurs (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero                   VARCHAR(30)   NOT NULL UNIQUE,
    fournisseur_id           BIGINT        NOT NULL,
    entrepot_destination_id  BIGINT,
    statut                   ENUM('BROUILLON','SOUMISE','VALIDEE','EN_COURS_LIVRAISON',
                                  'LIVREE_PARTIELLE','LIVREE','ANNULEE') NOT NULL DEFAULT 'BROUILLON',
    date_prevue_livraison    DATETIME      NOT NULL,
    montant_total            DECIMAL(15,2),
    notes                    VARCHAR(500),
    created_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME      ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cmd_fournisseur  FOREIGN KEY (fournisseur_id)          REFERENCES fournisseurs(id),
    CONSTRAINT fk_cmd_entrepot     FOREIGN KEY (entrepot_destination_id) REFERENCES entrepots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Lignes de Commande ────────────────────────────────────────────
CREATE TABLE lignes_commande (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    commande_id         BIGINT        NOT NULL,
    produit_id          BIGINT        NOT NULL,
    quantite_commandee  DECIMAL(12,3) NOT NULL,
    quantite_recue      DECIMAL(12,3) NOT NULL DEFAULT 0,
    prix_unitaire       DECIMAL(10,2) NOT NULL,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ligne_commande FOREIGN KEY (commande_id) REFERENCES commandes_fournisseurs(id) ON DELETE CASCADE,
    CONSTRAINT fk_ligne_produit  FOREIGN KEY (produit_id)  REFERENCES produits(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Livraisons ────────────────────────────────────────────────────
CREATE TABLE livraisons (
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero                    VARCHAR(30) NOT NULL UNIQUE,
    commande_id               BIGINT      NOT NULL,
    statut                    ENUM('PLANIFIEE','EN_TRANSIT','AU_PORT_DOUALA',
                                   'EN_DEDOUANEMENT','LIVREE','REJETEE','PARTIELLE')
                              NOT NULL DEFAULT 'PLANIFIEE',
    date_expedition           DATETIME,
    date_livraison_effective  DATETIME,
    transporteur              VARCHAR(100),
    numero_tracking           VARCHAR(50),
    latitude_actuelle         DECIMAL(9,6),
    longitude_actuelle        DECIMAL(9,6),
    notes                     VARCHAR(500),
    created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_livraison_commande FOREIGN KEY (commande_id) REFERENCES commandes_fournisseurs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Mouvements de Stock ───────────────────────────────────────────
CREATE TABLE mouvements_stock (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    produit_id               BIGINT        NOT NULL,
    entrepot_source_id       BIGINT,
    entrepot_destination_id  BIGINT,
    livraison_id             BIGINT,
    type                     ENUM('ENTREE','SORTIE','TRANSFERT',
                                  'AJUSTEMENT_POSITIF','AJUSTEMENT_NEGATIF') NOT NULL,
    quantite                 DECIMAL(12,3) NOT NULL,
    date_mouvement           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motif                    VARCHAR(500),
    operateur                VARCHAR(100),
    created_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mouv_produit    FOREIGN KEY (produit_id)              REFERENCES produits(id),
    CONSTRAINT fk_mouv_source     FOREIGN KEY (entrepot_source_id)      REFERENCES entrepots(id),
    CONSTRAINT fk_mouv_dest       FOREIGN KEY (entrepot_destination_id) REFERENCES entrepots(id),
    CONSTRAINT fk_mouv_livraison  FOREIGN KEY (livraison_id)            REFERENCES livraisons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Index pour performances ───────────────────────────────────────
CREATE INDEX idx_stocks_entrepot     ON stocks(entrepot_id);
CREATE INDEX idx_stocks_produit      ON stocks(produit_id);
CREATE INDEX idx_mouvements_produit  ON mouvements_stock(produit_id);
CREATE INDEX idx_mouvements_date     ON mouvements_stock(date_mouvement);
CREATE INDEX idx_commandes_statut    ON commandes_fournisseurs(statut);
CREATE INDEX idx_livraisons_statut   ON livraisons(statut);
CREATE INDEX idx_livraisons_commande ON livraisons(commande_id);

-- ─── Données initiales ─────────────────────────────────────────────

-- Admin par défaut (mot de passe : Admin@2026 — à changer en prod)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('DONGMO', 'Wilfried', 'admin@agrocam.cm',
 '$2a$12$LqG1gJ9j6p7K2wF3aB8cXOuP5sR7mN4qE6dH1iT3vM9yC2kZ0eW8u', 'ADMIN');

-- Catégories produits AGROCAM
INSERT INTO categories (nom, description) VALUES
('Cacao',             'Fèves de cacao et produits dérivés'),
('Café',              'Grains de café Arabica et Robusta du Cameroun'),
('Produits transformés', 'Produits alimentaires finis SavoirManger'),
('Emballages',        'Matériaux d''emballage et conditionnement');

-- Entrepôts principaux AGROCAM
INSERT INTO entrepots (nom, adresse, ville, type, latitude, longitude) VALUES
('Plantation Nord Cameroun',    'Route Garoua, BP 145',         'Garoua',  'PLANTATION',        9.3265,  13.3972),
('Unité Transformation Douala', 'Zone Industrielle Bassa',      'Douala',  'TRANSFORMATION',    4.0511,   9.7679),
('Point de Vente Akwa',         'Rue Joss, Akwa',               'Douala',  'POINT_VENTE',       4.0435,   9.6974),
('Entrepôt Central Douala',     'Port de Douala, Quai 7',       'Douala',  'ENTREPOT_CENTRAL',  4.0579,   9.7043),
('Point de Vente Yaoundé',      'Avenue Kennedy, Centre-ville', 'Yaoundé', 'POINT_VENTE',       3.8667,  11.5167);
