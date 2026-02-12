// DOM Elements
const emailListInput = document.getElementById('emailList');
const subjectInput = document.getElementById('subject');
const messageInput = document.getElementById('message');
const emailCountDisplay = document.getElementById('emailCount');
const emailForm = document.getElementById('emailForm');
const previewBtn = document.getElementById('previewBtn');
const sendBtn = document.getElementById('sendBtn');
const statusArea = document.getElementById('statusArea');
const previewModal = document.getElementById('previewModal');
const closeModal = document.getElementById('closeModal');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('attachments');
const fileList = document.getElementById('fileList');
const templateCheckbox = document.getElementById('templateCheckbox');
const saveStatus = document.getElementById('saveStatus');

// Template Handling
let previousSubject = '';
let previousMessage = '';
let autoSaveTimer = null;

// Auto-save function
function triggerAutoSave() {
    if (!templateCheckbox.checked) return;

    // Clear existing timer
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    // Show saving status immediately
    saveStatus.textContent = 'Saving...';
    saveStatus.className = 'save-status saving';

    // Set debounce timer (1 second)
    autoSaveTimer = setTimeout(async () => {
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();

        if (!subject || !message) return;

        try {
            const response = await fetch('/api/template/artemis-sponsorship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subject, message })
            });

            if (response.ok) {
                saveStatus.textContent = 'Changes saved';
                saveStatus.className = 'save-status saved';
                // Clear saved status after 3 seconds
                setTimeout(() => {
                    if (saveStatus.textContent === 'Changes saved') {
                        saveStatus.textContent = '';
                        saveStatus.className = 'save-status';
                    }
                }, 3000);
            } else {
                saveStatus.textContent = 'Error saving';
                saveStatus.className = 'save-status error';
            }
        } catch (error) {
            console.error('Auto-save error:', error);
            saveStatus.textContent = 'Error saving';
            saveStatus.className = 'save-status error';
        }
    }, 1000);
}

// Add listeners for auto-save
subjectInput.addEventListener('input', triggerAutoSave);
messageInput.addEventListener('input', triggerAutoSave);

templateCheckbox.addEventListener('change', async (e) => {
    if (e.target.checked) {
        // Save current values before overwriting
        previousSubject = subjectInput.value;
        previousMessage = messageInput.value;

        try {
            // Show loading state
            subjectInput.value = 'Loading template...';
            messageInput.value = 'Loading template...';
            subjectInput.disabled = true;
            messageInput.disabled = true;

            // Fetch template data
            const response = await fetch('/api/template/artemis-sponsorship');
            if (!response.ok) throw new Error('Failed to load template');

            const template = await response.json();

            // Apply template
            subjectInput.value = template.subject;
            messageInput.value = template.message;

            // Handle attachments
            if (template.attachments && template.attachments.length > 0) {
                // We need to fetch the file blob to create a File object
                const attachmentPath = template.attachments[0]; // Assuming first one for now
                const filename = attachmentPath.split('/').pop();

                try {
                    const fileResponse = await fetch(`/api/template-attachment/${filename}`);
                    if (fileResponse.ok) {
                        const blob = await fileResponse.blob();
                        const file = new File([blob], filename, { type: 'application/pdf' });

                        // Add to selected files
                        selectedFiles.push(file);
                        displayFiles();
                    }
                } catch (err) {
                    console.error('Error loading attachment:', err);
                }
            }
        } catch (error) {
            console.error('Template error:', error);
            showStatus('Failed to load template', 'error');
            // Revert on error
            subjectInput.value = previousSubject;
            messageInput.value = previousMessage;
            e.target.checked = false;
        } finally {
            subjectInput.disabled = false;
            messageInput.disabled = false;
        }
    } else {
        // Restore previous values or clear if empty
        subjectInput.value = previousSubject;
        messageInput.value = previousMessage;

        // Optionally remove the template attachment if it's the only one?
        // For simplicity, we'll keep the files or maybe we should remove specifically the template file
        // Let's filter out the specific template file
        selectedFiles = selectedFiles.filter(f => f.name !== 'artemis-sponsorship.pdf');
        displayFiles();
    }
});

// Selected files storage
let selectedFiles = [];

// Parse email list
function parseEmails(text) {
    if (!text.trim()) return [];

    // Split by newlines and commas, then filter valid emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = text
        .split(/[\n,]/)
        .map(email => email.trim())
        .filter(email => email && emailRegex.test(email));

    // Remove duplicates
    return [...new Set(emails)];
}

// Update email count on input
emailListInput.addEventListener('input', () => {
    const emails = parseEmails(emailListInput.value);
    const count = emails.length;
    emailCountDisplay.textContent = count === 1 ? '1 recipient' : `${count} recipients`;
});

// Show status message
function showStatus(message, type = 'info') {
    statusArea.textContent = message;
    statusArea.className = `status-area ${type}`;
    statusArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide status message
function hideStatus() {
    statusArea.classList.add('hidden');
}

// Preview button handler
previewBtn.addEventListener('click', () => {
    const emails = parseEmails(emailListInput.value);
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    if (emails.length === 0) {
        showStatus('Please enter at least one valid email address', 'error');
        return;
    }

    if (!subject) {
        showStatus('Please enter a subject', 'error');
        return;
    }

    if (!message) {
        showStatus('Please enter a message', 'error');
        return;
    }

    // Populate preview modal
    document.getElementById('previewSubject').textContent = subject;
    document.getElementById('previewMessage').textContent = message;
    document.getElementById('previewRecipients').textContent = emails.join(', ');

    // Show modal
    previewModal.classList.remove('hidden');
});

// Close modal handlers
closeModal.addEventListener('click', () => {
    previewModal.classList.add('hidden');
});

previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.classList.add('hidden');
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !previewModal.classList.contains('hidden')) {
        previewModal.classList.add('hidden');
    }
});

// File Upload Handlers
fileUploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop handlers
fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// Handle file selection
function handleFiles(files) {
    const fileArray = Array.from(files);

    // Check file sizes
    const oversizedFiles = fileArray.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        showStatus(`Some files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`, 'error');
        return;
    }

    selectedFiles = [...selectedFiles, ...fileArray];
    displayFiles();
}

// Display selected files
function displayFiles() {
    fileList.innerHTML = '';

    if (selectedFiles.length === 0) {
        return;
    }

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileIcon = getFileIcon(file.type);
        const fileSize = formatFileSize(file.size);

        fileItem.innerHTML = `
            <div class="file-info">
                <span class="file-icon">${fileIcon}</span>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
            </div>
            <button type="button" class="remove-file" data-index="${index}">×</button>
        `;

        fileList.appendChild(fileItem);
    });

    // Add remove file listeners
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            selectedFiles.splice(index, 1);
            displayFiles();
        });
    });
}

// Get file icon based on type
function getFileIcon(type) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    return '📎';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Form submission handler
emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emails = parseEmails(emailListInput.value);
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    // Validation
    if (emails.length === 0) {
        showStatus('Please enter at least one valid email address', 'error');
        return;
    }

    if (!subject || !message) {
        showStatus('Please fill in all required fields', 'error');
        return;
    }

    // Disable button during sending
    sendBtn.disabled = true;
    sendBtn.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" opacity="0.25"/>
            <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75"/>
        </svg>
        Sending...
    `;

    try {
        // Create FormData for file uploads
        const formData = new FormData();
        formData.append('recipients', JSON.stringify(emails));
        formData.append('subject', subject);
        formData.append('message', message);

        // Add files
        selectedFiles.forEach(file => {
            formData.append('attachments', file);
        });

        const response = await fetch('http://localhost:3000/send-emails', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showStatus(`✓ Successfully sent ${result.sent} email(s) to ${emails.length} recipient(s)`, 'success');

            // Clear form after successful send
            setTimeout(() => {
                emailListInput.value = '';
                subjectInput.value = '';
                messageInput.value = '';
                emailCountDisplay.textContent = '0 recipients';
                selectedFiles = [];
                displayFiles();
                fileInput.value = '';
            }, 2000);
        } else {
            showStatus(`✗ Error: ${result.error || 'Failed to send emails'}`, 'error');
        }
    } catch (error) {
        console.error('Error sending emails:', error);
        showStatus(`✗ Error: ${error.message}. Make sure the server is running on port 3000.`, 'error');
    } finally {
        // Re-enable button
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Send Emails
        `;
    }
});

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
    .spinner {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
