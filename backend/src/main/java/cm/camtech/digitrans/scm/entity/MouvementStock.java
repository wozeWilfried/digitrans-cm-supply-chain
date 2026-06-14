package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "mouvements_stock")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MouvementStock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_source_id")
    private Entrepot entrepotSource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_destination_id")
    private Entrepot entrepotDestination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "livraison_id")
    private Livraison livraison;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeMouvement type;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantite;

    @Column(nullable = false)
    private LocalDateTime dateMouvement;

    @Column(length = 500)
    private String motif;

    @Column(length = 100)
    private String operateur;
}

