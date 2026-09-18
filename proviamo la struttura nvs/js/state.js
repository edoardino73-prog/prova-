// js/state.js
export const AppState = {
    // Archivi Dati
    operatori: [],
    ospiti: [],
    clinica: {},
    rischio: [],
    cup: [],
    magazzino: [],
    stupefacentiInv: [],
    stupefacentiLog: [],
    consegne: [],
    contenzioni: [],
    struttura: {},
    
    // Utente attualmente connesso
    activeOperator: null,
    activeOperatorRole: "user",
    activeOperatorQualifica: null,

    // 🔄 FUNZIONE REATTIVA CENTRALE
    // Ogni volta che i dati cambiano, aggiorniamo l'archivio e avvisiamo l'interfaccia visiva
    update(chiave, dati) {
        if (this.hasOwnProperty(chiave)) {
            this[chiave] = dati;
            // Emette un evento personalizzato. La UI si metterà in ascolto di questo evento
            // per ricaricare automaticamente le tabelle o i grafici.
            document.dispatchEvent(new CustomEvent(`state:${chiave}`, { detail: dati }));
        }
    }
};