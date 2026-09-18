// js/ui/utils.js
import { AppState } from '../state.js';

// --- 1. INTESTAZIONE UFFICIALE PER LE STAMPE ---
window.getPrintHeader = (docTitle) => {
    const s = AppState.struttura || {};
    const den = s.denominazione || 'NUOVA VILLA SILVANA';
    const tip = s.tipo ? `${s.tipo}` : '';
    const ind = s.indirizzo ? `${s.indirizzo}` : '';
    const rag = s.ragioneSociale ? `Ragione Sociale: ${s.ragioneSociale}` : '';
    const pva = s.piva ? `P.IVA/CF: ${s.piva}` : '';
    const tel = s.telefono ? `Tel: ${s.telefono}` : '';
    const eml = s.email ? `Email: ${s.email}` : '';
    
    let row1 = [tip, ind].filter(x => x).join(' - ');
    let row2 = [rag, pva].filter(x => x).join(' | ');
    let row3 = [tel, eml].filter(x => x).join(' | ');

    return `
        <div class="print-header">
            <h1>${den}</h1>
            <div class="print-header-details">
                ${row1 ? `<div>${row1}</div>` : ''}
                ${row2 ? `<div>${row2}</div>` : ''}
                ${row3 ? `<div>${row3}</div>` : ''}
            </div>
            <h2>${docTitle}</h2>
        </div>
    `;
};

// --- 2. GENERAZIONE QR CODE (Privacy & Consensi) ---
window.generatePrivacyQR = () => {
    const cogInput = document.getElementById('newGuestCognome');
    const nomInput = document.getElementById('newGuestNome');
    if (!cogInput || !nomInput) return; 
    
    const name = (cogInput.value.trim() + " " + nomInput.value.trim()).trim();
    if (!name) return window.showToast("⚠️ Inserisci prima il Cognome e Nome dell'ospite.");
    
    const baseUrl = window.location.href.split('?')[0]; 
    const targetUrl = baseUrl + '?ospite=' + encodeURIComponent(name);
    
    const qrContainer = document.getElementById('privacyQRCodeContainer'); 
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, { 
        text: targetUrl, 
        width: 120, 
        height: 120, 
        colorDark: "#0f172a", 
        colorLight: "#ffffff", 
        correctLevel: QRCode.CorrectLevel.H 
    });
    window.showToast("📱 QR Code Privacy Generato!");
};

window.generateConsensoQR = () => {
    const cogInput = document.getElementById('newGuestCognome');
    const nomInput = document.getElementById('newGuestNome');
    if (!cogInput || !nomInput) return; 
    
    const name = (cogInput.value.trim() + " " + nomInput.value.trim()).trim();
    if (!name) return window.showToast("⚠️ Inserisci prima il Cognome e Nome dell'ospite.");
    
    const baseUrl = window.location.href.split('?')[0]; 
    const targetUrl = baseUrl + '?consenso_ospite=' + encodeURIComponent(name);
    
    const qrContainer = document.getElementById('consensoQRCodeContainer'); 
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, { 
        text: targetUrl, 
        width: 120, 
        height: 120, 
        colorDark: "#0f172a", 
        colorLight: "#ffffff", 
        correctLevel: QRCode.CorrectLevel.H 
    });
    window.showToast("📱 QR Code Consenso Informato Generato!");
};

// --- 3. STAMPA FASCICOLI E MODULI CLINICI ---
window.printMasterFascicolo = () => { 
    const n = document.getElementById('clinicalGuestSelect').value; 
    if (!n) return window.showToast("⚠️ Seleziona un paziente dalla Cartella Clinica per stampare il fascicolo."); 
    
    let d = AppState.clinica[n] || {}; 
    let curTerDate = new Date(); 
    let mk = `${curTerDate.getFullYear()}-${String(curTerDate.getMonth()+1).padStart(2,'0')}`;
    let fM = d.terapiaFirmeMensili ? d.terapiaFirmeMensili[mk] : null;

    let terapiaHtml = typeof window.getTerapiaListHtml === 'function' ? window.getTerapiaListHtml(d.terapiaList, false, fM) : '';

    document.getElementById('printArea').innerHTML = window.getPrintHeader('FASCICOLO CLINICO: ' + n) + 
        `<h3>1. Check-in</h3><p>${d.chkGen || 'Nessun dato registrato.'}</p>` +
        `<h3>2. P.A.I.</h3><p>Med: ${d.paiMedico || '-'}</p><p>Inf: ${d.paiInfermieristico || '-'}</p><p>OSS: ${d.paiAssistenziale || '-'}</p>` +
        `<h3>3. Terapia</h3>` + terapiaHtml; 
        
    window.print(); 
};