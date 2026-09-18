// js/main.js
import { initFirebase } from './services/firebase-init.js';
import { initAuth } from './auth.js';
import { initNavigation } from './ui/navigation.js';
import { initCloudSync } from './services/sync.js';

// Importiamo le API e le Utility UI
import './api/clinica.js';
import './api/flussi.js';
import './ui/utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Inizializzazione NVS Masterpiece modulare in corso...");
    
    try {
        await initFirebase();
        initAuth();
        initNavigation();
        initCloudSync();
        
        const savedOp = sessionStorage.getItem("activeOperator");
        if (savedOp) {
            document.getElementById('currentOpBadge').innerText = `👤 ${savedOp}`;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'flex';
            document.body.setAttribute('data-qualifica', sessionStorage.getItem("activeQualifica") || "");
        }
        
        console.log("✅ Architettura modulare completata e sistema operativo al 100%.");
    } catch (error) {
        console.error("❌ Errore critico durante l'avvio:", error);
    }
});