package cm.camtech.digitrans.scm.security;

import cm.camtech.digitrans.scm.entity.AuditLog;
import cm.camtech.digitrans.scm.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Service d'audit — Traçabilité conformité loi camerounaise n°2010/012
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Enregistre une action utilisateur (accès, création, modification, suppression)
     */
    public void logAction(
            AuditLog.AuditAction action,
            String entityType,
            Long entityId,
            String entityDescription,
            AuditLog.AuditStatus status,
            HttpServletRequest request,
            String reason) {

        String userEmail = getUserEmail();
        String userName = getUserFullName();
        String userRole = getUserRole();

        AuditLog auditLog = AuditLog.builder()
                .userEmail(userEmail)
                .userName(userName)
                .userRole(userRole)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityDescription(entityDescription)
                .httpMethod(request.getMethod())
                .endpoint(request.getRequestURI() + 
                         (request.getQueryString() != null ? "?" + request.getQueryString() : ""))
                .responseStatus("") // Sera complété par le contrôleur
                .ipAddress(getClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .sessionId(request.getSession(false) != null ? request.getSession().getId() : "ANONYMOUS")
                .status(status)
                .reason(reason)
                .build();

        auditLogRepository.save(auditLog);

        // Log texte pour traçabilité système
        log.info("AUDIT: {} | User: {} ({}) | Action: {} | Entity: {} #{} | IP: {} | Status: {} | Reason: {}",
                userRole,
                userName,
                userEmail,
                action,
                entityType,
                entityId,
                getClientIp(request),
                status,
                reason
        );
    }

    /**
     * Enregistre un événement de sécurité (login, access denied, etc.)
     */
    public void logSecurityEvent(
            AuditLog.AuditAction action,
            AuditLog.AuditStatus status,
            HttpServletRequest request,
            String details) {

        logAction(action, "SECURITY_EVENT", null, action.name(), status, request, details);
    }

    /**
     * Enregistre un accès refusé (403 Forbidden)
     */
    public void logAccessDenied(String resource, HttpServletRequest request, String reason) {
        logSecurityEvent(
                AuditLog.AuditAction.ACCESS_DENIED,
                AuditLog.AuditStatus.DENIED,
                request,
                "Accès refusé à: " + resource + " | Raison: " + reason
        );
    }

    /**
     * Enregistre une tentative de login échouée
     */
    public void logFailedLogin(String email, HttpServletRequest request, String reason) {
        AuditLog auditLog = AuditLog.builder()
                .userEmail(email)
                .userName(email)
                .userRole("UNKNOWN")
                .action(AuditLog.AuditAction.LOGIN)
                .entityType("AUTH")
                .httpMethod(request.getMethod())
                .endpoint(request.getRequestURI())
                .ipAddress(getClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .sessionId("FAILED_AUTH")
                .status(AuditLog.AuditStatus.FAILED)
                .reason(reason)
                .build();

        auditLogRepository.save(auditLog);
        log.warn("AUDIT: FAILED LOGIN attempt | Email: {} | IP: {} | Reason: {}", 
                email, getClientIp(request), reason);
    }

    /**
     * Enregistre une connexion réussie
     */
    public void logSuccessfulLogin(String email, HttpServletRequest request) {
        logSecurityEvent(
                AuditLog.AuditAction.LOGIN,
                AuditLog.AuditStatus.SUCCESS,
                request,
                "Connexion réussie"
        );
    }

    /**
     * Enregistre une déconnexion
     */
    public void logLogout(HttpServletRequest request) {
        logSecurityEvent(
                AuditLog.AuditAction.LOGOUT,
                AuditLog.AuditStatus.SUCCESS,
                request,
                "Déconnexion"
        );
    }

    // ─── Utilitaires ───────────────────────────────────────────

    private String getUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }
        return "ANONYMOUS";
    }

    private String getUserFullName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof cm.camtech.digitrans.scm.entity.Utilisateur user) {
            return user.getNom() + " " + user.getPrenom();
        }
        return "UNKNOWN";
    }

    private String getUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
            return auth.getAuthorities().stream()
                    .findFirst()
                    .map(ga -> ga.getAuthority().replace("ROLE_", ""))
                    .orElse("UNKNOWN");
        }
        return "UNKNOWN";
    }

    /**
     * Extrait l'IP réelle du client (gère les proxies, load balancers)
     */
    public static String getClientIp(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "CF-Connecting-IP",
                "True-Client-IP"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // Prendre la première IP si plusieurs (X-Forwarded-For peut contenir plusieurs IPs)
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }
}
