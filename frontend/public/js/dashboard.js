// JavaScript per Dashboard Utente e Notifiche

// Variabili globali per la dashboard
let userData = null;
let myEvents = [];
let joinedEvents = [];
let socket = null; // Variabile per la connessione Socket.IO

// Callback quando immagine è caricata (Implementazione richiesta)
window.onImageUploaded = (url) => {
    document.getElementById('eventImage').value = url;
    console.log('Immagine caricata:', url);
};

// =======================================================
// ===== GESTIONE DASHBOARD =====
// =======================================================

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    // La funzione checkAuthStatus() è in utils.js e dovrebbe essere già chiamata
    
    // Esegui il setup solo se l'utente è autenticato (previsto da requireAuth/checkAuthStatus in utils.js)
    if (typeof isAuthenticated === 'function' && isAuthenticated()) { 
        loadUserData();
        loadUserEvents();
        setupSidebarNavigation();
        setupCreateEventForm();
        setupNotificationSystem(); // NUOVA INIZIALIZZAZIONE NOTIFICHE
        setupSocketIo(); // NUOVA INIZIALIZZAZIONE SOCKET
        
        // Dopo DOMContentLoaded, aggiungi: (Implementazione richiesta)
        // Nota: Assicurati che setupImageUpload e setupDragAndDrop siano definiti altrove (es. utils.js)
        const imageUploader = setupImageUpload('eventImageFile', 'imagePreview', 'uploadImageBtn');
        setupDragAndDrop('imageDropZone', 'eventImageFile', 'imagePreview');

        // Gestisci hash nella URL per navigazione diretta
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);
    }
});

// ===== CARICA DATI UTENTE =====
async function loadUserData() {
    try {
        const result = await authenticatedFetch(`${API_URL}/user/profile`);
        
        if (result && result.data.success) {
            userData = result.data.user;
            displayUserInfo(userData);
        }
    } catch (error) {
        console.error('Errore caricamento profilo:', error);
        showAlert('Errore nel caricamento del profilo', 'error');
    }
}

// ===== VISUALIZZA INFO UTENTE =====
function displayUserInfo(user) {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = user.username;

    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = user.email;
    
    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) {
        const roleText = user.role === 'admin' ? 'Amministratore' : 'Utente';
        userRoleEl.textContent = roleText;
    }
    
    // Mostra link admin se è admin (se l'elemento esiste)
    if (user.role === 'admin') {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.style.display = 'flex';
    }
}

// ===== CARICA EVENTI UTENTE =====
async function loadUserEvents() {
    try {
        const result = await authenticatedFetch(`${API_URL}/user/events`);
        
        if (result && result.data.success) {
            const events = result.data.events || [];
            // Ottiene l'ID utente in modo sicuro
            const currentUserId = userData ? userData._id : (typeof getUser === 'function' ? (getUser() ? getUser()._id : null) : null);
            
            // Separa eventi creati da eventi a cui si è iscritti
            myEvents = events.filter(event => 
                event.owner && event.owner._id === currentUserId
            );
            
            joinedEvents = events.filter(event => 
                event.owner && event.owner._id !== currentUserId
            );
            
            updateStats();
            displayMyEvents();
            displayJoinedEvents();
        }
    } catch (error) {
        console.error('Errore caricamento eventi:', error);
        showAlert('Errore nel caricamento degli eventi', 'error');
    }
}

// ===== AGGIORNA STATISTICHE =====
function updateStats() {
    const createdEventsCountEl = document.getElementById('createdEventsCount');
    if (createdEventsCountEl) createdEventsCountEl.textContent = myEvents.length;
    
    const joinedEventsCountEl = document.getElementById('joinedEventsCount');
    if (joinedEventsCountEl) joinedEventsCountEl.textContent = joinedEvents.length;
    
    const totalAttendees = myEvents.reduce((sum, event) => 
        sum + (event.attendees ? event.attendees.length : 0), 0
    );
    const totalAttendeesCountEl = document.getElementById('totalAttendeesCount');
    if (totalAttendeesCountEl) totalAttendeesCountEl.textContent = totalAttendees;
    
    const now = new Date();
    const upcomingCount = [...myEvents, ...joinedEvents].filter(event => 
        new Date(event.date) > now
    ).length;
    const upcomingEventsCountEl = document.getElementById('upcomingEventsCount');
    if (upcomingEventsCountEl) upcomingEventsCountEl.textContent = upcomingCount;
}

// ===== VISUALIZZA EVENTI CREATI E ISCRITTI (funzioni unificate) =====
function displayMyEvents() {
    const loadingEl = document.getElementById('myEventsLoading');
    const emptyEl = document.getElementById('myEventsEmpty');
    const listEl = document.getElementById('myEventsList');
    
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (!listEl) return;

    if (myEvents.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        listEl.innerHTML = '';
        return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    listEl.innerHTML = myEvents.map(event => createEventItemHTML(event, true)).join('');
}

function displayJoinedEvents() {
    const loadingEl = document.getElementById('joinedEventsLoading');
    const emptyEl = document.getElementById('joinedEventsEmpty');
    const listEl = document.getElementById('joinedEventsList');
    
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (!listEl) return;

    if (joinedEvents.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        listEl.innerHTML = '';
        return;
    }
    
    if (emptyEl) emptyEl.style.display = 'none';
    listEl.innerHTML = joinedEvents.map(event => createEventItemHTML(event, false)).join('');
}

// ===== CREA HTML EVENTO =====
function createEventItemHTML(event, isOwner) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    const categoryIcons = {
        'Musica': '🎵', 'Sport': '⚽', 'Arte': '🎨', 'Tecnologia': '💻', 'Cibo': '🍕',
        'Business': '💼', 'Formazione': '📚', 'Intrattenimento': '🎭', 'Altro': '🎪'
    };
    const categoryIcon = categoryIcons[event.category] || '📅';
    
    const actionsHTML = isOwner ? `
        <button class="btn btn-primary btn-sm" onclick="editEvent('${event._id}')">
            <i class="fas fa-edit"></i> Modifica
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event._id}')">
            <i class="fas fa-trash"></i> Elimina
        </button>
    ` : `
        <button class="btn btn-primary btn-sm" onclick="viewEvent('${event._id}')">
            <i class="fas fa-eye"></i> Visualizza
        </button>
        <button class="btn btn-danger btn-sm" onclick="leaveEvent('${event._id}')">
            <i class="fas fa-sign-out-alt"></i> Annulla
        </button>
    `;
    
    // Uso data-id per facilitare la selezione da JS
    return `
        <div class="event-item" data-id="${event._id}">
            <img 
                src="${event.image || 'https://via.placeholder.com/400x200?text=EventHub'}" 
                alt="${typeof escapeHtml === 'function' ? escapeHtml(event.title) : event.title}"
                class="event-item-image"
                onerror="this.src='https://via.placeholder.com/400x200?text=EventHub'"
            >
            <div class="event-item-content">
                <span class="event-item-category">${categoryIcon} ${typeof escapeHtml === 'function' ? escapeHtml(event.category) : event.category}</span>
                <h3 class="event-item-title">${typeof escapeHtml === 'function' ? escapeHtml(event.title) : event.title}</h3>
                
                <div class="event-item-meta">
                    <div>
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate} alle ${formattedTime}</span>
                    </div>
                    <div>
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${typeof escapeHtml === 'function' ? escapeHtml(event.location) : event.location}</span>
                    </div>
                    <div>
                        <i class="fas fa-users"></i>
                        <span>${attendeesCount} / ${event.capacity} partecipanti</span>
                    </div>
                </div>
                
                <div class="event-item-actions">
                    ${actionsHTML}
                </div>
            </div>
        </div>
    `;
}

// ===== NAVIGAZIONE SIDEBAR =====
function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Aggiorna URL hash solo per sezioni principali
    const sectionsToHash = ['overview', 'my-events', 'joined-events', 'profile'];
    if (sectionsToHash.includes(sectionName)) {
         window.location.hash = sectionName;
    } else if (window.location.hash) {
        history.replaceState(null, null, ' ');
    }
}

function handleHashNavigation() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        switchSection(hash);
    } else {
        switchSection('overview');
    }
}

// ===== FORM CREA EVENTO =====
function setupCreateEventForm() {
    const form = document.getElementById('createEventForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnId = 'createEventBtn';
        const btn = document.getElementById(btnId);
        
        const originalText = btn.innerHTML;
        
        const eventData = {
            title: document.getElementById('eventTitle').value.trim(),
            description: document.getElementById('eventDescription').value.trim(),
            date: document.getElementById('eventDate').value,
            location: document.getElementById('eventLocation').value.trim(),
            capacity: parseInt(document.getElementById('eventCapacity').value),
            category: document.getElementById('eventCategory').value,
            image: undefined // Inizializzato a undefined
        };
        
        // Nel form submit, prima di inviare: (Implementazione richiesta)
        const imageUrl = document.getElementById('eventImage').value.trim();
        if (imageUrl) {
            eventData.image = imageUrl;
        }

        if (!eventData.title || !eventData.description || !eventData.date || 
            !eventData.location || !eventData.capacity || !eventData.category) {
            showAlert('Compila tutti i campi obbligatori', 'error');
            return;
        }

        if (new Date(eventData.date) < new Date()) {
            showAlert('La data dell\'evento non può essere nel passato.', 'error');
            return;
        }
        
        typeof showLoading === 'function' ? showLoading(btnId) : btn.disabled = true;
        
        try {
            const result = await authenticatedFetch(`${API_URL}/events`, {
                method: 'POST',
                body: JSON.stringify(eventData)
            });
            
            if (result && result.data.success) {
                showAlert('Evento creato con successo! Il tuo evento è ora in lista.', 'success');
                resetEventForm();
                loadUserEvents();
                switchSection('my-events');
            } else {
                showAlert(result.data.message || 'Errore nella creazione dell\'evento', 'error');
            }
        } catch (error) {
            console.error('Errore creazione evento:', error);
            showAlert('Errore di connessione al server', 'error');
        } finally {
            typeof hideLoading === 'function' ? hideLoading(btnId, originalText) : btn.disabled = false;
        }
    });
}

function resetEventForm() {
    const form = document.getElementById('createEventForm');
    if (form) form.reset();
}

// ===== AZIONI EVENTI (Funzioni globali) =====
function viewEvent(eventId) {
    window.location.href = `/event/${eventId}`;
}

async function editEvent(eventId) {
    showAlert('Funzionalità di modifica in arrivo', 'info');
}

async function deleteEvent(eventId) {
    if (!confirm('Sei sicuro di voler eliminare questo evento? Verrà rimosso permanentemente.')) return;
    
    const eventItem = document.querySelector(`.event-item[data-id="${eventId}"]`);
    if (eventItem) eventItem.style.opacity = 0.5;
    
    try {
        const result = await authenticatedFetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE'
        });
        
        if (result && result.data.success) {
            showAlert('Evento eliminato con successo', 'success');
            loadUserEvents();
        } else {
            showAlert(result.data.message || 'Errore nell\'eliminazione dell\'evento', 'error');
            if (eventItem) eventItem.style.opacity = 1;
        }
    } catch (error) {
        console.error('Errore eliminazione evento:', error);
        showAlert('Errore di connessione al server', 'error');
        if (eventItem) eventItem.style.opacity = 1;
    }
}

async function leaveEvent(eventId) {
    if (!confirm('Vuoi annullare la tua iscrizione a questo evento?')) return;
    
    const eventItem = document.querySelector(`.event-item[data-id="${eventId}"]`);
    if (eventItem) eventItem.style.opacity = 0.5;

    try {
        const result = await authenticatedFetch(`${API_URL}/events/${eventId}/rsvp`, {
            method: 'DELETE' // Assumo endpoint per annullare iscrizione
        });
        
        if (result && (result.response.status === 200 || result.data.success)) {
            showAlert('Iscrizione annullata con successo', 'success');
            loadUserEvents();
        } else {
            showAlert(result.data.message || 'Errore nell\'annullamento dell\'iscrizione', 'error');
            if (eventItem) eventItem.style.opacity = 1;
        }
    } catch (error) {
        console.error('Errore annullamento iscrizione:', error);
        showAlert('Errore di connessione al server', 'error');
        if (eventItem) eventItem.style.opacity = 1;
    }
}

// =======================================================
// ===== GESTIONE NOTIFICHE (NUOVO) =====
// =======================================================

/**
 * Inizializza gli event listener per la campanella di notifica.
 */
function setupNotificationSystem() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');

    if (bell && dropdown) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationDropdown();
        });

        document.addEventListener('click', (e) => {
            if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        fetchNotifications();
    }
}

/**
 * Mostra/nasconde il dropdown delle notifiche.
 */
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

/**
 * Connette a Socket.IO per ricevere notifiche in tempo reale.
 */
function setupSocketIo() {
    // Verifico che la libreria io sia stata caricata
    if (typeof io === 'undefined' || typeof getToken !== 'function') {
        console.warn('Socket.IO o getToken non disponibili. Notifiche real-time disabilitate.');
        return;
    }

    const token = getToken();
    if (!token) return;

    // Connessione con il token per l'autenticazione
    socket = io(API_URL.replace('/api', ''), {
        query: { token: token },
        path: '/socket.io' // Assicurati che questo corrisponda al path del tuo server
    });

    socket.on('connect', () => {
        console.log('Socket connesso per le notifiche.');
    });

    // Ascolta un nuovo evento di notifica dal server
    socket.on('newNotification', (notification) => {
        console.log('Nuova notifica ricevuta:', notification);
        showAlert(notification.message || 'Hai una nuova notifica!', 'info');
        fetchNotifications(); // Aggiorna la lista e il badge
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnesso.');
    });
}


/**
 * Recupera le notifiche non lette dal server API.
 */
async function fetchNotifications() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    try {
        const result = await authenticatedFetch(`${API_URL}/notifications`); // Assumo l'endpoint /notifications
        
        if (result && result.data.success) {
            const notifications = result.data.notifications || [];
            
            // Filtra solo quelle non lette
            const unreadNotifications = notifications.filter(n => !n.isRead);
            
            // Aggiorna il badge
            badge.textContent = unreadNotifications.length > 99 ? '99+' : unreadNotifications.length.toString();
            badge.style.display = unreadNotifications.length > 0 ? 'flex' : 'none';
            
            renderNotifications(notifications);
        } else {
            // Se fallisce, resetta il badge
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Errore di connessione fetch notifiche:', error);
    }
}

/**
 * Renderizza la lista delle notifiche nel dropdown.
 */
function renderNotifications(notifications) {
    const listEl = document.getElementById('notificationList');
    if (!listEl) return;
    
    if (notifications.length === 0) {
        listEl.innerHTML = '<div class="notification-item-empty">Nessuna notifica.</div>';
        return;
    }

    listEl.innerHTML = notifications.map(n => {
        // Uso la funzione formatDateShort da utils.js se disponibile, altrimenti fallback
        const formattedTime = (typeof formatDateShort === 'function' ? formatDateShort(n.createdAt) : new Date(n.createdAt).toLocaleDateString('it-IT'));
        
        return `
            <div class="notification-item ${n.isRead ? 'read' : 'unread'}" 
                 onclick="viewNotification('${n._id}', '${n.link || '#'}')">
                <div class="notification-icon">
                    <i class="fas fa-${getNotificationIcon(n.type)}"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-message">${typeof escapeHtml === 'function' ? escapeHtml(n.message) : n.message}</p>
                    <span class="notification-time">${formattedTime}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Segna una singola notifica come letta e reindirizza (se ha un link).
 */
async function viewNotification(notificationId, link) {
    // Chiudo il dropdown immediatamente
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('active');

    try {
        const result = await authenticatedFetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'POST'
        });
        
        if (result && result.data.success) {
            fetchNotifications(); 
            if (link && link !== '#') {
                window.location.href = link;
            }
        }
    } catch (error) {
        console.error('Errore nel segnare la notifica come letta:', error);
    }
}

/**
 * Segna tutte le notifiche non lette come lette. (Funzione globale per il bottone HTML)
 */
async function markAllNotificationsAsRead() {
    try {
        const result = await authenticatedFetch(`${API_URL}/notifications/read-all`, {
            method: 'POST'
        });
        
        if (result && result.data.success) {
            showAlert('Tutte le notifiche sono state segnate come lette.', 'success');
            fetchNotifications(); 
        } else {
            showAlert('Errore nel segnare le notifiche come lette.', 'error');
        }
    } catch (error) {
        console.error('Errore di connessione read-all:', error);
        showAlert('Errore di connessione al server', 'error');
    }
}

/**
 * Funzione helper per ottenere l'icona in base al tipo di notifica.
 */
function getNotificationIcon(type) {
    switch (type) {
        case 'event_update': return 'calendar-alt';
        case 'event_cancellation': return 'ban';
        case 'rsvp': return 'user-check';
        case 'admin_message': return 'bullhorn';
        default: return 'bell';
    }
}