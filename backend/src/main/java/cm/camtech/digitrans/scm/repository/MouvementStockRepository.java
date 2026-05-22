package cm.camtech.digitrans.scm.repository;

import cm.camtech.digitrans.scm.entity.MouvementStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {

    List<MouvementStock> findByEntrepotSourceIdOrEntrepotDestinationId(Long sourceId, Long destinationId);
}
