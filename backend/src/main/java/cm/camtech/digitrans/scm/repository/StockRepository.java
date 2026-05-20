package cm.camtech.digitrans.scm.repository;

import cm.camtech.digitrans.scm.entity.Stock;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<Stock> findAll();

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<Stock> findByEntrepotId(Long entrepotId);

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<Stock> findByProduitId(Long produitId);

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<Stock> findByEntrepotIdAndProduitId(Long entrepotId, Long produitId);

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<Stock> findByQuantiteLessThan(BigDecimal quantite);
}
