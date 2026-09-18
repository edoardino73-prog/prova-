// js/main.js
import { initFirebase } from './services/firebase-init.js';
import { initAuth } from './auth.js';
import { initNavigation } from './ui/navigation.js';
import { initCloudSync } from './services/sync.js'; // 👈 INDISPENSABILE

// Importiamo tutti i moduli funzionali dell'app
import './api/clinica.js';
import './api/flussi.js';
import './ui/utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Inizializzazione NVS Masterpiece modulare in corso...");
    
    try {
        // 1. Connessione a Firebase e persistenza offline
        await initFirebase();
        
        // 2. Avvio autenticazione e profili operatori
        initAuth();
        
        // 3. Avvio della navigazione UI e della sidebar
        initNavigation();
        
        // 4. Avvio dei flussi di dati in tempo reale dal cloud
        initCloudSync(); // 👈 ATTIVAZIONE DELLA SINCRONIZZAZIONE
        
        // Controllo sessione locale attiva
        const savedOp = sessionStorage.getItem("activeOperator");
        if (savedOp) {
            document.getElementById('currentOpBadge').innerText = `👤 ${savedOp}`;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'flex';
            document.body.setAttribute('data-qualifica', sessionStorage.getItem("activeQualifica") || "");
        }
        
        console.log("✅ Sistema NVS Masterpiece completamente operativo.");
    } catch (error) {
        console.error("❌ Errore critico durante l'avvio:", error);
    }
});