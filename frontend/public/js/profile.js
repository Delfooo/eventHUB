// JavaScript per Pagina Profilo

const API_URL = 'http://localhost:3000/api';
let originalUserData = null;

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    setupNavigation();
    setupProfileForm();
    setupPasswordForm();
    setupPasswordStrength();
    
    // Handle hash navigation
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
});

// ===== CARICA PROFILO UTENTE =====
async function loadUserProfile() {
    try {
        const result = await authenticatedFetch(`${API_URL}/user/profile`);
        
        if (result && result.data.success) {
            const user = result.data.user;
            originalUserData = { ...user };
            displayUserProfile(user);
        }
    } catch (error) {
        console.error('Errore caricamento profilo:', error);
        showAlert('Errore nel caricamento del profilo', 'error');
    }
}

// ===== VISUALIZZA PROFILO =====
function displayUserProfile(user) {
    // Header
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    
    const roleText = user.role === 'admin' ? 'Amministratore' : 'Utente';
    document.getElementById('profileRole').textContent = roleText;
    
    // Member since
    const memberSince = new Date(user.createdAt).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('memberSince').textContent = memberSince;
    
    // Form fields
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    
    // Last login
    const lastLogin = user.lastLogin 
        ? new Date(user.lastLogin).toLocaleString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Mai';
    document.getElementById('lastLoginInfo').textContent = `Ultimo accesso: ${lastLogin}`;
}

// ===== NAVIGAZIONE SEZIONI =====
function setupNavigation() {
    const navLinks = document.querySelectorAll('.profile-nav-link[data-section]');
    
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
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra la sezione selezionata
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Aggiorna active nei link
    document.querySelectorAll('.profile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.profile-nav-link[data-section="${sectionName}"]`);
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

// ===== FORM PROFILO =====
function setupProfileForm() {
    const form = document.getElementById('profileForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('saveProfileBtn');
        const originalText = btn.innerHTML;
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        
        // Validazioni
        if (!username || !email) {
            showAlert('Compila tutti i campi', 'error');
            return;
        }
        
        if (username.length < 3) {
            showAlert('L\'username deve essere di almeno 3 caratteri', 'error');
            return;
        }
        
        // Controlla se ci sono modifiche
        if (username === originalUserData.username && email === originalUserData.email) {
            showAlert('Nessuna modifica da salvare', 'info');
            return;
        }
        
        // Disabilita bottone
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';
        
        try {
            const result = await authenticatedFetch(`${API_URL}/user/profile`, {
                method: 'PUT',
                body: JSON.stringify({ username, email })
            });
            
            if (result && result.data.success) {
                showAlert('Profilo aggiornato con successo!', 'success');
                
                // Aggiorna dati locali
                originalUserData.username = username;
                originalUserData.email = email;
                
                // Aggiorna localStorage
                const user = getUser();
                user.username = username;
                user.email = email;
                localStorage.setItem('user', JSON.stringify(user));
                
                // Aggiorna header
                document.getElementById('profileUsername').textContent = username;
                document.getElementById('profileEmail').textContent = email;
            } else {
                showAlert(result.data.message || 'Errore nell\'aggiornamento', 'error');
            }
        } catch (error) {
            console.error('Errore aggiornamento profilo:', error);
            showAlert('Errore di connessione al server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

function resetProfileForm() {
    if (originalUserData) {
        document.getElementById('username').value = originalUserData.username;
        document.getElementById('email').value = originalUserData.email;
        showAlert('Modifiche annullate', 'info');
    }
}

// ===== FORM PASSWORD =====
function setupPasswordForm() {
    const form = document.getElementById('passwordForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('changePasswordBtn');
        const originalText = btn.innerHTML;
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validazioni
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Compila tutti i campi', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showAlert('La nuova password deve essere di almeno 6 caratteri', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showAlert('Le password non coincidono', 'error');
            return;
        }
        
        if (currentPassword === newPassword) {
            showAlert('La nuova password deve essere diversa da quella attuale', 'error');
            return;
        }
        
        // Disabilita bottone
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Modifica in corso...';
        
        try {
            const result = await authenticatedFetch(`${API_URL}/user/change-password`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            if (result && result.data.success) {
                showAlert('Password modificata con successo!', 'success');
                form.reset();
                
                // Reset password strength
                const strengthBar = document.querySelector('.strength-bar');
                const strengthContainer = document.getElementById('passwordStrength');
                strengthBar.style.width = '0%';
                strengthContainer.setAttribute('data-label', '');
            } else {
                showAlert(result.data.message || 'Errore nella modifica della password', 'error');
            }
        } catch (error) {
            console.error('Errore modifica password:', error);
            showAlert('Errore di connessione al server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// ===== PASSWORD STRENGTH =====
function setupPasswordStrength() {
    const newPasswordInput = document.getElementById('newPassword');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strengthBar = document.querySelector('.strength-bar');
            const strengthContainer = document.getElementById('passwordStrength');
            
            let strength = 0;
            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;
            
            const colors = ['#e74c3c', '#e67e22', '#f39c12', '#2ecc71', '#27ae60'];
            const labels = ['Molto debole', 'Debole', 'Media', 'Forte', 'Molto forte'];
            
            strengthBar.style.width = (strength * 20) + '%';
            strengthBar.style.backgroundColor = colors[strength - 1] || '#e74c3c';
            strengthContainer.setAttribute('data-label', labels[strength - 1] || '');
        });
    }
}

// ===== TOGGLE PASSWORD VISIBILITY =====
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ===== DELETE ACCOUNT =====
function deleteAccount() {
    const confirmation = prompt('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.\n\nScrivi "ELIMINA" per confermare:');
    
    if (confirmation === 'ELIMINA') {
        showAlert('Funzionalità di eliminazione account in sviluppo', 'warning');
        // TODO: Implementare endpoint DELETE /api/user/account
    } else if (confirmation !== null) {
        showAlert('Testo di conferma errato', 'error');
    }
}