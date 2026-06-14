package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lignes_commande")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneCommande extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private CommandeFournisseur commande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantiteCommandee;

    @Column(precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantiteRecue = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;
}

