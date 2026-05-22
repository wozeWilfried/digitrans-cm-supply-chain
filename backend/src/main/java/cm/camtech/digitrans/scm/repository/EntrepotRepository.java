package cm.camtech.digitrans.scm.repository;

import cm.camtech.digitrans.scm.entity.Entrepot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntrepotRepository extends JpaRepository<Entrepot, Long> {
}
