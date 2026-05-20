package cm.camtech.digitrans.scm.repository;

import cm.camtech.digitrans.scm.entity.Livraison;
import cm.camtech.digitrans.scm.entity.StatutLivraison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LivraisonRepository extends JpaRepository<Livraison, Long> {

    List<Livraison> findByStatut(StatutLivraison statut);
}
