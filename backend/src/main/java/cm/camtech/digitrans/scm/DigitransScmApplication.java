package cm.camtech.digitrans.scm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Point d'entrée principal — DIGITRANS-SCM
 * Module Supply Chain | AGROCAM S.A. | CAMTECH SOLUTIONS S.A.
 *
 * @author DONGMO WOZE, KENNETH TAGNE, KAMGA Ludovic
 * @version 1.0.0
 */
@SpringBootApplication
@EnableCaching
@EnableJpaAuditing
@EnableScheduling
public class DigitransScmApplication {

    public static void main(String[] args) {
        SpringApplication.run(DigitransScmApplication.class, args);
    }
}
