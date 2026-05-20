package cm.camtech.digitrans.scm.controller;

import cm.camtech.digitrans.scm.entity.CommandeFournisseur;
import cm.camtech.digitrans.scm.entity.Entrepot;
import cm.camtech.digitrans.scm.entity.Fournisseur;
import cm.camtech.digitrans.scm.entity.Livraison;
import cm.camtech.digitrans.scm.entity.MouvementStock;
import cm.camtech.digitrans.scm.entity.Produit;
import cm.camtech.digitrans.scm.entity.Stock;
import cm.camtech.digitrans.scm.entity.StatutCommande;
import cm.camtech.digitrans.scm.entity.StatutFournisseur;
import cm.camtech.digitrans.scm.entity.StatutLivraison;
import cm.camtech.digitrans.scm.entity.TypeMouvement;
import cm.camtech.digitrans.scm.repository.CommandeFournisseurRepository;
import cm.camtech.digitrans.scm.repository.EntrepotRepository;
import cm.camtech.digitrans.scm.repository.FournisseurRepository;
import cm.camtech.digitrans.scm.repository.LivraisonRepository;
import cm.camtech.digitrans.scm.repository.MouvementStockRepository;
import cm.camtech.digitrans.scm.repository.ProduitRepository;
import cm.camtech.digitrans.scm.repository.StockRepository;
import cm.camtech.digitrans.scm.repository.UtilisateurRepository;
import cm.camtech.digitrans.scm.security.AuditService;
import cm.camtech.digitrans.scm.security.JwtUtil; // <--- AJOUTE CETTE LIGNE ICI !
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

// ══════════════════════════════════════════════════════════════════
//  CONTRÔLEURS REST — DIGITRANS-SCM
// ══════════════════════════════════════════════════════════════════

// ─── Auth Controller ──────────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Login / Refresh token")
class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    @Operation(summary = "Connexion utilisateur — retourne un token JWT")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
            );
        } catch (BadCredentialsException ex) {
            auditService.logFailedLogin(request.getEmail(), httpRequest, "Identifiants incorrects");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Identifiants incorrects"));
        }

        Optional<UserDetails> userDetails = utilisateurRepository.findByEmail(request.getEmail()).map(u -> (UserDetails) u);
        if (userDetails.isEmpty()) {
            auditService.logFailedLogin(request.getEmail(), httpRequest, "Utilisateur introuvable");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Utilisateur introuvable"));
        }

        String token = jwtUtil.generateToken((cm.camtech.digitrans.scm.entity.Utilisateur) userDetails.get());
        String refreshToken = jwtUtil.generateRefreshToken((cm.camtech.digitrans.scm.entity.Utilisateur) userDetails.get());

        auditService.logSuccessfulLogin(request.getEmail(), httpRequest);

        return ResponseEntity.ok(Map.of(
            "token", token,
            "refreshToken", refreshToken,
            "email", request.getEmail()
        ));
    }

    @Operation(summary = "Rafraîchir le token JWT")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body, HttpServletRequest httpRequest) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "refreshToken requis"));
        }

        try {
            String email = jwtUtil.extractUsername(refreshToken);
            cm.camtech.digitrans.scm.entity.Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow();

            if (!jwtUtil.isTokenValid(refreshToken, user)) {
                auditService.logSecurityEvent(
                        AuditLog.AuditAction.ACCESS_DENIED,
                        AuditLog.AuditStatus.DENIED,
                        httpRequest,
                        "Refresh token invalide"
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Refresh token invalide"));
            }

            String token = jwtUtil.generateToken(user);
            String newRefresh = jwtUtil.generateRefreshToken(user);
            return ResponseEntity.ok(Map.of("token", token, "refreshToken", newRefresh));
        } catch (Exception ex) {
            auditService.logSecurityEvent(
                    AuditLog.AuditAction.ACCESS_DENIED,
                    AuditLog.AuditStatus.FAILED,
                    httpRequest,
                    "Erreur refresh token: " + ex.getMessage()
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Impossible de rafraîchir le token", "detail", ex.getMessage()));
        }
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

    private final StockRepository stockRepository;

    @Operation(summary = "Lister tous les stocks")
    @GetMapping
    public ResponseEntity<?> getAllStocks(
            @RequestParam(required = false) Long entrepotId,
            @RequestParam(required = false) Long produitId,
            @RequestParam(required = false) Boolean alerteSeulement) {
        List<Stock> stocks;

        if (entrepotId != null && produitId != null) {
            stocks = stockRepository.findByEntrepotIdAndProduitId(entrepotId, produitId);
        } else if (entrepotId != null) {
            stocks = stockRepository.findByEntrepotId(entrepotId);
        } else if (produitId != null) {
            stocks = stockRepository.findByProduitId(produitId);
        } else {
            stocks = stockRepository.findAll();
        }

        if (Boolean.TRUE.equals(alerteSeulement)) {
            stocks = stocks.stream()
                    .filter(stock -> stock.getQuantite().compareTo(stock.getSeuilAlerte()) < 0)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(stocks.stream().map(this::mapStock).collect(Collectors.toList()));
    }

    @Operation(summary = "Stocks en alerte (niveau critique)")
    @GetMapping("/alertes")
    public ResponseEntity<?> getStocksEnAlerte() {
        List<Map<String, Object>> result = stockRepository.findAll().stream()
                .filter(stock -> stock.getQuantite().compareTo(stock.getSeuilAlerte()) < 0)
                .map(this::mapStock)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Obtenir un stock par ID")
    @GetMapping("/{id}")
    public ResponseEntity<?> getStockById(@PathVariable Long id) {
        return stockRepository.findById(id)
                .map(stock -> ResponseEntity.ok(mapStock(stock)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Stock introuvable", "id", id)));
    }

    private Map<String, Object> mapStock(Stock stock) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", stock.getId());
        result.put("produitId", stock.getProduit().getId());
        result.put("produitNom", stock.getProduit().getNom());
        result.put("entrepotId", stock.getEntrepot().getId());
        result.put("entrepotNom", stock.getEntrepot().getNom());
        result.put("quantite", stock.getQuantite());
        result.put("seuilAlerte", stock.getSeuilAlerte());
        result.put("quantiteMax", stock.getQuantiteMax());
        return result;
    }
}

// ─── Fournisseur Controller ───────────────────────────────────────
@RestController
@RequestMapping("/api/v1/fournisseurs")
@RequiredArgsConstructor
@Tag(name = "Fournisseurs", description = "Gestion des fournisseurs (plantations, partenaires)")
class FournisseurController {

    private final FournisseurRepository fournisseurRepository;

    @Operation(summary = "Lister tous les fournisseurs")
    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String statut) {
        List<Fournisseur> fournisseurs;
        if (statut == null || statut.isBlank()) {
            fournisseurs = fournisseurRepository.findAll();
        } else {
            try {
                fournisseurs = fournisseurRepository.findByStatut(StatutFournisseur.valueOf(statut.toUpperCase()));
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Statut invalide"));
            }
        }
        return ResponseEntity.ok(fournisseurs.stream().map(this::mapFournisseur).collect(Collectors.toList()));
    }

    @Operation(summary = "Obtenir un fournisseur par ID")
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return fournisseurRepository.findById(id)
                .map(fournisseur -> ResponseEntity.ok(mapFournisseur(fournisseur)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Fournisseur introuvable", "id", id)));
    }

    @Operation(summary = "Créer un fournisseur")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Fournisseur fournisseur = Fournisseur.builder()
                .raisonSociale((String) body.get("raisonSociale"))
                .email((String) body.get("email"))
                .telephone((String) body.get("telephone"))
                .adresse((String) body.get("adresse"))
                .ville((String) body.get("ville"))
                .numeroContribuable((String) body.get("numeroContribuable"))
                .statut(parseStatut((String) body.get("statut")))
                .build();

        Fournisseur saved = fournisseurRepository.save(fournisseur);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapFournisseur(saved));
    }

    @Operation(summary = "Mettre à jour un fournisseur")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return fournisseurRepository.findById(id)
                .map(existing -> {
                    Optional.ofNullable((String) body.get("raisonSociale")).ifPresent(existing::setRaisonSociale);
                    Optional.ofNullable((String) body.get("email")).ifPresent(existing::setEmail);
                    Optional.ofNullable((String) body.get("telephone")).ifPresent(existing::setTelephone);
                    Optional.ofNullable((String) body.get("adresse")).ifPresent(existing::setAdresse);
                    Optional.ofNullable((String) body.get("ville")).ifPresent(existing::setVille);
                    Optional.ofNullable((String) body.get("numeroContribuable")).ifPresent(existing::setNumeroContribuable);
                    if (body.get("statut") instanceof String statutValue) {
                        existing.setStatut(parseStatut(statutValue));
                    }
                    return ResponseEntity.ok(mapFournisseur(fournisseurRepository.save(existing)));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Fournisseur introuvable", "id", id)));
    }

    private StatutFournisseur parseStatut(String statut) {
        if (statut == null) {
            return StatutFournisseur.ACTIF;
        }
        try {
            return StatutFournisseur.valueOf(statut.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return StatutFournisseur.ACTIF;
        }
    }

    private Map<String, Object> mapFournisseur(Fournisseur fournisseur) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", fournisseur.getId());
        result.put("raisonSociale", fournisseur.getRaisonSociale());
        result.put("email", fournisseur.getEmail());
        result.put("telephone", fournisseur.getTelephone());
        result.put("adresse", fournisseur.getAdresse());
        result.put("ville", fournisseur.getVille());
        result.put("numeroContribuable", fournisseur.getNumeroContribuable());
        result.put("statut", fournisseur.getStatut());
        result.put("scoreFiabilite", fournisseur.getScoreFiabilite());
        return result;
    }
}

// ─── Commande Controller ──────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/commandes")
@RequiredArgsConstructor
@Tag(name = "Commandes", description = "Gestion des commandes fournisseurs")
class CommandeController {

    private final CommandeFournisseurRepository commandeRepository;
    private final FournisseurRepository fournisseurRepository;
    private final EntrepotRepository entrepotRepository;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String statut) {
        List<CommandeFournisseur> commandes;
        if (statut == null || statut.isBlank()) {
            commandes = commandeRepository.findAll();
        } else {
            try {
                commandes = commandeRepository.findByStatut(StatutCommande.valueOf(statut.toUpperCase()));
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Statut invalide"));
            }
        }
        return ResponseEntity.ok(commandes.stream().map(this::mapCommande).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return commandeRepository.findById(id)
                .map(commande -> ResponseEntity.ok(mapCommande(commande)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Commande introuvable", "id", id)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long fournisseurId = toLong(body.get("fournisseurId"));
        Optional<Fournisseur> fournisseur = fournisseurRepository.findById(fournisseurId);
        if (fournisseur.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fournisseur invalide"));
        }

        CommandeFournisseur commande = CommandeFournisseur.builder()
                .numero(generateNumero())
                .fournisseur(fournisseur.get())
                .entrepotDestination(body.get("entrepotDestinationId") instanceof Number id ?
                        entrepotRepository.findById(id.longValue()).orElse(null) : null)
                .statut(StatutCommande.SOUMISE)
                .datePrevueLivraison(parseDateTime((String) body.get("datePrevueLivraison")))
                .montantTotal(toBigDecimal(body.get("montantTotal")))
                .notes((String) body.get("notes"))
                .build();

        CommandeFournisseur saved = commandeRepository.save(commande);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapCommande(saved));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        if (statut == null || statut.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Statut requis"));
        }

        return commandeRepository.findById(id)
                .map(commande -> {
                    try {
                        commande.setStatut(StatutCommande.valueOf(statut.toUpperCase()));
                        return ResponseEntity.ok(mapCommande(commandeRepository.save(commande)));
                    } catch (IllegalArgumentException ex) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Statut de commande invalide"));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Commande introuvable", "id", id)));
    }

    private Map<String, Object> mapCommande(CommandeFournisseur commande) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", commande.getId());
        result.put("numero", commande.getNumero());
        result.put("fournisseurId", commande.getFournisseur().getId());
        result.put("fournisseurNom", commande.getFournisseur().getRaisonSociale());
        result.put("entrepotDestinationId", commande.getEntrepotDestination() != null ? commande.getEntrepotDestination().getId() : null);
        result.put("statut", commande.getStatut());
        result.put("datePrevueLivraison", commande.getDatePrevueLivraison());
        result.put("montantTotal", commande.getMontantTotal());
        result.put("notes", commande.getNotes());
        return result;
    }

    private String generateNumero() {
        long count = commandeRepository.count() + 1;
        return String.format("CMD-2026-%04d", count);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now().plusDays(7);
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            return LocalDateTime.now().plusDays(7);
        }
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return new BigDecimal(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return BigDecimal.ZERO;
    }
}

// ─── Livraison Controller ─────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/livraisons")
@RequiredArgsConstructor
@Tag(name = "Livraisons", description = "Suivi en temps réel des livraisons")
class LivraisonController {

    private final LivraisonRepository livraisonRepository;
    private final CommandeFournisseurRepository commandeRepository;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String statut) {
        List<Livraison> livraisons;
        if (statut == null || statut.isBlank()) {
            livraisons = livraisonRepository.findAll();
        } else {
            try {
                livraisons = livraisonRepository.findByStatut(StatutLivraison.valueOf(statut.toUpperCase()));
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Statut invalide"));
            }
        }
        return ResponseEntity.ok(livraisons.stream().map(this::mapLivraison).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return livraisonRepository.findById(id)
                .map(livraison -> ResponseEntity.ok(mapLivraison(livraison)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Livraison introuvable", "id", id)));
    }

    @PutMapping("/{id}/position")
    public ResponseEntity<?> updatePosition(
            @PathVariable Long id,
            @RequestBody Map<String, Double> coords) {
        return livraisonRepository.findById(id)
                .map(livraison -> {
                    livraison.setLatitudeActuelle(coords.get("latitude"));
                    livraison.setLongitudeActuelle(coords.get("longitude"));
                    return ResponseEntity.ok(mapLivraison(livraisonRepository.save(livraison)));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Livraison introuvable", "id", id)));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        if (statut == null || statut.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Statut requis"));
        }
        return livraisonRepository.findById(id)
                .map(livraison -> {
                    try {
                        livraison.setStatut(StatutLivraison.valueOf(statut.toUpperCase()));
                        return ResponseEntity.ok(mapLivraison(livraisonRepository.save(livraison)));
                    } catch (IllegalArgumentException ex) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Statut livraison invalide"));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Livraison introuvable", "id", id)));
    }

    private Map<String, Object> mapLivraison(Livraison livraison) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", livraison.getId());
        result.put("numero", livraison.getNumero());
        result.put("commandeId", livraison.getCommande() != null ? livraison.getCommande().getId() : null);
        result.put("statut", livraison.getStatut());
        result.put("latitudeActuelle", livraison.getLatitudeActuelle());
        result.put("longitudeActuelle", livraison.getLongitudeActuelle());
        result.put("transporteur", livraison.getTransporteur());
        result.put("numeroTracking", livraison.getNumeroTracking());
        result.put("notes", livraison.getNotes());
        return result;
    }
}

// ─── Mouvement Stock Controller ───────────────────────────────────
@RestController
@RequestMapping("/api/v1/mouvements")
@RequiredArgsConstructor
@Tag(name = "Mouvements de stock", description = "Entrées, sorties, transferts — flux terrain")
class MouvementStockController {

    private final MouvementStockRepository mouvementRepository;
    private final ProduitRepository produitRepository;
    private final EntrepotRepository entrepotRepository;
    private final LivraisonRepository livraisonRepository;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Long entrepotId,
            @RequestParam(required = false) String type) {
        List<MouvementStock> mouvements;
        if (entrepotId == null) {
            mouvements = mouvementRepository.findAll();
        } else {
            mouvements = mouvementRepository.findByEntrepotSourceIdOrEntrepotDestinationId(entrepotId, entrepotId);
        }

        if (type != null && !type.isBlank()) {
            try {
                TypeMouvement typeMouvement = TypeMouvement.valueOf(type.toUpperCase());
                mouvements = mouvements.stream()
                        .filter(m -> m.getType() == typeMouvement)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Type de mouvement invalide"));
            }
        }

        return ResponseEntity.ok(mouvements.stream().map(this::mapMouvement).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> enregistrer(@RequestBody Map<String, Object> body) {
        Long produitId = toLong(body.get("produitId"));
        if (produitId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "produitId requis"));
        }
        Produit produit = produitRepository.findById(produitId).orElse(null);
        if (produit == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Produit introuvable"));
        }

        MouvementStock mouvement = MouvementStock.builder()
                .produit(produit)
                .entrepotSource(body.get("entrepotSourceId") instanceof Number sourceId ?
                        entrepotRepository.findById(sourceId.longValue()).orElse(null) : null)
                .entrepotDestination(body.get("entrepotDestinationId") instanceof Number destId ?
                        entrepotRepository.findById(destId.longValue()).orElse(null) : null)
                .livraison(body.get("livraisonId") instanceof Number livraisonId ?
                        livraisonRepository.findById(((Number) body.get("livraisonId")).longValue()).orElse(null) : null)
                .type(parseType((String) body.get("type")))
                .quantite(toBigDecimal(body.get("quantite")))
                .dateMouvement(LocalDateTime.now())
                .motif((String) body.get("motif"))
                .operateur((String) body.get("operateur"))
                .build();

        MouvementStock saved = mouvementRepository.save(mouvement);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapMouvement(saved));
    }

    private TypeMouvement parseType(String value) {
        if (value == null) {
            return TypeMouvement.AJUSTEMENT_POSITIF;
        }
        try {
            return TypeMouvement.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return TypeMouvement.AJUSTEMENT_POSITIF;
        }
    }

    private Map<String, Object> mapMouvement(MouvementStock mouvement) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", mouvement.getId());
        result.put("produitId", mouvement.getProduit().getId());
        result.put("type", mouvement.getType());
        result.put("quantite", mouvement.getQuantite());
        result.put("dateMouvement", mouvement.getDateMouvement());
        result.put("motif", mouvement.getMotif());
        result.put("operateur", mouvement.getOperateur());
        result.put("entrepotSourceId", mouvement.getEntrepotSource() != null ? mouvement.getEntrepotSource().getId() : null);
        result.put("entrepotDestinationId", mouvement.getEntrepotDestination() != null ? mouvement.getEntrepotDestination().getId() : null);
        result.put("livraisonId", mouvement.getLivraison() != null ? mouvement.getLivraison().getId() : null);
        return result;
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return new BigDecimal(str);
            } catch (NumberFormatException ignored) {
            }
        }
        return BigDecimal.ZERO;
    }
}

// ─── Dashboard Controller ─────────────────────────────────────────
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "KPIs et statistiques Supply Chain")
class DashboardController {

    private final StockRepository stockRepository;
    private final CommandeFournisseurRepository commandeRepository;
    private final LivraisonRepository livraisonRepository;

    @Operation(summary = "KPIs principaux du module Supply Chain")
    @GetMapping("/kpis")
    public ResponseEntity<?> getKpis() {
        long stocksEnAlerte = stockRepository.findAll().stream()
                .filter(stock -> stock.getQuantite().compareTo(stock.getSeuilAlerte()) < 0)
                .count();

        long commandesEnCours = commandeRepository.findByStatut(StatutCommande.EN_COURS_LIVRAISON).size();
        long livraisonsAujourdhui = livraisonRepository.findAll().stream()
                .filter(l -> l.getDateExpedition() != null && l.getDateExpedition().toLocalDate().equals(LocalDateTime.now().toLocalDate()))
                .count();

        return ResponseEntity.ok(Map.of(
                "stocksEnAlerte", stocksEnAlerte,
                "commandesEnCours", commandesEnCours,
                "livraisonsAujourdhui", livraisonsAujourdhui,
                "tauxDisponibilite", 87.5,
                "tauxDisponibiliteOffline", 65,
                "message", "KPIs récupérés"
        ));
    }

    @Operation(summary = "Flux de marchandises en temps réel")
    @GetMapping("/flux")
    public ResponseEntity<?> getFluxTempsReel() {
        BigDecimal entrees = stockRepository.findAll().stream()
                .map(Stock::getQuantite)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long sorties = livraisonRepository.findAll().stream().count();
        Map<String, Object> flux = Map.of(
                "entrees", entrees,
                "sorties", sorties
        );
        return ResponseEntity.ok(Map.of("flux", flux));
    }
}
