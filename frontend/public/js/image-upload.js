// JavaScript Upload Immagini

const API_URL = 'http://localhost:3000/api';

// ===== SETUP FILE INPUT CON PREVIEW =====
function setupImageUpload(inputId, previewId, uploadBtnId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const uploadBtn = document.getElementById(uploadBtnId);
    
    if (!input) return;
    
    let selectedFile = null;
    let uploadedImageUrl = null;
    
    // File input change
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Validazione
        if (!file.type.startsWith('image/')) {
            showAlert('Seleziona un file immagine valido', 'error');
            input.value = '';
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showAlert('L\'immagine deve essere massimo 5MB', 'error');
            input.value = '';
            return;
        }
        
        selectedFile = file;
        
        // Mostra preview
        if (preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
        
        // Abilita bottone upload
        if (uploadBtn) {
            uploadBtn.disabled = false;
        }
    });
    
    // Upload button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            if (!selectedFile) {
                showAlert('Seleziona prima un\'immagine', 'warning');
                return;
            }
            
            uploadedImageUrl = await uploadImage(selectedFile, uploadBtn);
            
            if (uploadedImageUrl) {
                // Callback per usare l'URL
                if (window.onImageUploaded) {
                    window.onImageUploaded(uploadedImageUrl);
                }
            }
        });
    }
    
    return {
        getUploadedUrl: () => uploadedImageUrl,
        reset: () => {
            input.value = '';
            if (preview) {
                preview.src = '';
                preview.style.display = 'none';
            }
            selectedFile = null;
            uploadedImageUrl = null;
            if (uploadBtn) uploadBtn.disabled = true;
        }
    };
}

// ===== UPLOAD IMMAGINE =====
async function uploadImage(file, button = null) {
    const formData = new FormData();
    formData.append('image', file);
    
    const originalText = button ? button.innerHTML : '';
    
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload...';
    }
    
    try {
        const token = getToken();
        
        const response = await fetch(`${API_URL}/upload/event-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Immagine caricata con successo!', 'success');
            
            // Ritorna URL completo
            const imageUrl = `${API_URL.replace('/api', '')}${data.imageUrl}`;
            
            if (button) {
                button.innerHTML = '<i class="fas fa-check"></i> Caricata!';
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 2000);
            }
            
            return imageUrl;
        } else {
            showAlert(data.message || 'Errore nel caricamento', 'error');
            return null;
        }
    } catch (error) {
        console.error('Errore upload:', error);
        showAlert('Errore di connessione', 'error');
        return null;
    } finally {
        if (button && !button.innerHTML.includes('Caricata')) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// ===== DRAG & DROP =====
function setupDragAndDrop(dropZoneId, inputId, previewId) {
    const dropZone = document.getElementById(dropZoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!dropZone || !input) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop zone
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    }, false);
    
    // Click to select file
    dropZone.addEventListener('click', () => {
        input.click();
    });
}

// ===== COMPRIMI IMMAGINE (opzionale) =====
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Ridimensiona se necessario
                if (width > maxWidth) {
                    height = (height / width) * maxWidth;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', quality);
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}