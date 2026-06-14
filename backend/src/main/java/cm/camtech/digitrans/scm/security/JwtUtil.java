package cm.camtech.digitrans.scm.security;

import cm.camtech.digitrans.scm.entity.Utilisateur;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utilitaire JWT — Génération, validation et extraction des tokens
 */
@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret:}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    // ─── Génération ─────────────────────────────────────────────
    public String generateToken(Utilisateur user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("nom", user.getNom() + " " + user.getPrenom());
        return buildToken(claims, user.getEmail(), expiration);
    }

    public String generateRefreshToken(Utilisateur user) {
        return buildToken(new HashMap<>(), user.getEmail(), refreshExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long ttl) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + ttl))
                .signWith(getSignKey())
                .compact();
    }

    // ─── Validation ─────────────────────────────────────────────
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ─── Extraction ─────────────────────────────────────────────
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSignKey() {
        // Sécurité pour le build Maven : si la clé est absente, vide ou trop courte (< 32 caractères/octets),
        // on génère une clé temporaire valide pour éviter une exception de clé non sécurisée (HMAC-SHA minimum 256-bit).
        String validKey = (secretKey == null || secretKey.trim().isEmpty() || secretKey.getBytes(StandardCharsets.UTF_8).length < 32)
                ? "maCleSecreteSuperSecuriseeDePlusDeTrenteDeuxCaracteresDigitransScm2026"
                : secretKey;

        byte[] keyBytes = validKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}