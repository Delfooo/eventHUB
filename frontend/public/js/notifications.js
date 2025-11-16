// public/js/notifications.js
// Gestione del campanello notifiche in tempo reale (Socket.IO)

// Assumi che API_URL e le funzioni helper siano disponibili globalmente (es. da utils.js)
const API_URL = 'http://localhost:3000/api';
const NOTIFICATIONS_API_URL = `${API_URL}/user/notifications`;
const SOCKET_URL = '/'; // Connessione allo stesso host/porta del frontend

// Variabili globali per lo stato
let notificationSocket = null;
let unreadCount = 0;

// Variabili globali per la UI (si basano sull'HTML del campanello)
const bellButton = document.getElementById('notificationBell');
const dropdown = document.getElementById('notificationDropdown');
const badge = document.getElementById('notificationBadge');
const list = document.getElementById('notificationList');

// ===== INIZIALIZZAZIONE GLOBALE =====
document.addEventListener('DOMContentLoaded', () => {
    // Solo se l'utente è autenticato e le utility sono disponibili
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
        initializeNotifications();
    } else if (badge) {
        badge.style.display = 'none';
    }
});

function initializeNotifications() {
    // Setup click sul campanello e chiusura esterna
    setupNotificationBell();
    
    // Carica notifiche iniziali (solo il conteggio, la lista viene caricata all'apertura)
    loadNotificationCounts();
    
    // Connetti Socket.io per notifiche real-time
    setupSocketIO();
}

// ===== GESTIONE UI (BADGE E DROPDOWN) =====

function updateBadge(count) {
    if (!badge) return;
    
    unreadCount = count;
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex'; // Mostra il badge
    } else {
        badge.style.display = 'none'; // Nascondi il badge
    }
}

function setupNotificationBell() {
    if (bellButton && dropdown) {
        bellButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
            
            if (dropdown.classList.contains('active')) {
                loadNotifications(); // Carica l'elenco completo all'apertura
            }
        });
        
        // Chiudi dropdown quando si clicca fuori
        document.addEventListener('click', (e) => {
            if (!bellButton.contains(e.target) && !dropdown.contains(e.target) && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });
    }
}


// ===== LOGICA SOCKET.IO (Real-Time) =====

function setupSocketIO() {
    if (typeof io === 'undefined') {
        console.warn('Socket.io library non caricata. Notifiche real-time disabilitate.');
        return;
    }
    
    const token = localStorage.getItem('token'); 
    
    notificationSocket = io(SOCKET_URL, {
        auth: {
            token: token // Usa il token per l'autenticazione lato server
        },
        transports: ['websocket', 'polling']
    });

    notificationSocket.on('connect', () => {
        console.log('🔔 Socket notifiche connesso.');
    });

    // Ascolta nuove notifiche dal server
    notificationSocket.on('newNotification', (notification) => {
        console.log('🔔 Nuova notifica in arrivo:', notification);
        handleNewNotification(notification);
    });

    notificationSocket.on('error', (error) => {
        console.error('❌ Errore Socket.io:', error.message);
    });
}

function handleNewNotification(notification) {
    // 1. Aggiorna il conteggio e il badge
    unreadCount++;
    updateBadge(unreadCount);
    
    // 2. Mostra un toast (presuppone stili e helper showNotificationToast definiti altrove)
    if (typeof showNotificationToast === 'function') {
        // Mappa il formato di notifica per il toast
        showNotificationToast({
            title: notification.type.replace('-', ' ').toUpperCase(), 
            message: notification.message,
            icon: getNotificationIcon(notification.type),
            link: notification.link || ''
        });
    } else if (typeof showAlert === 'function') {
         showAlert('Hai una nuova notifica: ' + notification.message, 'info', 3000);
    }
    
    // 3. Riproduci suono (se la funzione esiste)
    if (typeof playNotificationSound === 'function') {
        playNotificationSound();
    }
    
    // 4. Se il dropdown è aperto, aggiorna la lista
    if (dropdown && dropdown.classList.contains('active')) {
         loadNotifications();
    }
}


// ===== CHIAMATE API E RENDERING =====

// 1. Carica solo il conteggio (all'inizializzazione)
async function loadNotificationCounts() {
    try {
        const response = await authenticatedFetch(`${NOTIFICATIONS_API_URL}/count`);
        
        if (response && response.success) {
            updateBadge(response.data.unreadCount || 0);
        }
    } catch (error) {
        console.error('Errore caricamento conteggio notifiche:', error);
    }
}

// 2. Carica le notifiche complete (all'apertura del dropdown)
async function loadNotifications(limit = 20) {
    if (!list) return;
    
    list.innerHTML = `<p class="text-center mt-2"><i class="fas fa-spinner fa-spin"></i> Caricamento...</p>`;
    
    try {
        const response = await authenticatedFetch(`${NOTIFICATIONS_API_URL}?limit=${limit}`);
        
        if (response && response.success) {
            const notifications = response.data.notifications || [];
            updateBadge(response.data.unreadCount || 0); // Aggiorna il badge con dati freschi
            displayNotifications(notifications);
        } else {
             displayNotifications([]);
        }
    } catch (error) {
        console.error('Errore caricamento notifiche:', error);
        list.innerHTML = `<p class="notification-item notification-error">Errore di connessione al server.</p>`;
    }
}

// 3. Visualizza la lista delle notifiche nel dropdown
function displayNotifications(notifications) {
    if (!list) return;
    
    list.innerHTML = '';
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty" id="noNotificationsMessage">
                <i class="fas fa-bell-slash"></i>
                <p>Nessuna notifica</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map(notif => createNotificationHTML(notif)).join('');
}

function createNotificationHTML(notif) {
    // Presumendo che `escapeHtml` sia disponibile in utils.js
    const escapedMessage = typeof escapeHtml === 'function' ? escapeHtml(notif.message) : notif.message;
    const timeAgo = typeof getTimeAgo === 'function' ? getTimeAgo(new Date(notif.createdAt)) : formatTimestamp(notif.createdAt);
    const unreadClass = !notif.isRead ? 'unread' : '';
    const link = notif.link || '';
    
    return `
        <div class="notification-item ${unreadClass}" data-id="${notif._id}">
            <div class="notification-icon">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content" onclick="markNotificationAsReadAndRedirect('${notif._id}', '${link}')">
                <p class="notification-message">${escapedMessage}</p>
                <span class="notification-timestamp">${timeAgo}</span>
            </div>
            ${!notif.isRead ? '<div class="unread-dot"></div>' : ''}
        </div>
    `;
}


// ===== AZIONI NOTIFICHE (Funzioni Globali) =====

// 1. Segna notifica specifica come letta e reindirizza
window.markNotificationAsReadAndRedirect = async function(notificationId, link) {
    if (!isAuthenticated()) return;
    
    try {
        // Aggiornamento ottimistico dell'UI
        const item = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (item && item.classList.contains('unread')) {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.unread-dot');
            if (dot) dot.remove();
            
            updateBadge(unreadCount - 1);
        }

        await authenticatedFetch(`${NOTIFICATIONS_API_URL}/read/${notificationId}`, {
            method: 'PUT'
        });
        
        // Vai al link se presente
        if (link) {
            setTimeout(() => {
                window.location.href = link;
            }, 100); 
        }

    } catch (error) {
        console.error('Errore nel segnare la notifica come letta:', error);
        if (typeof showAlert === 'function') showAlert('Errore nel segnare la notifica', 'error');
        loadNotifications(); // Ricarica in caso di fallimento dell'ottimistic update
    }
};

// 2. Segna tutte le notifiche come lette
window.markAllNotificationsAsRead = async function() {
    if (!isAuthenticated()) return;
    
    try {
        // Aggiorna la UI (optimistic update)
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.unread-dot');
            if (dot) dot.remove();
        });
        updateBadge(0);
        
        await authenticatedFetch(`${NOTIFICATIONS_API_URL}/read-all`, {
            method: 'PUT'
        });

        if (typeof showAlert === 'function') showAlert('Tutte le notifiche sono state segnate come lette', 'success', 2000);
        
    } catch (error) {
        console.error('Errore nel segnare tutte le notifiche come lette:', error);
        if (typeof showAlert === 'function') showAlert('Errore durante l\'operazione', 'error');
        loadNotifications();
    }
};


// ===== FUNZIONI HELPER LOCALI/ASSUNTE (Da spostare in utils.js se preferisci) =====

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'event-update': return 'calendar-alt';
        case 'event-cancellation': return 'ban';
        case 'registration': return 'user-check';
        case 'message': return 'envelope';
        default: return 'bell';
    }
}

// Funzione di formattazione temporanea (se getTimeAgo non è in utils.js)
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date)) return 'Data non valida';
    
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('it-IT', options);
}

// Funzione getTimeAgo (integrata dal secondo blocco)
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        anno: 31536000,
        mese: 2592000,
        settimana: 604800,
        giorno: 86400,
        ora: 3600,
        minuto: 60
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return interval === 1 ? `1 ${name} fa` : `${interval} ${name}${name !== 'mese' ? 'i' : 'i'} fa`;
        }
    }
    
    return 'Ora';
}

// Funzione playNotificationSound (integrata dal secondo blocco - richiede Audio API)
function playNotificationSound() {
    try {
        // Breve clip audio in formato base64 (sostituire con un file audio effettivo se preferisci)
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTeN0/LMdycFJXfH8N2PQAoUXrTp66hVFApGn+DyvmwhBTeN0/LMdycF');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignora errori se user non ha interagito
    } catch (error) {
        console.log('Suono notifica non disponibile');
    }
}

// Funzione Show Notification Toast (se non in utils.js)
// Nota: La logica del toast dovrebbe avere il CSS associato per funzionare
function showNotificationToast(notification) {
    const toastContainer = document.querySelector('.toast-container') || (() => {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    })();

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${notification.icon}"></i>
        </div>
        <div class="toast-content">
            <strong>${typeof escapeHtml === 'function' ? escapeHtml(notification.title) : notification.title}</strong>
            <p>${typeof escapeHtml === 'function' ? escapeHtml(notification.message) : notification.message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove dopo 5 secondi
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Click per andare al link
    if (notification.link) {
        toast.style.cursor = 'pointer';
        toast.onclick = (e) => {
            // Evita di reindirizzare se si clicca sul pulsante di chiusura
            if (!e.target.closest('.toast-close')) {
                window.location.href = notification.link;
            }
        };
    }
}