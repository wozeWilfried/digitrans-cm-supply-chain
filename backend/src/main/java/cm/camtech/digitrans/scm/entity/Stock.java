package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "stocks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"produit_id", "entrepot_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Stock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_id", nullable = false)
    private Entrepot entrepot;

    @Column(nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantite = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal seuilAlerte = BigDecimal.ZERO;

    @Column(precision = 12, scale = 3)
    private BigDecimal quantiteMax;
}
