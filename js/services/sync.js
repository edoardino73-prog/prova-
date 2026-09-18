// js/services/sync.js
import { db } from './firebase-init.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { AppState } from '../state.js';

export const initCloudSync = () => {
    // 1. Sincronizzazione Ospiti
    onSnapshot(collection(db, "ospiti"), (snap) => {
        const ospiti = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        AppState.update('ospiti', ospiti);
        
        // Aggiorna l'interfaccia degli ospiti se la funzione globale è disponibile
        if (typeof window.loadGuests === 'function') {
            window.loadGuests();
        }
    }, (error) => {
        console.error("Errore sync ospiti:", error);
    });

    // 2. Sincronizzazione Cartelle Cliniche
    onSnapshot(collection(db, "cartelle_cliniche"), (snap) => {
        const clinicaMap = {};
        snap.forEach(d => { clinicaMap[d.id] = d.data(); });
        AppState.update('clinica', clinicaMap);
        
        if (AppState.ospiti.length > 0 && typeof window.loadAlerts === 'function') {
            window.loadAlerts();
        }
    }, (error) => {
        console.error("Errore sync cartelle cliniche:", error);
    });

    // 3. Sincronizzazione Magazzino
    onSnapshot(collection(db, "magazzino"), (snap) => {
        const mag = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        AppState.update('magazzino', mag);
        
        if (typeof window.loadInventory === 'function') {
            window.loadInventory();
        }
    });

    // 4. Sincronizzazione Contenzioni
    onSnapshot(collection(db, "contenzioni"), (snap) => {
        const cont = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        AppState.update('contenzioni', cont);
        
        if (typeof window.loadContenzioni === 'function') {
            window.loadContenzioni();
        }
    });
};