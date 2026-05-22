package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité AuditLog — Traçabilité et conformité
 * Loi camerounaise n°2010/012 sur la cybersécurité et la traçabilité
 * 
 * Enregistre tous les accès aux ressources, modifications, et événements de sécurité
 * Rétention : 7 ans (selon normes internationales)
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "user_email"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_timestamp", columnList = "created_at"),
    @Index(name = "idx_audit_entity", columnList = "entity_type")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Identité de l'utilisateur ──────────────────────────────
    @Column(nullable = false, length = 150)
    private String userEmail;

    @Column(length = 200)
    private String userName; // Nom complet pour traçabilité

    @Column(length = 50)
    private String userRole; // ADMIN, MANAGER, AGENT_TERRAIN

    // ─── Action effectuée ──────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action; // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS_DENIED

    // ─── Ressource affectée ────────────────────────────────────
    @Column(nullable = false, length = 100)
    private String entityType; // Stock, Fournisseur, CommandeFournisseur, etc.

    @Column
    private Long entityId; // ID de la ressource affectée

    @Column(length = 255)
    private String entityDescription; // Description lisible (ex: "Stock ID=5, Produit: Cacao")

    // ─── Détails de la requête ─────────────────────────────────
    @Column(length = 20)
    private String httpMethod; // GET, POST, PUT, DELETE, PATCH

    @Column(length = 500)
    private String endpoint; // /api/v1/stocks/123

    @Column
    private String requestParams; // Paramètres JSON

    @Column
    private String responseStatus; // 200, 201, 400, 401, 403, 500

    // ─── Informations de sécurité ──────────────────────────────
    @Column(length = 45)
    private String ipAddress; // IPv4 ou IPv6

    @Column(length = 255)
    private String userAgent; // Navigateur, App mobile, etc.

    @Column
    private String sessionId; // ID de session pour tracer la session

    // ─── Raison et statut ──────────────────────────────────────
    @Column(length = 500)
    private String reason; // Raison de l'accès refusé, détails d'erreur, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuditStatus status = AuditStatus.SUCCESS; // SUCCESS, FAILED, DENIED

    // ─── Timestamp ─────────────────────────────────────────────
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ─── Données sensibles (chiffrées en production) ────────────
    @Column
    private String dataChangesSummary; // Résumé des modifications (avant/après pour GDPR)

    // Enums
    public enum AuditAction {
        CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, ACCESS_DENIED, DOWNLOAD, EXPORT, PRINT
    }

    public enum AuditStatus {
        SUCCESS, FAILED, DENIED, TIMEOUT, ERROR
    }
}
