-- ================================================================
--  DIGITRANS-SCM — Migration Flyway V2
--  Table d'audit et traçabilité
--  Conformité loi camerounaise n°2010/012
--  Auteurs : DONGMO WOZE, KENNETH TAGNE, KAMGA Ludovic
-- ================================================================

SET NAMES utf8mb4;
SET time_zone = '+01:00';

-- ─── Table d'audit ────────────────────────────────────────────
CREATE TABLE audit_logs (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_email              VARCHAR(150)  NOT NULL,
    user_name               VARCHAR(200),
    user_role               VARCHAR(50),
    action                  ENUM('CREATE','READ','UPDATE','DELETE','LOGIN','LOGOUT',
                                 'ACCESS_DENIED','DOWNLOAD','EXPORT','PRINT') NOT NULL,
    entity_type             VARCHAR(100)  NOT NULL,
    entity_id               BIGINT,
    entity_description      VARCHAR(255),
    http_method             VARCHAR(20),
    endpoint                VARCHAR(500)  NOT NULL,
    request_params          LONGTEXT,
    response_status         VARCHAR(20),
    ip_address              VARCHAR(45),
    user_agent              VARCHAR(255),
    session_id              VARCHAR(100),
    reason                  VARCHAR(500),
    status                  ENUM('SUCCESS','FAILED','DENIED','TIMEOUT','ERROR') NOT NULL,
    data_changes_summary    LONGTEXT,
    created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_user      (user_email),
    INDEX idx_audit_action    (action),
    INDEX idx_audit_timestamp (created_at),
    INDEX idx_audit_entity    (entity_type),
    INDEX idx_audit_ip        (ip_address),
    INDEX idx_audit_status    (status),
    
    CONSTRAINT fk_audit_uniqueness UNIQUE KEY (user_email, action, entity_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=COMPRESSED; -- Compression pour optimiser l'espace de stockage

-- ─── Table de conformité légale (métadonnées d'audit) ────────────
CREATE TABLE audit_compliance (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    compliance_rule         VARCHAR(100)  NOT NULL, -- LOI_2010_012, GDPR, SOX, etc.
    description             VARCHAR(500),
    retention_years         INT           DEFAULT 7,
    last_audit_date         DATETIME,
    next_audit_date         DATETIME,
    audit_officer           VARCHAR(150),
    notes                   LONGTEXT,
    created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME      ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Données initiales de conformité ───────────────────────────
INSERT INTO audit_compliance (compliance_rule, description, retention_years, audit_officer) VALUES
('LOI_2010_012', 'Loi camerounaise n°2010/012 du 25 décembre 2010 sur la cybersécurité et la criminologie informatique', 7, 'AGROCAM S.A. Compliance Officer'),
('RETENTION_POLICY', 'Politique de rétention des logs (7 ans = 2555 jours)', 7, 'Data Protection Officer'),
('GDPR_COMPLIANCE', 'Conformité RGPD pour données personnelles', 5, 'External Auditor');

-- ─── Procédure nettoyage automatique des logs anciens ──────────
-- (À exécuter via CRON job mensuel)
-- DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 YEAR);

-- Après exécution, vérifier :
-- SELECT COUNT(*) as total_logs FROM audit_logs;
-- SELECT DATE(created_at) as log_date, COUNT(*) as count FROM audit_logs GROUP BY DATE(created_at) ORDER BY log_date DESC LIMIT 30;
