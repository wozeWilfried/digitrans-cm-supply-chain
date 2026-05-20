package cm.camtech.digitrans.scm.controller;

import cm.camtech.digitrans.scm.entity.AuditLog;
import cm.camtech.digitrans.scm.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur d'audit — Consultation des logs de traçabilité
 * Conformité loi camerounaise n°2010/012
 * Réservé aux administrateurs
 */
@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit & Traçabilité", description = "Logs de sécurité et conformité (ADMIN uniquement)")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @Operation(summary = "Lister tous les logs d'audit")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllLogs(
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "100") Integer limit) {

        List<AuditLog> logs;

        if (userEmail != null && !userEmail.isBlank()) {
            logs = auditLogRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        } else if (action != null && !action.isBlank()) {
            try {
                AuditLog.AuditAction auditAction = AuditLog.AuditAction.valueOf(action.toUpperCase());
                logs = auditLogRepository.findByActionOrderByCreatedAtDesc(auditAction);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Action invalide"));
            }
        } else if (entityType != null && !entityType.isBlank()) {
            logs = auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType);
        } else if (status != null && !status.isBlank()) {
            try {
                AuditLog.AuditStatus auditStatus = AuditLog.AuditStatus.valueOf(status.toUpperCase());
                logs = auditLogRepository.findByStatusOrderByCreatedAtDesc(auditStatus);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Statut invalide"));
            }
        } else {
            logs = auditLogRepository.findAll();
        }

        List<?> result = logs.stream()
                .limit(limit)
                .map(this::mapAuditLog)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "total", logs.size(),
                "limit", limit,
                "data", result
        ));
    }

    @Operation(summary = "Tous les accès refusés (403)")
    @GetMapping("/denied-access")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDeniedAccess() {
        List<AuditLog> logs = auditLogRepository.findAllDeniedAccess();
        List<?> result = logs.stream()
                .map(this::mapAuditLog)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("total", logs.size(), "data", result));
    }

    @Operation(summary = "Tentatives de login échouées")
    @GetMapping("/failed-logins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getFailedLogins(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(7);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        List<AuditLog> logs = auditLogRepository.findFailedLogins(start, end);
        List<?> result = logs.stream()
                .map(this::mapAuditLog)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "period", Map.of("start", start, "end", end),
                "total", logs.size(),
                "data", result
        ));
    }

    @Operation(summary = "Activité d'un utilisateur sur une période")
    @GetMapping("/user-activity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserActivity(
            @RequestParam String userEmail,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        List<AuditLog> logs = auditLogRepository.findUserActivityBetweenDates(userEmail, start, end);
        if (logs.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Aucune activité trouvée pour cet utilisateur"));
        }

        List<?> result = logs.stream()
                .map(this::mapAuditLog)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "user", userEmail,
                "period", Map.of("start", start, "end", end),
                "total", logs.size(),
                "data", result
        ));
    }

    @Operation(summary = "Modifications sur une entité spécifique")
    @GetMapping("/entity-history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEntityModifications(
            @RequestParam String entityType,
            @RequestParam Long entityId) {

        List<AuditLog> logs = auditLogRepository.findModificationsForEntity(entityType, entityId);
        if (logs.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Aucune modification trouvée"));
        }

        List<?> result = logs.stream()
                .map(this::mapAuditLog)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "entity", Map.of("type", entityType, "id", entityId),
                "total", logs.size(),
                "data", result
        ));
    }

    @Operation(summary = "Événement d'audit par ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAuditLogById(@PathVariable Long id) {
        return auditLogRepository.findById(id)
                .map(log -> ResponseEntity.ok(mapAuditLog(log)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Log d'audit introuvable", "id", id)));
    }

    @Operation(summary = "Export des logs d'audit (30 derniers jours)")
    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> exportAuditLogs() {
        LocalDateTime start = LocalDateTime.now().minusDays(30);
        LocalDateTime end = LocalDateTime.now();

        List<AuditLog> logs = auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        List<?> result = logs.stream()
                .map(this::mapAuditLog)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "exportDate", LocalDateTime.now(),
                "period", Map.of("start", start, "end", end),
                "total", logs.size(),
                "data", result,
                "note", "Export conforme loi camerounaise n°2010/012"
        ));
    }

    // ─── Utilitaires ───────────────────────────────────────────

    private Map<String, Object> mapAuditLog(AuditLog log) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", log.getId());
        result.put("userEmail", log.getUserEmail());
        result.put("userName", log.getUserName());
        result.put("userRole", log.getUserRole());
        result.put("action", log.getAction());
        result.put("entityType", log.getEntityType());
        result.put("entityId", log.getEntityId());
        result.put("entityDescription", log.getEntityDescription());
        result.put("httpMethod", log.getHttpMethod());
        result.put("endpoint", log.getEndpoint());
        result.put("responseStatus", log.getResponseStatus());
        result.put("ipAddress", log.getIpAddress());
        result.put("userAgent", log.getUserAgent());
        result.put("status", log.getStatus());
        result.put("reason", log.getReason());
        result.put("createdAt", log.getCreatedAt());
        return result;
    }
}
