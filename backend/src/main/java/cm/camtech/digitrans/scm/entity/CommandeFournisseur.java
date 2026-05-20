package cm.camtech.digitrans.scm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commandes_fournisseurs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandeFournisseur extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_destination_id")
    private Entrepot entrepotDestination;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutCommande statut = StatutCommande.BROUILLON;

    @Column(nullable = false)
    private LocalDateTime datePrevueLivraison;

    @Column(precision = 15, scale = 2)
    private BigDecimal montantTotal;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneCommande> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Livraison> livraisons = new ArrayList<>();
}

