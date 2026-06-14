package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "fournisseurs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Fournisseur extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String raisonSociale;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String telephone;

    @Column(length = 255)
    private String adresse;

    @Column(length = 100)
    private String ville;

    @Column(length = 20)
    private String numeroContribuable;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutFournisseur statut = StatutFournisseur.ACTIF;

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal scoreFiabilite = BigDecimal.valueOf(5.0);

    @OneToMany(mappedBy = "fournisseur", cascade = CascadeType.ALL)
    @Builder.Default
    private List<CommandeFournisseur> commandes = new ArrayList<>();
}

