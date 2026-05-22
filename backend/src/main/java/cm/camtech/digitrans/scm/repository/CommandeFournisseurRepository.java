package cm.camtech.digitrans.scm.repository;

import cm.camtech.digitrans.scm.entity.CommandeFournisseur;
import cm.camtech.digitrans.scm.entity.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandeFournisseurRepository extends JpaRepository<CommandeFournisseur, Long> {

    List<CommandeFournisseur> findByStatut(StatutCommande statut);
}
