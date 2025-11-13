// JavaScript per la Homepage - Gestione Eventi e Filtri

const API_URL = 'http://localhost:3000/api';

// Variabili globali
let allEvents = [];
let filteredEvents = [];
let currentPage = 1;
const eventsPerPage = 9;

// ===== CARICAMENTO INIZIALE =====
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    
    // Event listeners per ricerca
    const heroSearchInput = document.getElementById('heroSearchInput');
    heroSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchEvents();
        }
    });
});

// ===== CARICA EVENTI =====
async function loadEvents() {
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/user/public-events`);
        const data = await response.json();
        
        if (data.success) {
            allEvents = data.events || [];
            filteredEvents = [...allEvents];
            sortEvents();
            displayEvents();
            updateEventCount();
        } else {
            showNoEvents();
            showAlert('Errore nel caricamento degli eventi', 'error');
        }
    } catch (error) {
        console.error('Errore caricamento eventi:', error);
        showNoEvents();
        showAlert('Errore di connessione al server', 'error');
    }
}

// ===== APPLICA FILTRI =====
function applyFilters() {
    const dateFilter = document.getElementById('filterDate').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    const locationFilter = document.getElementById('filterLocation').value.toLowerCase().trim();
    const searchTerm = document.getElementById('heroSearchInput').value.toLowerCase().trim();
    
    filteredEvents = allEvents.filter(event => {
        // Filtro data
        if (dateFilter) {
            const eventDate = new Date(event.date).toISOString().split('T')[0];
            if (eventDate !== dateFilter) return false;
        }
        
        // Filtro categoria
        if (categoryFilter && event.category !== categoryFilter) {
            return false;
        }
        
        // Filtro luogo
        if (locationFilter && !event.location.toLowerCase().includes(locationFilter)) {
            return false;
        }
        
        // Filtro ricerca
        if (searchTerm) {
            const titleMatch = event.title.toLowerCase().includes(searchTerm);
            const descMatch = event.description.toLowerCase().includes(searchTerm);
            if (!titleMatch && !descMatch) return false;
        }
        
        return true;
    });
    
    sortEvents();
    currentPage = 1;
    displayEvents();
    updateEventCount();
}

// ===== RESET FILTRI =====
function resetFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterLocation').value = '';
    document.getElementById('heroSearchInput').value = '';
    document.getElementById('sortBy').value = 'date-asc';
    
    filteredEvents = [...allEvents];
    sortEvents();
    currentPage = 1;
    displayEvents();
    updateEventCount();
}

// ===== RICERCA EVENTI =====
function searchEvents() {
    applyFilters();
}

// ===== ORDINAMENTO =====
function sortEvents() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredEvents.sort((a, b) => {
        switch(sortBy) {
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            default:
                return 0;
        }
    });
}

// ===== VISUALIZZA EVENTI =====
function displayEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noEventsMessage = document.getElementById('noEventsMessage');
    const pagination = document.getElementById('pagination');
    
    loadingSpinner.style.display = 'none';
    
    if (filteredEvents.length === 0) {
        eventsGrid.innerHTML = '';
        noEventsMessage.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }
    
    noEventsMessage.style.display = 'none';
    
    // Paginazione
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const eventsToShow = filteredEvents.slice(startIndex, endIndex);
    
    // Genera HTML delle card
    eventsGrid.innerHTML = eventsToShow.map(event => createEventCard(event)).join('');
    
    // Aggiorna paginazione
    updatePagination();
}

// ===== CREA CARD EVENTO =====
function createEventCard(event) {
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
    
    // Calcola percentuale capienza
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    const capacityPercentage = (attendeesCount / event.capacity) * 100;
    
    // Icona categoria
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
    
    return `
        <div class="event-card" onclick="viewEventDetail('${event._id}')">
            <img 
                src="${event.image || 'https://via.placeholder.com/400x200?text=EventHub'}" 
                alt="${escapeHtml(event.title)}"
                class="event-image"
                onerror="this.src='https://via.placeholder.com/400x200?text=EventHub'"
            >
            <div class="event-content">
                <span class="event-category">${categoryIcon} ${escapeHtml(event.category)}</span>
                <h3 class="event-title">${escapeHtml(event.title)}</h3>
                <p class="event-description">${escapeHtml(event.description)}</p>
                
                <div class="event-meta">
                    <div class="event-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(event.location)}</span>
                    </div>
                </div>
                
                <div class="event-footer">
                    <div class="event-capacity">
                        <i class="fas fa-users"></i>
                        <span>${attendeesCount}/${event.capacity}</span>
                        <div class="capacity-bar">
                            <div class="capacity-fill" style="width: ${capacityPercentage}%"></div>
                        </div>
                    </div>
                    <button class="event-action" onclick="event.stopPropagation(); handleEventAction('${event._id}')">
                        <i class="fas fa-info-circle"></i> Dettagli
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== VISUALIZZA DETTAGLIO EVENTO =====
function viewEventDetail(eventId) {
    window.location.href = `/event/${eventId}`;
}

// ===== GESTISCI AZIONE EVENTO =====
function handleEventAction(eventId) {
    // Controlla se l'utente è loggato
    if (!isAuthenticated()) {
        showAlert('Effettua il login per iscriverti agli eventi', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }
    
    // Altrimenti vai alla pagina di dettaglio
    viewEventDetail(eventId);
}

// ===== AGGIORNA CONTATORE EVENTI =====
function updateEventCount() {
    const eventsCount = document.getElementById('eventsCount');
    eventsCount.textContent = `(${filteredEvents.length})`;
}

// ===== PAGINAZIONE =====
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pageInfo.textContent = `Pagina ${currentPage} di ${totalPages}`;
    
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayEvents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===== MOSTRA LOADING =====
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('eventsGrid').innerHTML = '';
    document.getElementById('noEventsMessage').style.display = 'none';
}

// ===== MOSTRA NO EVENTI =====
function showNoEvents() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('eventsGrid').innerHTML = '';
    document.getElementById('noEventsMessage').style.display = 'block';
}

// ===== ESCAPE HTML (per sicurezza) =====
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

// ===== HAMBURGER MENU (Mobile) =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}