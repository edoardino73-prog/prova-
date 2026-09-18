// js/services/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Credenziali del tuo progetto NVS
const firebaseConfig = { 
    apiKey: "AIzaSyAc0fIlfds4Gne5m3qpH25uacK4NeR6TzM", 
    authDomain: "gestione-visite-b445b.firebaseapp.com", 
    projectId: "gestione-visite-b445b", 
    storageBucket: "gestione-visite-b445b.firebasestorage.app", 
    messagingSenderId: "720937824810", 
    appId: "1:720937824810:web:b04b60d1d66bb8f4040953" 
};

// Esportiamo le istanze per renderle disponibili agli altri file
export let app;
export let db;
export let auth;

export const initFirebase = async () => {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // 🛡️ ATTIVAZIONE PERSISTENZA OFFLINE
        // Salva i dati in cache: se l'operatore perde il segnale Wi-Fi in camera, 
        // l'app continua a funzionare e sincronizza tutto al ritorno della rete.
        try {
            await enableIndexedDbPersistence(db);
            console.log("✅ Persistenza offline di Firebase attivata.");
        } catch (err) {
            if (err.code === 'failed-precondition') {
                console.warn("⚠️ Persistenza offline: l'app è aperta in più schede del browser.");
            } else if (err.code === 'unimplemented') {
                console.warn("⚠️ Il browser corrente non supporta la persistenza offline.");
            }
        }
        
        return { app, db, auth };
    } catch (error) {
        console.error("❌ Errore critico in inizializzazione Firebase:", error);
        throw error;
    }
};