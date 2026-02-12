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
        const response = await fetch('http://localhost:3000/send-emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipients: emails,
                subject: subject,
                message: message
            })
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
