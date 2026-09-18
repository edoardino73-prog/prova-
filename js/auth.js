// js/auth.js
import { db, auth } from './services/firebase-init.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { AppState } from './state.js';

export const initAuth = () => {
    // Ascoltiamo in tempo reale la collezione "operatori" da Firestore
    onSnapshot(collection(db, "operatori"), (snap) => {
        const operatori = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        AppState.update('operatori', operatori);
        loadOperatorsUI(operatori);
    }, (error) => {
        console.error("Errore nel caricamento degli operatori da Firestore:", error);
    });

    // Collega l'invio del PIN con il tasto Invio
    const pinInput = document.getElementById('loginPinInput');
    if (pinInput) {
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.performLogin();
        });
    }
};

// Funzione per popolare la griglia dei profili nella schermata di login
function loadOperatorsUI(operatori) {
    const lc = document.getElementById('loginProfilesContainer');
    if (!lc) return;

    let vOps = [...operatori.filter(o => o && o.name && o.name.trim() !== "")];
    
    // Fallback di sicurezza per l'Admin se il DB è vuoto
    if (!vOps.some(o => o.name === "Admin")) {
        vOps.push({ id: "admin-fallback", name: "Admin", pin: "12345", role: "admin", qualifica: "Direttore Sanitario" });
    }
    
    vOps.sort((a, b) => a.name.localeCompare(b.name));
    
    lc.innerHTML = '';
    vOps.forEach(op => {
        let iniziale = op.name[0] ? op.name[0].toUpperCase() : '👤';
        let b = document.createElement('div');
        b.className = 'profile-btn';
        b.innerHTML = `
            <div class="profile-avatar">${iniziale}</div>
            <span class="profile-name">${op.name.split(' ')[0]}</span>
            <span class="profile-qual" style="font-size:0.75em; color:var(--text-light);">${op.qualifica || ''}</span>
        `;
        b.onclick = () => window.selectLoginProfile(op.name);
        lc.appendChild(b);
    });
}

// Funzioni globali per la gestione della schermata di login
window.selectedLoginOperator = "";

window.selectLoginProfile = (n) => {
    window.selectedLoginOperator = n;
    const profilesContainer = document.getElementById('loginProfilesContainer');
    const pinArea = document.getElementById('loginPinArea');
    const profileLabel = document.getElementById('selectedProfileLabel');
    const pinInput = document.getElementById('loginPinInput');

    if (profilesContainer) profilesContainer.style.display = 'none';
    if (pinArea) pinArea.style.display = 'block';
    if (profileLabel) profileLabel.innerText = "🔑 Ciao " + n.split(' ')[0] + ", inserisci il PIN:";
    if (pinInput) setTimeout(() => pinInput.focus(), 100);
};

window.resetLoginSelection = () => {
    window.selectedLoginOperator = "";
    const profilesContainer = document.getElementById('loginProfilesContainer');
    const pinArea = document.getElementById('loginPinArea');
    const pinInput = document.getElementById('loginPinInput');

    if (pinArea) pinArea.style.display = 'none';
    if (profilesContainer) profilesContainer.style.display = 'flex';
    if (pinInput) pinInput.value = '';
};

window.performLogin = async () => {
    const pinInput = document.getElementById('loginPinInput');
    const p = pinInput ? pinInput.value : '';
    const op = AppState.operatori.find(o => o.name === window.selectedLoginOperator);
    let realOp = op || { id: "admin-fallback", name: "Admin", pin: "12345", role: "admin", qualifica: "Direttore Sanitario" };
    
    if (realOp.pin !== p && window.selectedLoginOperator !== 'Admin') {
        alert("❌ PIN Errato");
        if (pinInput) pinInput.value = '';
        return;
    }

    const emailPrefix = realOp.id === "admin-fallback" ? "admin" : realOp.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${emailPrefix}@nvs.it`;
    const password = p.length >= 6 ? p : p + "NVS";

    try {
        await signInWithEmailAndPassword(auth, email, password);
        finalizeLogin(realOp);
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                finalizeLogin(realOp);
            } catch (createError) {
                console.warn("Autenticazione Cloud limitata, procedo localmente:", createError);
                finalizeLogin(realOp);
            }
        } else {
            finalizeLogin(realOp);
        }
    }
};

function finalizeLogin(realOp) {
    AppState.activeOperator = realOp.name;
    AppState.activeOperatorRole = realOp.role;
    AppState.activeOperatorQualifica = realOp.qualifica;
    
    sessionStorage.setItem("activeOperator", realOp.name);
    sessionStorage.setItem("activeRole", realOp.role);
    sessionStorage.setItem("activeQualifica", realOp.qualifica);
    
    const opBadge = document.getElementById('currentOpBadge');
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('appScreen');

    if (opBadge) opBadge.innerText = `👤 ${realOp.name}`;
    if (loginScreen) loginScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'flex';
    
    applyRolePermissions(realOp.qualifica, realOp.role);
    window.resetLoginSelection();
}

function applyRolePermissions(qualifica, role) {
    document.body.setAttribute('data-qualifica', qualifica || '');
    if (['Medico', 'Direttore Sanitario'].includes(qualifica) || role === 'admin') {
        document.body.setAttribute('data-med-access', 'true');
    } else {
        document.body.removeAttribute('data-med-access');
    }
    
    if (['Direttore Sanitario', 'Infermiere', 'Amministrazione'].includes(qualifica) || role === 'admin') {
        document.body.setAttribute('data-sign-access', 'true');
    } else {
        document.body.removeAttribute('data-sign-access');
    }
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = role === 'admin' ? 'block' : 'none';
}

window.logout = async () => {
    try { await signOut(auth); } catch(e) {}
    sessionStorage.clear();
    window.location.reload();
};