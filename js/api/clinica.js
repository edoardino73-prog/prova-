// js/api/clinica.js
import { db } from '../services/firebase-init.js';
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { AppState } from '../state.js';

let curTerDate = new Date(); 
let curTerMonth = curTerDate.getMonth(); 
let curTerYear = curTerDate.getFullYear();
const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

// --- 1. SELEZIONE PAZIENTE E CARICAMENTO SCHEDA ---
window.handlePatientSelect = (id) => { 
    const n = document.getElementById(id).value; 
    if (!n) return; 
    AppState.globalSelectedPatient = n; 
    
    ['clinicalGuestSelect', 'terapiaGuestSelect', 'lettereGuestSelect'].forEach(i => {
        const el = document.getElementById(i);
        if (el) el.value = n;
    }); 
    
    ['clinicalContent', 'terapiaContent', 'lettereContent'].forEach(i => {
        const el = document.getElementById(i);
        if (el) el.style.display = 'block';
    }); 
    
    let d = AppState.clinica[n] || { terapiaList: [], vitals: [], docs: [], chkMarkers: [] }; 
    const g = AppState.ospiti.find(x => x.name === n) || {}; 
    
    let av = g.photo 
        ? `<img src="${g.photo}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;border:1px solid var(--border-color);">` 
        : `<div style="width:50px;height:50px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;border-radius:4px;">👤</div>`; 
        
    let h = `${av}<h2>${n}</h2>`; 
    if (document.getElementById('clinicalHeader')) document.getElementById('clinicalHeader').innerHTML = h; 
    if (document.getElementById('terapiaHeader')) document.getElementById('terapiaHeader').innerHTML = h; 
    if (document.getElementById('lettereHeader')) document.getElementById('lettereHeader').innerHTML = h; 
    
    if (document.getElementById('editGuestName')) { 
        document.getElementById('editGuestName').value = n; 
        document.getElementById('editGuestCF').value = g.cf || ''; 
        document.getElementById('editGuestRoom').value = g.room || ''; 
        document.getElementById('editGuestTutoreScadenza').value = g.tutoreScadenza || ''; 
        document.getElementById('editGuestUVMData').value = g.uvmData || ''; 
        document.getElementById('editGuestUVMPunteggio').value = g.uvmPunteggio || ''; 
        document.getElementById('viewGuestDocId').innerHTML = g.docId ? `<a href="${g.docId}" target="_blank" style="color:var(--primary-color);">📄 Apri</a>` : '-'; 
        document.getElementById('viewGuestDocCf').innerHTML = g.docCf ? `<a href="${g.docCf}" target="_blank" style="color:var(--primary-color);">📄 Apri</a>` : '-'; 
        document.getElementById('viewGuestDocUvm').innerHTML = g.docUvm ? `<a href="${g.docUvm}" target="_blank" style="color:var(--primary-color);">📄 Apri</a>` : '-'; 
    } 
    
    ['fktValutazione', 'fktAusili', 'fktObiettivi', 'chkGen', 'chkPiaghe', 'paiDataStesura', 'paiDataRevisione', 'paiMedico', 'paiInfermieristico', 'paiAssistenziale', 'vmdADL', 'vmdIADL', 'vmdMMSE', 'vmdBraden', 'vmdMorse', 'binaAuto', 'binaSanita', 'binaPsiche', 'binaSociale'].forEach(fid => {
        const el = document.getElementById(fid);
        if (el) el.value = d[fid] || "";
    }); 
    
    ['Med', 'Inf', 'Oss'].forEach(ruolo => { 
        let idPref = 'paiFirma' + ruolo; 
        const dateEl = document.getElementById(idPref + 'Date');
        const statusEl = document.getElementById(idPref + 'Status');
        if (dateEl && statusEl) { 
            let val = d[idPref + 'Date'] || ""; 
            dateEl.value = val; 
            statusEl.innerHTML = val ? `✅ Firmato:<br><strong>${val}</strong>` : `⏳ In attesa`; 
        } 
    });
    
    if (typeof window.calcolaBINA === 'function') window.calcolaBINA();
    
    window.currentBodyMarkers = d.chkMarkers ? [...d.chkMarkers] : []; 
    if (typeof window.renderBodyMarkers === 'function') window.renderBodyMarkers(); 
    renderTerapiaTable(n, d); 
    renderVitals(n, d); 
    renderPatientDocs(n, d); 
    if (typeof window.aggiornaBannerPAI === 'function') window.aggiornaBannerPAI(); 
};

// --- 2. PARAMETRI VITALI (Inserimento Rapido Ergonomico) ---
window.addVitals = async () => { 
    if (AppState.activeOperatorQualifica === 'OSS') return window.showToast("⚠️ Sola Lettura"); 
    const n = document.getElementById('clinicalGuestSelect').value; 
    if (!n) return window.showToast("⚠️ Seleziona paziente dalla tendina in alto."); 
    
    let pa = document.getElementById('vitPA').value.trim();
    let fc = document.getElementById('vitFC').value;
    let spo2 = document.getElementById('vitSPO2').value;
    let tc = document.getElementById('vitTC').value;
    
    if (!pa && !fc && !spo2 && !tc) return window.showToast("⚠️ Inserisci almeno un parametro.");

    let d = AppState.clinica[n] || {}; 
    if (!d.vitals) d.vitals = []; 
    
    const timestampStr = `${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'})}`;
    
    d.vitals.unshift({
        date: timestampStr, 
        op: AppState.activeOperator, 
        pa: pa || "-", 
        fc: fc || "-", 
        spo2: spo2 || "-", 
        tc: tc || "-"
    }); 
    
    await setDoc(doc(db, "cartelle_cliniche", n), d); 
    renderVitals(n, d); 
    window.showToast("✅ Parametri Registrati");
    
    // Ergonomia: Svuota i campi e riposiziona il cursore sul primo input per un flusso continuo
    ['vitPA', 'vitFC', 'vitSPO2', 'vitTC'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const firstInput = document.getElementById('vitPA');
    if (firstInput) firstInput.focus();
};

function renderVitals(n, d) {
    const tb = document.querySelector('#vitalsTable tbody'); 
    if (!tb) return; 
    tb.innerHTML = ''; 
    if (!d.vitals) return; 
    
    d.vitals.forEach((v) => {
        const initials = v.op ? v.op.split(' ').map(x => x[0].toUpperCase()).join('.') + '.' : '-';
        tb.innerHTML += `<tr><td>${v.date}</td><td>${initials}</td><td>${v.pa}</td><td>${v.fc}</td><td>${v.spo2}</td><td>${v.tc}</td><td><button class="btn-danger restrict-oss" onclick="alert('Usa Firebase per eliminare Vitals.')">X</button></td></tr>`;
    });
}

// --- 3. GESTIONE TERAPIE E FIRME MENSILI ---
window.changeTerapiaMonth = (delta) => { 
    curTerMonth += delta; 
    if (curTerMonth > 11) { curTerMonth = 0; curTerYear++; } 
    if (curTerMonth < 0) { curTerMonth = 11; curTerYear--; } 
    const n = document.getElementById('terapiaGuestSelect').value; 
    if (n) renderTerapiaTable(n, AppState.clinica[n] || {}); 
};

window.addTerapiaItem = async () => { 
    if (AppState.activeOperatorQualifica === 'OSS') return window.showToast("⚠️ Sola Lettura"); 
    const n = document.getElementById('terapiaGuestSelect').value; 
    if (!n) return window.showToast("⚠️ Seleziona paziente"); 
    
    const f = document.getElementById('terapiaFarmaco').value.trim(); 
    const p = document.getElementById('terapiaPosologia').value.trim(); 
    const o = document.getElementById('terapiaOrario').value; 
    const nt = document.getElementById('terapiaNote').value.trim(); 
    if (!f) return window.showToast("⚠️ Inserisci farmaco"); 
    
    let d = AppState.clinica[n] || {}; 
    if (!d.terapiaList) d.terapiaList = []; 
    d.terapiaList.push({ farmaco: f, posologia: p, orario: o, note: nt, signatures: {} }); 
    
    await setDoc(doc(db, "cartelle_cliniche", n), d); 
    document.getElementById('terapiaFarmaco').value = ''; 
    document.getElementById('terapiaPosologia').value = ''; 
    renderTerapiaTable(n, d); 
    window.showToast("✅ Prescritto!"); 
};

window.firmaTerapiaPiano = async () => {
    if (AppState.activeOperatorQualifica !== 'Medico' && AppState.activeOperatorQualifica !== 'Direttore Sanitario' && AppState.activeOperatorRole !== 'admin') {
        return window.showToast("🚫 Azione riservata a Medico o Direttore Sanitario.");
    }
    const n = document.getElementById('terapiaGuestSelect').value;
    if (!n) return window.showToast("⚠️ Seleziona prima un paziente.");
    
    let d = AppState.clinica[n] || {};
    if (!d.terapiaFirmeMensili) d.terapiaFirmeMensili = {};
    
    let monthKey = `${curTerYear}-${String(curTerMonth + 1).padStart(2, '0')}`;
    const timestampStr = `${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'})}`;

    if (d.terapiaFirmeMensili[monthKey] && d.terapiaFirmeMensili[monthKey].op) {
        if (confirm(`Il piano per ${monthNames[curTerMonth]} ${curTerYear} è già validato. Vuoi REVOCARE la validazione?`)) {
            delete d.terapiaFirmeMensili[monthKey];
            await setDoc(doc(db, "cartelle_cliniche", n), d);
            renderTerapiaTable(n, d);
            window.showToast("Validazione revocata.");
        }
        return;
    }

    d.terapiaFirmeMensili[monthKey] = { op: AppState.activeOperator, data: timestampStr };
    await setDoc(doc(db, "cartelle_cliniche", n), d);
    renderTerapiaTable(n, d);
    window.showToast(`✅ Piano Terapeutico Validato per ${monthNames[curTerMonth]}!`);
};

function renderTerapiaTable(n, d) {
    const monthLabel = document.getElementById('terapiaMonthLabel');
    if (monthLabel) monthLabel.innerText = `${monthNames[curTerMonth]} ${curTerYear}`; 
    
    const th = document.getElementById('terapiaGridHead'); 
    const tb = document.querySelector('#terapiaGridTable tbody'); 
    if (!th || !tb) return; 
    
    let dIM = new Date(curTerYear, curTerMonth + 1, 0).getDate(); 
    let hh = `<th class="farmaco-col">Farmaco</th>`; 
    for (let i = 1; i <= dIM; i++) hh += `<th>${i}</th>`; 
    hh += `<th class="restrict-oss">Del</th>`; 
    th.innerHTML = hh; 
    tb.innerHTML = ''; 
    
    const statusEl = document.getElementById('terapiaFirmaGlobaleStatus');
    if (statusEl) {
        let monthKey = `${curTerYear}-${String(curTerMonth + 1).padStart(2, '0')}`;
        let firmaMese = d.terapiaFirmeMensili ? d.terapiaFirmeMensili[monthKey] : null;

        if (firmaMese && firmaMese.op) {
            statusEl.innerHTML = `✅ Validato per ${monthNames[curTerMonth]} ${curTerYear} da: <strong>${firmaMese.op}</strong> il ${firmaMese.data}`;
        } else {
            statusEl.innerHTML = `⏳ In attesa di validazione medica per ${monthNames[curTerMonth]} ${curTerYear}`;
        }
    }

    if (!d.terapiaList || d.terapiaList.length === 0) { 
        tb.innerHTML = `<tr><td colspan="${dIM + 2}">Nessuna terapia prescritta.</td></tr>`; 
        return; 
    } 
    
    let tS = getTodayString(); 
    let rows = ""; 
    
    d.terapiaList.forEach((t, i) => { 
        let fC = `<strong>${t.farmaco}</strong><br><span style="color:var(--terapia-color);">${t.posologia || ''}</span><br><small>🕒 ${t.orario || ''}</small>`; 
        rows += `<tr><td class="farmaco-col">${fC}</td>`; 
        
        let oA = (t.orario && t.orario !== 'Firma') ? t.orario.spec('-').map(s => s.trim()) : ["Firma"]; 
        if (typeof t.orario === 'string' && t.orario.includes('-')) {
            oA = t.orario.split('-').map(s => s.trim());
        }
        
        for (let day = 1; day <= dIM; day++) { 
            let dStr = `${curTerYear}-${String(curTerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; 
            let cC = ""; 
            
            oA.forEach(sl => { 
                let sig = t.signatures ? (t.signatures[`${dStr}_${sl}`] || t.signatures[dStr]) : null; 
                let initials = sig && sig.op ? sig.op.split(' ').map(x => x[0].toUpperCase()).join('.') + '.' : '';
                
                if (sig) {
                    cC += `<div class="signature-text" onclick="window.signTerapia(${i},'${dStr}','${sl}')">${initials}</div>`; 
                } else {
                    cC += `<div class="shift-btn single-btn ${dStr !== tS ? 'disabled' : ''}" onclick="window.signTerapia(${i},'${dStr}','${sl}')">${sl}</div>`; 
                }
            }); 
            rows += `<td><div class="micro-shifts">${cC}</div></td>`; 
        } 
        rows += `<td class="restrict-oss"><button class="btn-danger" onclick="window.deleteTerapiaItem(${i})">X</button></td></tr>`; 
    }); 
    
    tb.innerHTML = rows; 
}

// --- 4. GESTIONE DOCUMENTI E ALLEGATI PAZIENTE ---
function renderPatientDocs(n, d) {
    const l = document.getElementById('patientDocsList'); 
    if (!l) return; 
    l.innerHTML = ''; 
    
    if (!d.docs || d.docs.length === 0) { 
        l.innerHTML = '<p>Nessun allegato.</p>'; 
        return; 
    } 
    
    d.docs.forEach((x, i) => { 
        let isPdf = x.base64.startsWith('data:application/pdf'); 
        let h = isPdf 
            ? `<div style="height:100px;display:flex;align-items:center;justify-content:center;background:#e2e8f0;font-size:30px;">📄</div>` 
            : `<img src="${x.base64}" style="height:100px;width:100%;object-fit:cover;">`; 
            
        l.innerHTML += `<div style="border:1px solid #ccc;padding:10px;width:150px;text-align:center;"><a href="${x.base64}" target="_blank">${h}</a><div style="font-size:0.75em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x.name}</div><button class="btn-danger restrict-oss" style="padding:4px;" onclick="window.deletePatientDoc(${i})">🗑️</button></div>`; 
    }); 
}