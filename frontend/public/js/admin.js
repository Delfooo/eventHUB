// JavaScript per Dashboard Admin

const API_URL = 'http://localhost:3000/api';

// Variabili globali
let allUsers = [];
let currentAction = null;
let currentTargetId = null;

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
    loadStats();
    loadUsers();
    setupNavigation();
    
    // Gestisci hash nella URL
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
});

// ===== CARICA DATI ADMIN =====
async function loadAdminData() {
    try {
        const result = await authenticatedFetch(`${API_URL}/user/profile`);
        
        if (result && result.data.success) {
            const user = result.data.user;
            document.getElementById('adminName').textContent = user.username;
        }
    } catch (error) {
        console.error('Errore caricamento dati admin:', error);
    }
}

// ===== CARICA STATISTICHE =====
async function loadStats() {
    try {
        const result = await authenticatedFetch(`${API_URL}/admin/stats`);
        
        if (result && result.data.success) {
            const stats = result.data.stats;
            
            // Aggiorna contatori
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
            document.getElementById('blockedUsers').textContent = stats.blockedUsers || 0;
            document.getElementById('adminUsers').textContent = stats.adminUsers || 0;
            document.getElementById('recentUsers').textContent = stats.recentUsers || 0;
            document.getElementById('activityRate').textContent = (stats.activityRate || 0) + '%';
            document.getElementById('regularUsers').textContent = stats.regularUsers || 0;
            
            // Placeholder per eventi totali
            document.getElementById('totalEvents').textContent = '0';
        }
    } catch (error) {
        console.error('Errore caricamento statistiche:', error);
        showAlert('Errore nel caricamento delle statistiche', 'error');
    }
}

async function refreshStats() {
    showAlert('Aggiornamento statistiche...', 'info', 1000);
    await loadStats();
    showAlert('Statistiche aggiornate!', 'success');
}

// ===== CARICA UTENTI =====
async function loadUsers() {
    const loadingEl = document.getElementById('usersLoading');
    const tableEl = document.getElementById('usersTable');
    const tbody = document.getElementById('usersTableBody');
    
    loadingEl.style.display = 'block';
    tableEl.style.display = 'none';
    
    try {
        const result = await authenticatedFetch(`${API_URL}/admin/users`);
        
        if (result && result.data.success) {
            allUsers = result.data.users || [];
            displayUsers(allUsers);
            
            loadingEl.style.display = 'none';
            tableEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Errore caricamento utenti:', error);
        loadingEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Errore nel caricamento</h3>
                <p>Impossibile caricare la lista utenti</p>
                <button class="btn btn-primary" onclick="loadUsers()">
                    <i class="fas fa-sync-alt"></i> Riprova
                </button>
            </div>
        `;
    }
}

// ===== VISUALIZZA UTENTI =====
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 48px; color: #cbd5e0; margin-bottom: 15px;"></i>
                    <p style="color: #718096;">Nessun utente trovato</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => createUserRow(user)).join('');
}

// ===== CREA RIGA UTENTE =====
function createUserRow(user) {
    const currentUserId = getUser()._id;
    const isCurrentUser = user._id === currentUserId;
    
    const createdDate = new Date(user.createdAt).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    const lastLogin = user.lastLogin 
        ? new Date(user.lastLogin).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
        : 'Mai';
    
    const roleClass = user.role === 'admin' ? 'admin' : 'user';
    const roleText = user.role === 'admin' ? 'Admin' : 'Utente';
    
    const statusClass = user.isActive ? 'active' : 'inactive';
    const statusText = user.isActive ? 'Attivo' : 'Bloccato';
    
    // Azioni disponibili
    let actions = '';
    
    if (isCurrentUser) {
        actions = '<span style="color: #718096; font-size: 12px;">Tu</span>';
    } else {
        const blockText = user.isActive ? 'Blocca' : 'Sblocca';
        const blockIcon = user.isActive ? 'ban' : 'check';
        const blockClass = user.isActive ? 'btn-danger' : 'btn-success';
        
        actions = `
            <div class="table-actions">
                <button class="btn ${blockClass} btn-sm" onclick="toggleBlock('${user._id}', ${user.isActive})">
                    <i class="fas fa-${blockIcon}"></i> ${blockText}
                </button>
        `;
        
        if (user.role === 'user') {
            actions += `
                <button class="btn btn-primary btn-sm" onclick="promoteUser('${user._id}')">
                    <i class="fas fa-arrow-up"></i> Promuovi
                </button>
            `;
        } else if (user.role === 'admin') {
            actions += `
                <button class="btn btn-warning btn-sm" onclick="demoteUser('${user._id}')">
                    <i class="fas fa-arrow-down"></i> Degrada
                </button>
            `;
        }
        
        actions += '</div>';
    }
    
    return `
        <tr>
            <td><strong>${escapeHtml(user.username)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="user-role-badge ${roleClass}">${roleText}</span></td>
            <td><span class="user-status-badge ${statusClass}">${statusText}</span></td>
            <td>${createdDate}</td>
            <td>${lastLogin}</td>
            <td>${actions}</td>
        </tr>
    `;
}

// ===== FILTRA UTENTI =====
function filterUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayUsers(allUsers);
        return;
    }
    
    const filtered = allUsers.filter(user => {
        return user.username.toLowerCase().includes(searchTerm) ||
               user.email.toLowerCase().includes(searchTerm);
    });
    
    displayUsers(filtered);
}

// ===== AZIONI UTENTE =====
async function toggleBlock(userId, isActive) {
    const action = isActive ? 'bloccare' : 'sbloccare';
    const actionText = isActive ? 'bloccato' : 'sbloccato';
    
    openModal(
        `Conferma ${action} utente`,
        `Sei sicuro di voler ${action} questo utente?`,
        async () => {
            try {
                const result = await authenticatedFetch(`${API_URL}/admin/users/${userId}/block`, {
                    method: 'PATCH'
                });
                
                if (result && result.data.success) {
                    showAlert(`Utente ${actionText} con successo`, 'success');
                    await loadUsers();
                    await loadStats();
                } else {
                    showAlert(result.data.message || 'Errore nell\'operazione', 'error');
                }
            } catch (error) {
                console.error('Errore blocco/sblocco utente:', error);
                showAlert('Errore di connessione al server', 'error');
            }
            closeModal();
        }
    );
}

async function promoteUser(userId) {
    openModal(
        'Promuovi a Amministratore',
        'Sei sicuro di voler promuovere questo utente ad amministratore? Avrà accesso completo al pannello admin.',
        async () => {
            try {
                const result = await authenticatedFetch(`${API_URL}/admin/users/${userId}/promote`, {
                    method: 'PATCH'
                });
                
                if (result && result.data.success) {
                    showAlert('Utente promosso ad amministratore', 'success');
                    await loadUsers();
                    await loadStats();
                } else {
                    showAlert(result.data.message || 'Errore nella promozione', 'error');
                }
            } catch (error) {
                console.error('Errore promozione utente:', error);
                showAlert('Errore di connessione al server', 'error');
            }
            closeModal();
        }
    );
}

async function demoteUser(userId) {
    openModal(
        'Degrada a Utente',
        'Sei sicuro di voler degradare questo amministratore a utente normale? Perderà tutti i privilegi admin.',
        async () => {
            try {
                const result = await authenticatedFetch(`${API_URL}/admin/users/${userId}/demote`, {
                    method: 'PATCH'
                });
                
                if (result && result.data.success) {
                    showAlert('Amministratore degradato a utente', 'success');
                    await loadUsers();
                    await loadStats();
                } else {
                    showAlert(result.data.message || 'Errore nella degradazione', 'error');
                }
            } catch (error) {
                console.error('Errore degradazione utente:', error);
                showAlert('Errore di connessione al server', 'error');
            }
            closeModal();
        }
    );
}

// ===== CARICA TUTTI GLI EVENTI =====
async function loadAllEvents() {
    const loadingEl = document.getElementById('eventsLoading');
    const listEl = document.getElementById('eventsList');
    
    loadingEl.style.display = 'block';
    listEl.innerHTML = '';
    
    try {
        const result = await authenticatedFetch(`${API_URL}/user/public-events`);
        
        if (result && result.data.success) {
            const events = result.data.events || [];
            
            loadingEl.style.display = 'none';
            
            if (events.length === 0) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h3>Nessun evento</h3>
                        <p>Non ci sono eventi da moderare</p>
                    </div>
                `;
                return;
            }
            
            listEl.innerHTML = events.map(event => createEventAdminCard(event)).join('');
        }
    } catch (error) {
        console.error('Errore caricamento eventi:', error);
        loadingEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Errore nel caricamento</h3>
                <p>Impossibile caricare gli eventi</p>
            </div>
        `;
    }
}

function createEventAdminCard(event) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    
    return `
        <div class="event-item">
            <img 
                src="${event.image || 'https://via.placeholder.com/400x200?text=EventHub'}" 
                alt="${escapeHtml(event.title)}"
                class="event-item-image"
                onerror="this.src='https://via.placeholder.com/400x200?text=EventHub'"
            >
            <div class="event-item-content">
                <span class="event-item-category">${escapeHtml(event.category)}</span>
                <h3 class="event-item-title">${escapeHtml(event.title)}</h3>
                
                <div class="event-item-meta">
                    <div>
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div>
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(event.location)}</span>
                    </div>
                    <div>
                        <i class="fas fa-users"></i>
                        <span>${attendeesCount} / ${event.capacity}</span>
                    </div>
                    <div>
                        <i class="fas fa-user"></i>
                        <span>Organizzatore: ${event.owner ? escapeHtml(event.owner.username) : 'N/D'}</span>
                    </div>
                </div>
                
                <div class="event-item-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewEvent('${event._id}')">
                        <i class="fas fa-eye"></i> Visualizza
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEventAdmin('${event._id}')">
                        <i class="fas fa-trash"></i> Elimina
                    </button>
                </div>
            </div>
        </div>
    `;
}

function viewEvent(eventId) {
    window.location.href = `/event/${eventId}`;
}

async function deleteEventAdmin(eventId) {
    openModal(
        'Elimina Evento',
        'Sei sicuro di voler eliminare questo evento? Questa azione è irreversibile.',
        async () => {
            try {
                const result = await authenticatedFetch(`${API_URL}/user/events/${eventId}`, {
                    method: 'DELETE'
                });
                
                if (result && result.data.success) {
                    showAlert('Evento eliminato con successo', 'success');
                    await loadAllEvents();
                } else {
                    showAlert(result.data.message || 'Errore nell\'eliminazione', 'error');
                }
            } catch (error) {
                console.error('Errore eliminazione evento:', error);
                showAlert('Errore di connessione al server', 'error');
            }
            closeModal();
        }
    );
}

// ===== EXPORT DATA =====
function exportData() {
    showAlert('Funzionalità di export in sviluppo', 'info');
}

// ===== NAVIGAZIONE =====
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    // Nascondi tutte le sezioni
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra la sezione selezionata
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Aggiorna active nei link
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.admin-nav-link[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Carica dati se necessario
    if (sectionName === 'users') {
        loadUsers();
    } else if (sectionName === 'events') {
        loadAllEvents();
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

// ===== MODAL =====
let modalCallback = null;

function openModal(title, message, callback) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    modalCallback = callback;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('active');
    modalCallback = null;
}

function confirmAction() {
    if (modalCallback) {
        modalCallback();
    }
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