package cm.camtech.digitrans.scm.security;

import cm.camtech.digitrans.scm.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation UserDetailsService — chargement utilisateur par email pour JWT
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur introuvable avec l'email : " + email
                ));
    }
}
