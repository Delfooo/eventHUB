// JavaScript per Dashboard Utente

const API_URL = 'http://localhost:3000/api';

// Variabili globali
let userData = null;
let myEvents = [];
let joinedEvents = [];

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadUserEvents();
    setupSidebarNavigation();
    setupCreateEventForm();
    
    // Gestisci hash nella URL per navigazione diretta
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
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
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userEmail').textContent = user.email;
    
    const roleText = user.role === 'admin' ? 'Amministratore' : 'Utente';
    document.getElementById('userRole').textContent = roleText;
    
    // Mostra link admin se è admin
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
            
            // Separa eventi creati da eventi a cui si è iscritti
            myEvents = events.filter(event => 
                event.owner && event.owner._id === (userData ? userData._id : getUser()._id)
            );
            
            joinedEvents = events.filter(event => 
                event.owner && event.owner._id !== (userData ? userData._id : getUser()._id)
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
    // Eventi creati
    document.getElementById('createdEventsCount').textContent = myEvents.length;
    
    // Eventi iscritti
    document.getElementById('joinedEventsCount').textContent = joinedEvents.length;
    
    // Totale partecipanti agli eventi creati
    const totalAttendees = myEvents.reduce((sum, event) => 
        sum + (event.attendees ? event.attendees.length : 0), 0
    );
    document.getElementById('totalAttendeesCount').textContent = totalAttendees;
    
    // Prossimi eventi
    const now = new Date();
    const upcomingCount = [...myEvents, ...joinedEvents].filter(event => 
        new Date(event.date) > now
    ).length;
    document.getElementById('upcomingEventsCount').textContent = upcomingCount;
}

// ===== VISUALIZZA EVENTI CREATI =====
function displayMyEvents() {
    const loadingEl = document.getElementById('myEventsLoading');
    const emptyEl = document.getElementById('myEventsEmpty');
    const listEl = document.getElementById('myEventsList');
    
    loadingEl.style.display = 'none';
    
    if (myEvents.length === 0) {
        emptyEl.style.display = 'block';
        listEl.innerHTML = '';
        return;
    }
    
    emptyEl.style.display = 'none';
    listEl.innerHTML = myEvents.map(event => createEventItemHTML(event, true)).join('');
}

// ===== VISUALIZZA EVENTI ISCRITTI =====
function displayJoinedEvents() {
    const loadingEl = document.getElementById('joinedEventsLoading');
    const emptyEl = document.getElementById('joinedEventsEmpty');
    const listEl = document.getElementById('joinedEventsList');
    
    loadingEl.style.display = 'none';
    
    if (joinedEvents.length === 0) {
        emptyEl.style.display = 'block';
        listEl.innerHTML = '';
        return;
    }
    
    emptyEl.style.display = 'none';
    listEl.innerHTML = joinedEvents.map(event => createEventItemHTML(event, false)).join('');
}

// ===== CREA HTML EVENTO =====
function createEventItemHTML(event, isOwner) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const formattedTime = eventDate.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    const categoryIcons = {
        'Musica': '🎵',
        'Sport': '⚽',
        'Arte': '🎨',
        'Tecnologia': '💻',
        'Cibo': '🍕',
        'Business': '💼',
        'Formazione': '📚',
        'Intrattenimento': '🎭',
        'Altro': '🎪'
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
    
    return `
        <div class="event-item">
            <img 
                src="${event.image || 'https://via.placeholder.com/400x200?text=EventHub'}" 
                alt="${escapeHtml(event.title)}"
                class="event-item-image"
                onerror="this.src='https://via.placeholder.com/400x200?text=EventHub'"
            >
            <div class="event-item-content">
                <span class="event-item-category">${categoryIcon} ${escapeHtml(event.category)}</span>
                <h3 class="event-item-title">${escapeHtml(event.title)}</h3>
                
                <div class="event-item-meta">
                    <div>
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate} alle ${formattedTime}</span>
                    </div>
                    <div>
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(event.location)}</span>
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
    // Nascondi tutte le sezioni
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra la sezione selezionata
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Aggiorna active nei link sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Aggiorna URL hash
    window.location.hash = sectionName;
}

function handleHashNavigation() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        switchSection(hash);
    }
}

// ===== FORM CREA EVENTO =====
function setupCreateEventForm() {
    const form = document.getElementById('createEventForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('createEventBtn');
        const originalText = btn.innerHTML;
        
        // Raccogli dati dal form
        const eventData = {
            title: document.getElementById('eventTitle').value.trim(),
            description: document.getElementById('eventDescription').value.trim(),
            date: document.getElementById('eventDate').value,
            location: document.getElementById('eventLocation').value.trim(),
            capacity: parseInt(document.getElementById('eventCapacity').value),
            category: document.getElementById('eventCategory').value,
            image: document.getElementById('eventImage').value.trim() || undefined
        };
        
        // Validazioni
        if (!eventData.title || !eventData.description || !eventData.date || 
            !eventData.location || !eventData.capacity || !eventData.category) {
            showAlert('Compila tutti i campi obbligatori', 'error');
            return;
        }
        
        // Disabilita bottone
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creazione in corso...';
        
        try {
            const result = await authenticatedFetch(`${API_URL}/user/events`, {
                method: 'POST',
                body: JSON.stringify(eventData)
            });
            
            if (result && result.data.success) {
                showAlert('Evento creato con successo!', 'success');
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
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

function resetEventForm() {
    document.getElementById('createEventForm').reset();
    switchSection('overview');
}

// ===== AZIONI EVENTI =====
function viewEvent(eventId) {
    window.location.href = `/event/${eventId}`;
}

async function editEvent(eventId) {
    showAlert('Funzionalità di modifica in arrivo', 'info');
    // TODO: Implementare modal di modifica
}

async function deleteEvent(eventId) {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;
    
    try {
        const result = await authenticatedFetch(`${API_URL}/user/events/${eventId}`, {
            method: 'DELETE'
        });
        
        if (result && result.data.success) {
            showAlert('Evento eliminato con successo', 'success');
            loadUserEvents();
        } else {
            showAlert(result.data.message || 'Errore nell\'eliminazione dell\'evento', 'error');
        }
    } catch (error) {
        console.error('Errore eliminazione evento:', error);
        showAlert('Errore di connessione al server', 'error');
    }
}

async function leaveEvent(eventId) {
    if (!confirm('Vuoi annullare la tua iscrizione a questo evento?')) return;
    
    try {
        const result = await authenticatedFetch(`${API_URL}/user/events/${eventId}/leave`, {
            method: 'POST'
        });
        
        if (result && result.data.success) {
            showAlert('Iscrizione annullata con successo', 'success');
            loadUserEvents();
        } else {
            showAlert(result.data.message || 'Errore nell\'annullamento dell\'iscrizione', 'error');
        }
    } catch (error) {
        console.error('Errore annullamento iscrizione:', error);
        showAlert('Errore di connessione al server', 'error');
    }
}

// ===== NOTIFICHE =====
function markAllAsRead() {
    showAlert('Tutte le notifiche sono state segnate come lette', 'success');
    document.getElementById('notificationBadge').textContent = '0';
}

// ===== ESCAPE HTML =====
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}