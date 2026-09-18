// js/ui/navigation.js
import { AppState } from '../state.js';

export const initNavigation = () => {
    // 1. Cambio Tab principale (Dashboard, Ospiti, Clinica, Terapia, ecc.)
    window.switchTab = (ws, btn) => {
        document.querySelectorAll('.workspace, .menu-tab').forEach(e => e.classList.remove('active'));
        const targetWs = document.getElementById('ws-' + ws);
        if (targetWs) targetWs.classList.add('active');
        if (btn) btn.classList.add('active');
        
        if (ws === 'dashboard' && typeof window.renderCharts === 'function') {
            window.renderCharts();
        }
    };

    // 2. Rendering della Sidebar Pazienti con ricerca in tempo reale
    const searchInput = document.getElementById('sidebarSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => renderSidebarPatients());
    }

    // Ascoltiamo i cambiamenti dello stato globale per aggiornare la UI automaticamente
    document.addEventListener('state:ospiti', (e) => {
        renderSidebarPatients();
    });
};

function renderSidebarPatients() {
    const l = document.getElementById('sidebarPatientList');
    const searchInput = document.getElementById('sidebarSearch');
    const s = searchInput ? searchInput.value.toLowerCase() : '';
    if (!l) return;

    l.innerHTML = '';
    const attivi = AppState.ospiti.filter(g => !g.decesso && !g.dimissione);
    
    attivi.sort((a, b) => a.name.localeCompare(b.name)).forEach(g => {
        if (s && !g.name.toLowerCase().includes(s)) return;
        
        let av = g.photo 
            ? `<img src="${g.photo}" class="sidebar-avatar" alt="Foto">` 
            : `<div class="sidebar-avatar">👤</div>`;
            
        let item = document.createElement('div');
        item.className = `sidebar-item ${g.name === AppState.globalSelectedPatient ? 'active' : ''}`;
        item.innerHTML = `${av}<div style="font-size:0.9em; font-weight:bold; overflow:hidden; text-overflow:ellipsis;">${g.name}</div>`;
        item.onclick = () => window.selectPatientGlobal(g.name);
        l.appendChild(item);
    });
}

window.selectPatientGlobal = (n) => {
    AppState.globalSelectedPatient = n;
    
    // Sincronizza tutte le select dei pazienti nelle varie tab
    ['clinicalGuestSelect', 'terapiaGuestSelect', 'lettereGuestSelect', 'appGuestSelect', 'newRischioOspite', 'contOspite'].forEach(id => {
        const s = document.getElementById(id);
        if (s && [...s.options].some(o => o.value === n)) s.value = n;
    });

    if (typeof window.handlePatientSelect === 'function') {
        window.handlePatientSelect('clinicalGuestSelect');
    }
    renderSidebarPatients();
    if (typeof window.showToast === 'function') window.showToast(`👤 Selezionato: ${n}`);
};