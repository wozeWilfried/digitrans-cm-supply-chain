package cm.camtech.digitrans.scm.repository;

import cm.camtech.digitrans.scm.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Recherche par utilisateur
    List<AuditLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    // Recherche par action
    List<AuditLog> findByActionOrderByCreatedAtDesc(AuditLog.AuditAction action);

    // Recherche par entité
    List<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType);

    // Recherche par plage de dates
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    // Recherche par statut
    List<AuditLog> findByStatusOrderByCreatedAtDesc(AuditLog.AuditStatus status);

    // Requête complexe : tous les accès refusés
    @Query("SELECT a FROM AuditLog a WHERE a.status = 'DENIED' ORDER BY a.createdAt DESC")
    List<AuditLog> findAllDeniedAccess();

    // Requête : activité suspecte (multiples échecs de connexion)
    @Query("SELECT a FROM AuditLog a WHERE a.action = 'LOGIN' AND a.status = 'FAILED' " +
           "AND a.createdAt BETWEEN :start AND :end ORDER BY a.createdAt DESC")
    List<AuditLog> findFailedLogins(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Requête : modifications sur une entité spécifique
    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType AND a.entityId = :entityId " +
           "AND a.action IN ('UPDATE', 'DELETE') ORDER BY a.createdAt DESC")
    List<AuditLog> findModificationsForEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);

    // Requête : toutes les actions d'un utilisateur sur une période
    @Query("SELECT a FROM AuditLog a WHERE a.userEmail = :userEmail " +
           "AND a.createdAt BETWEEN :start AND :end ORDER BY a.createdAt DESC")
    List<AuditLog> findUserActivityBetweenDates(@Param("userEmail") String userEmail,
                                                 @Param("start") LocalDateTime start,
                                                 @Param("end") LocalDateTime end);
}
