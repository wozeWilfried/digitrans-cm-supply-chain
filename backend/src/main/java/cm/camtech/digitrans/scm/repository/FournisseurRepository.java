package cm.camtech.digitrans.scm.repository;

import cm.camtech.digitrans.scm.entity.Fournisseur;
import cm.camtech.digitrans.scm.entity.StatutFournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {

    List<Fournisseur> findByStatut(StatutFournisseur statut);
}
