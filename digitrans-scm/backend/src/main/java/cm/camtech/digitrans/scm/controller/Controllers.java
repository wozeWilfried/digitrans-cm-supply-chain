package cm.camtech.digitrans.scm.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// ══════════════════════════════════════════════════════════════════
//  CONTRÔLEURS REST — DIGITRANS-SCM
// ══════════════════════════════════════════════════════════════════

// ─── Auth Controller ──────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Login / Refresh token")
class AuthController {

    @Operation(summary = "Connexion utilisateur — retourne un token JWT")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        // TODO: implémenter avec AuthService
        return ResponseEntity.ok(Map.of(
            "message", "Auth endpoint ready",
            "email", request.getEmail()
        ));
    }

    @Operation(summary = "Rafraîchir le token JWT")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        // TODO: implémenter avec AuthService
        return ResponseEntity.ok(Map.of("message", "Refresh endpoint ready"));
    }
}

@Data
class LoginRequest {
    @Email @NotBlank
    private String email;
    @NotBlank @Size(min = 6)
    private String motDePasse;
}

// ─── Stock Controller ─────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/stocks")
@RequiredArgsConstructor
@Tag(name = "Stocks", description = "Gestion des niveaux de stock par entrepôt")
class StockController {

    @Operation(summary = "Lister tous les stocks")
    @GetMapping
    public ResponseEntity<?> getAllStocks(
            @RequestParam(required = false) Long entrepotId,
            @RequestParam(required = false) Long produitId,
            @RequestParam(required = false) Boolean alerteSeulement) {
        // TODO: implémenter avec StockService
        return ResponseEntity.ok(Map.of("message", "Stock endpoint ready"));
    }

    @Operation(summary = "Stocks en alerte (niveau critique)")
    @GetMapping("/alertes")
    public ResponseEntity<?> getStocksEnAlerte() {
        return ResponseEntity.ok(Map.of("message", "Stock alertes endpoint ready"));
    }

    @Operation(summary = "Obtenir un stock par ID")
    @GetMapping("/{id}")
    public ResponseEntity<?> getStockById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("message", "Stock " + id + " endpoint ready"));
    }
}

// ─── Fournisseur Controller ───────────────────────────────────────
@RestController
@RequestMapping("/api/v1/fournisseurs")
@RequiredArgsConstructor
@Tag(name = "Fournisseurs", description = "Gestion des fournisseurs (plantations, partenaires)")
class FournisseurController {

    @Operation(summary = "Lister tous les fournisseurs")
    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String statut) {
        return ResponseEntity.ok(Map.of("message", "Fournisseurs endpoint ready"));
    }

    @Operation(summary = "Obtenir un fournisseur par ID")
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("id", id));
    }

    @Operation(summary = "Créer un fournisseur")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(201).body(Map.of("message", "Fournisseur créé"));
    }

    @Operation(summary = "Mettre à jour un fournisseur")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("message", "Fournisseur " + id + " mis à jour"));
    }
}

// ─── Commande Controller ──────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/commandes")
@RequiredArgsConstructor
@Tag(name = "Commandes", description = "Gestion des commandes fournisseurs")
class CommandeController {

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String statut) {
        return ResponseEntity.ok(Map.of("message", "Commandes endpoint ready"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(201).body(Map.of("message", "Commande créée"));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("message", "Statut mis à jour"));
    }
}

// ─── Livraison Controller ─────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/livraisons")
@RequiredArgsConstructor
@Tag(name = "Livraisons", description = "Suivi en temps réel des livraisons")
class LivraisonController {

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String statut) {
        return ResponseEntity.ok(Map.of("message", "Livraisons endpoint ready"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/{id}/position")
    public ResponseEntity<?> updatePosition(
            @PathVariable Long id,
            @RequestBody Map<String, Double> coords) {
        return ResponseEntity.ok(Map.of("message", "Position mise à jour"));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("message", "Statut livraison mis à jour"));
    }
}

// ─── Mouvement Stock Controller ───────────────────────────────────
@RestController
@RequestMapping("/api/v1/mouvements")
@RequiredArgsConstructor
@Tag(name = "Mouvements de stock", description = "Entrées, sorties, transferts — flux terrain")
class MouvementStockController {

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Long entrepotId,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(Map.of("message", "Mouvements endpoint ready"));
    }

    @PostMapping
    public ResponseEntity<?> enregistrer(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(201).body(Map.of("message", "Mouvement enregistré"));
    }
}

// ─── Dashboard Controller ─────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "KPIs et statistiques Supply Chain")
class DashboardController {

    @Operation(summary = "KPIs principaux du module Supply Chain")
    @GetMapping("/kpis")
    public ResponseEntity<?> getKpis() {
        // Retourne : stocks critiques, commandes en cours, livraisons du jour, etc.
        return ResponseEntity.ok(Map.of(
            "stocksEnAlerte", 0,
            "commandesEnCours", 0,
            "livraisonsAujourdhui", 0,
            "tauxDisponibilite", 0.0,
            "message", "Dashboard KPIs endpoint ready"
        ));
    }

    @Operation(summary = "Flux de marchandises en temps réel")
    @GetMapping("/flux")
    public ResponseEntity<?> getFluxTempsReel() {
        return ResponseEntity.ok(Map.of("message", "Flux temps réel endpoint ready"));
    }
}
