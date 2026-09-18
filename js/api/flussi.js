// js/api/flussi.js
import { AppState } from '../state.js';

// --- 1. ESPORTAZIONE ALLOGGIATI WEB (Polizia di Stato) ---
window.exportAlloggiati = (tipoExport = 'nuovi') => { 
    if (AppState.activeOperatorQualifica === 'OSS') return window.showToast("⚠️ Sola Lettura"); 
    
    const dS = document.getElementById('alloggiatiStart').value; 
    const dE = document.getElementById('alloggiatiEnd').value; 
    if (!dS || !dE) return window.showToast("⚠️ Date mancanti!"); 
    
    let osp = [];
    let dataArrivoForzata = "";

    if (tipoExport === 'rinnovo') {
        osp = AppState.ospiti.filter(g => !g.decesso && !g.dimissione);
        if (osp.length === 0) return window.showToast("⚠️ Nessun ospite presente in struttura");
        dataArrivoForzata = dS.split('-').reverse().join('/'); 
    } else {
        osp = AppState.ospiti.filter(g => g.ingresso >= dS && g.ingresso <= dE); 
        if (osp.length === 0) return window.showToast("⚠️ Nessun ingresso in questo range"); 
    }

    let txt = ""; 
    const pad = (s, l) => (s || '').toString().substring(0, l).padEnd(l, ' '); 
    
    osp.forEach(g => { 
        let tipoAlloggiato = "16"; // 16 = OSPITE DI STRUTTURA RICETTIVA / RSA
        let dataArrivo = dataArrivoForzata !== "" ? dataArrivoForzata : (g.ingresso ? g.ingresso.split('-').reverse().join('/') : ""); 
        let permanenza = "30"; 
        let cognome = (g.cognome || g.name.split(' ')[0] || "").toUpperCase();
        let nome = (g.nome || g.name.split(' ').slice(1).join(' ') || "").toUpperCase();
        let sesso = g.sesso === 'F' ? "2" : "1";
        let dataNascita = g.dob ? g.dob.split('-').reverse().join('/') : "";
        let luogoNascita = g.pobProv === 'EE' ? "" : (g.pobCod || "");
        let provNascita = g.pobProv || "  "; 
        
        let statoNascita = g.pobProv === 'EE' ? (g.cittadinanza || "100000100") : "100000100";
        let statoCittadinanza = g.cittadinanza || "100000100";
        
        let tipoDocumento = g.docTipo || "IDENT";
        let numDocumento = (g.docNum || "").toUpperCase();
        let luogoRilascio = g.docRilascioCod || "";

        // Tracciato rigoroso a campi fissi (standard Polizia di Stato)
        let record = pad(tipoAlloggiato, 2) + 
                     pad(dataArrivo, 10) + 
                     pad(permanenza, 2) + 
                     pad(cognome, 50) + 
                     pad(nome, 30) + 
                     pad(sesso, 1) + 
                     pad(dataNascita, 10) + 
                     pad(luogoNascita, 9) + 
                     pad(provNascita, 2) + 
                     pad(statoNascita, 9) +      
                     pad(statoCittadinanza, 9) +  
                     pad(tipoDocumento, 5) + 
                     pad(numDocumento, 20) + 
                     pad(luogoRilascio, 9);

        txt += record + "\r\n"; 
    }); 
    
    const blob = new Blob([txt], { type: 'text/plain' }); 
    const link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob); 
    
    let todayStr = new Date().toISOString().split('T')[0];
    let fileN = tipoExport === 'rinnovo' ? `Alloggiati_RinnovoPresenti_${todayStr}.txt` : `Alloggiati_NuoviIngressi_${todayStr}.txt`;
    
    link.download = fileN; 
    link.click(); 
    window.showToast("👮‍♂️ File txt Alloggiati generato correttamente."); 
};

window.setAlloggiatiDates = (mode) => {
    let t = new Date();
    if (mode === 'oggi') {
        let td = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
        document.getElementById('alloggiatiStart').value = td;
        document.getElementById('alloggiatiEnd').value = td;
    } else if (mode === 'mese') {
        let start = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-01`;
        let endD = new Date(t.getFullYear(), t.getMonth() + 1, 0); 
        let end = `${endD.getFullYear()}-${String(endD.getMonth()+1).padStart(2,'0')}-${String(endD.getDate()).padStart(2,'0')}`;
        document.getElementById('alloggiatiStart').value = start;
        document.getElementById('alloggiatiEnd').value = end;
    }
};

// --- 2. FLUSSO F.A.R. (USL Umbria) ---
window.exportFARUmbria = () => { 
    if (AppState.activeOperatorQualifica === 'OSS') return window.showToast("⚠️ Sola Lettura"); 
    
    let csvContent = "data:text/csv;charset=utf-8,NOME;CF;INGRESSO;USCITA;STATO;MOV\n"; 
    AppState.ospiti.forEach(g => {
        let stato = g.decesso ? 'DEC' : (g.dimissione ? 'DIM' : 'IN');
        let ultimoMov = (g.movimenti && g.movimenti.length > 0) ? g.movimenti[0].tipo : 'Nessuno';
        csvContent += `${g.name};${g.cf || ''};${g.ingresso || ''};${g.decesso || g.dimissione || ''};${stato};${ultimoMov}\n`; 
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); 
    link.href = encodedUri; 
    let todayStr = new Date().toISOString().split('T')[0];
    link.download = `FAR_${todayStr}.csv`; 
    link.click(); 
    window.showToast("📊 Flusso F.A.R. generato.");
};

// --- 3. FLUSSO S.I.A.R. / S.I.C.O.F. ---
window.exportSIAR = () => { 
    if (AppState.activeOperatorQualifica === 'OSS') return window.showToast("⚠️ Sola Lettura"); 
    
    let csvContent = "data:text/csv;charset=utf-8,NOME;CF;FKT_VAL;FKT_OB\n"; 
    AppState.ospiti.filter(g => !g.decesso && !g.dimissione).forEach(g => { 
        let d = AppState.clinica[g.name] || {}; 
        let fktVal = (d.fktValutazione || '').replace(/[\r\n]+/g, ' ');
        let fktOb = (d.fktObiettivi || '').replace(/[\r\n]+/g, ' ');
        csvContent += `${g.name};${g.cf || ''};"${fktVal}";"${fktOb}"\n`; 
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); 
    link.href = encodedUri; 
    let todayStr = new Date().toISOString().split('T')[0];
    link.download = `SIAR_${todayStr}.csv`; 
    link.click(); 
    window.showToast("🏃‍♂️ Flusso SIAR generato.");
};

// --- 4. INTEGRAZIONE FSE (FHIR Standard) ---
window.exportFSE = () => { 
    window.showToast("Tracciato FHIR FSE in fase di generazione..."); 
    setTimeout(() => { 
        const bundle = {
            resourceType: "Bundle",
            type: "collection",
            timestamp: new Date().toISOString(),
            entry: AppState.ospiti.map(g => ({
                resource: {
                    resourceType: "Patient",
                    name: [{ text: g.name }],
                    identifier: [{ value: g.cf }]
                }
            }))
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
        const link = document.createElement("a"); 
        link.href = dataStr; 
        let todayStr = new Date().toISOString().split('T')[0];
        link.download = `FSE_FHIR_${todayStr}.json`; 
        link.click(); 
        window.showToast("🌐 Tracciato FSE scaricato.");
    }, 800);
};