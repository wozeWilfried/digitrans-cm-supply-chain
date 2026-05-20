package cm.camtech.digitrans.scm;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test — vérifie que le contexte Spring Boot se charge sans erreur.
 * Les vrais tests métier arrivent en Milestone M2.
 */
@SpringBootTest
@ActiveProfiles("test")
class DigitransScmApplicationTests {

    @Test
    void contextLoads() {
        // Si ce test passe, toute la configuration Spring (Security, JPA, Redis)
        // est correctement initialisée
    }
}
