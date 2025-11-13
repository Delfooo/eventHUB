// JavaScript per Pagina Dettaglio Evento con Socket.io Real-Time

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

let currentEvent = null;
let currentUser = null;
let socket = null;

// ===== CARICA DETTAGLIO EVENTO =====
async function loadEventDetail(eventId) {
    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('eventDetailMain');
    
    try {
        // Carica evento pubblico
        const response = await fetch(`${API_URL}/user/public-events`);
        const data = await response.json();
        
        if (data.success) {
            const events = data.events || [];
            currentEvent = events.find(e => e._id === eventId);
            
            if (!currentEvent) {
                showAlert('Evento non trovato', 'error');
                setTimeout(() => window.location.href = '/', 2000);
                return;
            }
            
            // Controlla se l'utente è loggato
            currentUser = getUser();
            
            // Mostra contenuto
            loadingState.style.display = 'none';
            mainContent.style.display = 'block';
            
            // Popola dettagli
            displayEventDetails(currentEvent);
            displayActionButtons(currentEvent);
            displayAttendees(currentEvent);
            
            // Mostra chat solo se partecipante o organizzatore
            if (currentUser && isParticipant(currentEvent)) {
                await loadChatMessages(eventId);
                document.getElementById('chatSection').style.display = 'block';
                setupChatForm(eventId);
                initializeSocketIO(eventId);
            }
            
            // Mostra card segnalazione se loggato
            if (currentUser) {
                document.getElementById('reportCard').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Errore caricamento evento:', error);
        showAlert('Errore nel caricamento dell\'evento', 'error');
        setTimeout(() => window.location.href = '/', 2000);
    }
}

// ===== VISUALIZZA DETTAGLI =====
function displayEventDetails(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const formattedTime = eventDate.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Header
    document.getElementById('eventCategory').textContent = event.category;
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventDate').textContent = formattedDate;
    document.getElementById('eventTime').textContent = formattedTime;
    document.getElementById('eventLocation').textContent = event.location;
    
    // Main content
    document.getElementById('eventImage').src = event.image || 'https://via.placeholder.com/800x400?text=EventHub';
    document.getElementById('eventImage').alt = event.title;
    document.getElementById('eventDescription').textContent = event.description;
    
    // Organizer
    if (event.owner) {
        document.getElementById('organizerName').textContent = event.owner.username;
        document.getElementById('organizerEmail').textContent = event.owner.email;
    }
    
    // Capacity
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    const capacityPercentage = (attendeesCount / event.capacity) * 100;
    
    document.getElementById('attendeesCount').textContent = attendeesCount;
    document.getElementById('eventCapacity').textContent = event.capacity;
    document.getElementById('attendeesCountText').textContent = `(${attendeesCount}/${event.capacity})`;
    document.getElementById('capacityFill').style.width = capacityPercentage + '%';
    
    // Sidebar details
    document.getElementById('sidebarDate').textContent = formattedDate;
    document.getElementById('sidebarTime').textContent = formattedTime;
    document.getElementById('sidebarLocation').textContent = event.location;
    document.getElementById('sidebarCapacity').textContent = `${attendeesCount} / ${event.capacity}`;
    document.getElementById('sidebarCategory').textContent = event.category;
    
    // Update page title
    document.title = `${event.title} - EventHub`;
}

// ===== VISUALIZZA BOTTONI AZIONE =====
function displayActionButtons(event) {
    const actionButtons = document.getElementById('actionButtons');
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    const isFull = attendeesCount >= event.capacity;
    
    if (!currentUser) {
        // Non loggato
        actionButtons.innerHTML = `
            <button class="btn btn-primary btn-block" onclick="window.location.href='/login'">
                <i class="fas fa-sign-in-alt"></i> Accedi per Partecipare
            </button>
        `;
        return;
    }
    
    const isOwner = event.owner && event.owner._id === currentUser._id;
    const isAttendee = event.attendees && event.attendees.some(a => a._id === currentUser._id);
    
    if (isOwner) {
        // Proprietario
        actionButtons.innerHTML = `
            <div class="alert" style="background: rgba(102, 126, 234, 0.1); color: #667eea; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                <i class="fas fa-star"></i> Sei l'organizzatore
            </div>
            <button class="btn btn-secondary btn-block" onclick="editEvent()">
                <i class="fas fa-edit"></i> Modifica Evento
            </button>
        `;
    } else if (isAttendee) {
        // Già iscritto
        actionButtons.innerHTML = `
            <div class="alert" style="background: rgba(72, 187, 120, 0.1); color: #38a169; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                <i class="fas fa-check-circle"></i> Sei iscritto
            </div>
            <button class="btn btn-danger btn-block" onclick="leaveEventAction()">
                <i class="fas fa-sign-out-alt"></i> Annulla Iscrizione
            </button>
        `;
    } else if (isFull) {
        // Evento pieno
        actionButtons.innerHTML = `
            <div class="alert" style="background: rgba(245, 101, 101, 0.1); color: #e53e3e; padding: 12px; border-radius: 8px;">
                <i class="fas fa-exclamation-circle"></i> Evento al completo
            </div>
        `;
    } else {
        // Può iscriversi
        actionButtons.innerHTML = `
            <button class="btn btn-primary btn-block" onclick="joinEventAction()">
                <i class="fas fa-ticket-alt"></i> Partecipa all'Evento
            </button>
        `;
    }
}

// ===== VISUALIZZA PARTECIPANTI =====
function displayAttendees(event) {
    const attendeesList = document.getElementById('attendeesList');
    
    if (!event.attendees || event.attendees.length === 0) {
        attendeesList.innerHTML = `
            <p style="color: #718096; text-align: center; padding: 20px;">
                Nessun partecipante ancora. Sii il primo!
            </p>
        `;
        return;
    }
    
    attendeesList.innerHTML = event.attendees.map(attendee => `
        <div class="attendee-item">
            <div class="attendee-avatar">
                <i class="fas fa-user"></i>
            </div>
            <span class="attendee-name">${escapeHtml(attendee.username || 'Utente')}</span>
        </div>
    `).join('');
}

// ===== AZIONI EVENTO =====
async function joinEventAction() {
    if (!currentUser) {
        showAlert('Devi effettuare il login', 'warning');
        window.location.href = '/login';
        return;
    }
    
    try {
        const result = await authenticatedFetch(`${API_URL}/user/events/${currentEvent._id}/join`, {
            method: 'POST'
        });
        
        if (result && result.data.success) {
            showAlert('Iscrizione avvenuta con successo!', 'success');
            // Ricarica evento
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(result.data.message || 'Errore nell\'iscrizione', 'error');
        }
    } catch (error) {
        console.error('Errore iscrizione:', error);
        showAlert('Errore di connessione al server', 'error');
    }
}

async function leaveEventAction() {
    if (!confirm('Sei sicuro di voler annullare l\'iscrizione?')) return;
    
    try {
        const result = await authenticatedFetch(`${API_URL}/user/events/${currentEvent._id}/leave`, {
            method: 'POST'
        });
        
        if (result && result.data.success) {
            showAlert('Iscrizione annullata con successo', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showAlert(result.data.message || 'Errore nell\'annullamento', 'error');
        }
    } catch (error) {
        console.error('Errore annullamento:', error);
        showAlert('Errore di connessione al server', 'error');
    }
}

function editEvent() {
    showAlert('Funzionalità di modifica in arrivo', 'info');
}

// ===== CHAT =====
async function loadChatMessages(eventId) {
    // Placeholder - Da implementare con Socket.io per real-time
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '<p class="chat-empty">Nessun messaggio. Sii il primo a scrivere!</p>';
}

function setupChatForm(eventId) {
    const chatForm = document.getElementById('chatForm');
    
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        try {
            const result = await authenticatedFetch(`${API_URL}/user/events/${eventId}/chat`, {
                method: 'POST',
                body: JSON.stringify({ message })
            });
            
            if (result && result.data.success) {
                chatInput.value = '';
                addMessageToChat(currentUser.username, message, new Date());
            } else {
                showAlert(result.data.message || 'Errore nell\'invio del messaggio', 'error');
            }
        } catch (error) {
            console.error('Errore invio messaggio:', error);
            showAlert('Errore di connessione al server', 'error');
        }
    });
}

function addMessageToChat(sender, message, timestamp) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Rimuovi messaggio vuoto se presente
    const emptyMsg = chatMessages.querySelector('.chat-empty');
    if (emptyMsg) emptyMsg.remove();
    
    const timeStr = new Date(timestamp).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const messageHTML = `
        <div class="chat-message">
            <div class="chat-message-header">
                <span class="chat-sender">${escapeHtml(sender)}</span>
                <span class="chat-time">${timeStr}</span>
            </div>
            <p class="chat-text">${escapeHtml(message)}</p>
        </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== UTILITY =====
function isParticipant(event) {
    if (!currentUser || !event) return false;
    
    const isOwner = event.owner && event.owner._id === currentUser._id;
    const isAttendee = event.attendees && event.attendees.some(a => a._id === currentUser._id);
    
    return isOwner || isAttendee;
}

function shareEvent() {
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: currentEvent.title,
            text: currentEvent.description,
            url: url
        }).then(() => {
            showAlert('Evento condiviso!', 'success');
        }).catch(() => {
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Link copiato negli appunti!', 'success');
    }).catch(() => {
        showAlert('Impossibile copiare il link', 'error');
    });
}

async function reportEvent() {
    if (!currentUser) {
        showAlert('Devi effettuare il login', 'warning');
        return;
    }
    
    if (!confirm('Vuoi segnalare questo evento?')) return;
    
    try {
        const result = await authenticatedFetch(`${API_URL}/user/events/${currentEvent._id}/report`, {
            method: 'POST'
        });
        
        if (result && result.data.success) {
            showAlert('Evento segnalato con successo', 'success');
        } else {
            showAlert(result.data.message || 'Errore nella segnalazione', 'error');
        }
    } catch (error) {
        console.error('Errore segnalazione:', error);
        showAlert('Errore di connessione al server', 'error');
    }
}

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