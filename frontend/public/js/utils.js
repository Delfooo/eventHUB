// Utilities JavaScript per EventHub
// Funzioni helper utilizzate in tutte le pagine

// Configurazione globale
const API_URL = 'http://localhost:3000/api';

// =======================================================
// ===== GESTIONE ALERT =====
// =======================================================

function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertId = 'alert-' + Date.now();
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const alertHTML = `
        <div class="alert alert-${type}" id="${alertId}">
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="closeAlert('${alertId}')" style="margin-left: auto; background: none; border: none; cursor: pointer; font-size: 18px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Rimuovi automaticamente dopo la durata specificata
    if (duration > 0) {
        setTimeout(() => closeAlert(alertId), duration);
    }
}

function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }
}

// =======================================================
// ===== GESTIONE TOKEN & UTENTE =====
// =======================================================

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function isAuthenticated() {
    return !!getToken();
}

function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

// =======================================================
// ===== FETCH CON AUTENTICAZIONE (Authenticated Fetch) =====
// =======================================================

async function authenticatedFetch(url, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            // Aggiunge l'header Authorization solo se il token esiste
            ...(token && { 'Authorization': `Bearer ${token}` }) 
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        // Gestione automatica del reindirizzamento in caso di token scaduto
        if (response.status === 401) {
            removeToken();
            // Evita il reindirizzamento se siamo già sulla pagina di login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return { response, data: { success: false, message: 'Sessione scaduta' } };
        }
        
        const data = await response.json();
        return { response, data };
    } catch (error) {
        console.error('Fetch error:', error);
        showAlert('Errore di connessione al server', 'error');
        return null;
    }
}

// =======================================================
// ===== VERIFICA STATO E LOGOUT (Funzioni di Navigazione) =====
// =======================================================

async function checkAuthStatus() {
    const token = getToken();
    const authLinks = document.getElementById('authLinks');
    const guestLinks = document.getElementById('guestLinks');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!token) {
        // Utente non autenticato
        if (authLinks) authLinks.style.display = 'none';
        if (guestLinks) guestLinks.style.display = 'flex';
        if (adminLink) adminLink.style.display = 'none';
        return false;
    }
    
    // Altrimenti, verifica la validità del token con il backend
    const result = await authenticatedFetch(`${API_URL}/auth/verify`, { method: 'GET' });

    if (result && result.data.success) {
        // Token valido
        if (authLinks) authLinks.style.display = 'flex';
        if (guestLinks) guestLinks.style.display = 'none';
        
        // Mostra link admin
        if (adminLink) {
            adminLink.style.display = isAdmin() ? 'block' : 'none';
        }

        // Aggiungi listener per il Logout (solo se il token è valido)
        if (logoutBtn && !logoutBtn.hasListener) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
            logoutBtn.hasListener = true; // Flag per prevenire duplicati
        }

        return true;
    } else {
        // Token non valido / errore di verifica
        removeToken();
        if (authLinks) authLinks.style.display = 'none';
        if (guestLinks) guestLinks.style.display = 'flex';
        if (adminLink) adminLink.style.display = 'none';
        return false;
    }
}

async function logout() {
    if (!confirm('Sei sicuro di voler uscire?')) return;
    
    try {
        // Esegue il fetch di logout (anche se fallisce, il cleanup locale è garantito)
        await authenticatedFetch(`${API_URL}/auth/logout`, {
            method: 'POST'
        });
    } catch (error) {
        console.warn('Errore durante la chiamata di logout al server, procedo con cleanup locale.', error);
    } finally {
        removeToken();
        showAlert('Logout effettuato con successo', 'success', 2000);
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

// =======================================================
// ===== PROTEZIONE PAGINE =====
// =======================================================

function requireAuth() {
    if (!isAuthenticated()) {
        showAlert('Devi effettuare il login per accedere a questa pagina', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!isAuthenticated() || !isAdmin()) {
        showAlert('Accesso non autorizzato', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        return false;
    }
    return true;
}

// =======================================================
// ===== FORMATTAZIONE DATA/ORA =====
// =======================================================

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('it-IT', options);
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// =======================================================
// ===== VALIDAZIONE FORM =====
// =======================================================

function validateEmail(email) {
    // Ho mantenuto la regex più robusta del secondo blocco
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/; 
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// =======================================================
// ===== LOADING SPINNER =====
// =======================================================

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caricamento...';
        element.disabled = true;
    }
}

function hideLoading(elementId, originalText) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = originalText;
        element.disabled = false;
    }
}

// =======================================================
// ===== UTILITÀ VARIE =====
// =======================================================

// HAMBURGER MENU (Mobile) - Esecuzione all'avvio
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Esegui la verifica dello stato di autenticazione all'avvio (utile per la navbar)
    checkAuthStatus();
});

// DEBOUNCE
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ESCAPE HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}