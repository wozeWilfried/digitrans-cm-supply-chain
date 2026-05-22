package cm.camtech.digitrans.scm.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre d'audit — Enregistre tous les accès HTTP
 * Conformité loi camerounaise n°2010/012
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditInterceptor extends OncePerRequestFilter {

    private final AuditService auditService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Ne pas auditer les health checks et assets
        String uri = request.getRequestURI();
        if (shouldSkipAudit(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);

            // Audit après succès
            long duration = System.currentTimeMillis() - startTime;
            log.info("AUDIT_HTTP: {} {} | Status: {} | Duration: {}ms | IP: {}",
                    request.getMethod(),
                    uri,
                    response.getStatus(),
                    duration,
                    AuditService.getClientIp(request)
            );

        } catch (Exception ex) {
            log.error("AUDIT_ERROR: {} {} | Exception: {} | IP: {}",
                    request.getMethod(),
                    uri,
                    ex.getMessage(),
                    AuditService.getClientIp(request)
            );
            throw ex;
        }
    }

    /**
     * Défini les endpoints à ignorer pour l'audit (health, swagger, assets)
     */
    private boolean shouldSkipAudit(String uri) {
        return uri.startsWith("/actuator") ||
                uri.startsWith("/swagger") ||
                uri.startsWith("/api-docs") ||
                uri.startsWith("/webjars") ||
                uri.endsWith(".js") ||
                uri.endsWith(".css") ||
                uri.endsWith(".png") ||
                uri.endsWith(".jpg") ||
                uri.endsWith(".gif") ||
                uri.endsWith(".svg") ||
                uri.endsWith(".woff");
    }
}
