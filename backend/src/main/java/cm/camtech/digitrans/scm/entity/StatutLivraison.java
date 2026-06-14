package cm.camtech.digitrans.scm.entity;

public enum StatutLivraison {
    // Statuts d'origine et de configuration
    PLANIFIEE, 
    
    // Statuts de transport et de transit (avec la variante attendue par le contrôleur)
    EN_TRANSIT, 
    EN_COURS,       // Requis par Controllers.java (ex: pour l'initialisation ou le suivi générique)
    
    // ÉTAPES SPÉCIFIQUES : Logistique Cameroun / Port de Douala
    AU_PORT_DOUALA, 
    EN_DEDOUANEMENT, 
    
    // Statuts de finalisation (avec les variantes de genre attendues par le contrôleur)
    LIVREE, 
    LIVRE,          // Requis par Controllers.java
    
    // Statuts d'anomalies ou de rejets
    REJETEE, 
    ANNULE,         // Requis par Controllers.java
    PARTIELLE
}

