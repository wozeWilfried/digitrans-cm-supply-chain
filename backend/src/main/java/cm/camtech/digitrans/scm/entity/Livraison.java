package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "livraisons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Livraison extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeFournisseur commande;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutLivraison statut = StatutLivraison.PLANIFIEE;

    private LocalDateTime dateExpedition;
    private LocalDateTime dateLivraisonEffective;

    @Column(length = 100)
    private String transporteur;

    @Column(length = 50)
    private String numeroTracking;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitudeActuelle;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitudeActuelle;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "livraison", cascade = CascadeType.ALL)
    @Builder.Default
    private List<MouvementStock> mouvements = new ArrayList<>();
}

