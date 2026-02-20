/* ============================================================
   ARTEMIS OUTREACH — FRONTEND SCRIPT
   ============================================================ */

'use strict';

// ── API Base URL detection ───────────────────────────────────
let API_BASE = '';
const host = window.location.hostname;
const portNum = window.location.port;
if (window.location.protocol === 'file:' ||
    ((host === 'localhost' || host === '127.0.0.1') && portNum !== '3000')) {
    API_BASE = 'http://localhost:3000';
}

// ── DOM references ───────────────────────────────────────────
const emailListInput = document.getElementById('emailList');
const subjectInput = document.getElementById('subject');
const messageInput = document.getElementById('message');
const emailCountBadge = document.getElementById('emailCount');
const emailForm = document.getElementById('emailForm');
const previewBtn = document.getElementById('previewBtn');
const sendBtn = document.getElementById('sendBtn');
const previewModal = document.getElementById('previewModal');
const closeModal = document.getElementById('closeModal');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('attachments');
const fileList = document.getElementById('fileList');
const templateCheckbox = document.getElementById('templateCheckbox');
const saveStatus = document.getElementById('saveStatus');
const trickleMode = document.getElementById('trickleMode');
const unsubscribeFooter = document.getElementById('unsubscribeFooter');
const cancelBtn = document.getElementById('cancelBtn');
const progressCard = document.getElementById('progressCard');
const progressFill = document.getElementById('progressFill');
const progressSent = document.getElementById('progressSent');
const progressTotal = document.getElementById('progressTotal');
const progressNote = document.getElementById('progressNote');
const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const toast = document.getElementById('statusToast');

// Stats panel
const statRecipients = document.getElementById('statRecipients');
const statAttachments = document.getElementById('statAttachments');
const statTime = document.getElementById('statTime');

// Checklist items
const checkSubject = document.getElementById('checkSubject');
const checkMessage = document.getElementById('checkMessage');
const checkTrickle = document.getElementById('checkTrickle');
const checkCaps = document.getElementById('checkCaps');
const checkSpamWords = document.getElementById('checkSpamWords');

// ── State ────────────────────────────────────────────────────
let selectedFiles = [];
let previousSubject = '';
let previousMessage = '';
let autoSaveTimer = null;
let cancelRequested = false;

// Spam trigger words (basic list)
const SPAM_WORDS = ['free money', 'click here', 'act now', 'limited time', 'urgent', 'winner', 'congratulations', 'guaranteed', 'no cost', 'risk-free', 'cash bonus', 'make money fast', '100% free', 'click below', 'you have been selected'];

// ── Toast helper ─────────────────────────────────────────────
let toastTimer;

function showToast(msg, type = 'info', duration = 5000) {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toastTimer = setTimeout(() => { toast.className = 'toast hidden'; }, duration);
}

// ── Sidebar status ───────────────────────────────────────────
function setStatus(state, label) {
    statusDot.className = `status-dot ${state}`;
    statusLabel.textContent = label;
}

// ── Email parsing ─────────────────────────────────────────────
function parseEmails(text) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return [...new Set(
        text.split(/[\n,]/)
            .map(e => e.trim())
            .filter(e => e && emailRegex.test(e))
    )];
}

// ── Live stats & checklist update ───────────────────────────
function updateStats() {
    const emails = parseEmails(emailListInput.value);
    const count = emails.length;
    const delay = trickleMode.checked ? 5 : 0; // minutes
    const minutes = count > 1 ? (count - 1) * delay : 0;
    const timeStr = minutes === 0 ? '< 1 min' :
        minutes < 60 ? `~${minutes} min` :
            `~${(minutes / 60).toFixed(1)} hr`;

    emailCountBadge.textContent = count;
    statRecipients.textContent = count;
    statAttachments.textContent = selectedFiles.length;
    statTime.textContent = count > 0 ? timeStr : '—';
}

function updateChecklist() {
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();
    const lower = (subject + ' ' + message).toLowerCase();

    // Subject
    setCheck(checkSubject, subject.length > 0 ? 'ok' : 'pending', 'Subject line set');

    // Message
    setCheck(checkMessage, message.length > 10 ? 'ok' : 'pending', 'Message body filled');

    // Trickle
    setCheck(checkTrickle, trickleMode.checked ? 'ok' : 'warn', trickleMode.checked ? 'Trickle sending on' : 'Trickle sending off');

    // ALL CAPS check
    const words = message.split(/\s+/);
    const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
    setCheck(checkCaps, capsWords.length === 0 ? 'ok' : 'fail', capsWords.length === 0 ? 'No ALL-CAPS words' : `${capsWords.length} ALL-CAPS word(s)`);

    // Spam words
    const found = SPAM_WORDS.filter(sw => lower.includes(sw));
    setCheck(checkSpamWords, found.length === 0 ? 'ok' : 'fail', found.length === 0 ? 'No spam trigger words' : `Spam words: ${found[0]}`);
}

function setCheck(el, state, label) {
    const icon = el.querySelector('.check-icon');
    icon.className = `check-icon ${state}`;
    icon.textContent = state === 'ok' ? '✓' : state === 'fail' ? '✗' : state === 'warn' ? '!' : '○';
    let labelSpan = el.querySelector('.check-label');
    if (!labelSpan) {
        labelSpan = document.createElement('span');
        labelSpan.className = 'check-label';
        el.appendChild(labelSpan);
    }
    labelSpan.textContent = label;
}

// Run on input
emailListInput.addEventListener('input', updateStats);
subjectInput.addEventListener('input', () => { updateChecklist(); triggerAutoSave(); });
messageInput.addEventListener('input', () => { updateChecklist(); triggerAutoSave(); });
trickleMode.addEventListener('change', () => { updateStats(); updateChecklist(); });

// ── Auto-save template ───────────────────────────────────────
function triggerAutoSave() {
    if (!templateCheckbox.checked) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    saveStatus.textContent = 'Saving…';
    saveStatus.className = 'save-badge saving';

    autoSaveTimer = setTimeout(async () => {
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();
        if (!subject || !message) return;
        try {
            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('message', message);
            selectedFiles.forEach(file => {
                if (file.path) formData.append('existingAttachments', file.path);
                else formData.append('newAttachments', file);
            });
            const res = await fetch(`${API_BASE}/api/template/artemis-sponsorship`, {
                method: 'POST', body: formData
            });
            if (res.ok) {
                const result = await res.json();
                if (result.attachments) {
                    selectedFiles = selectedFiles.map(f => f.path ? f : {
                        name: f.name, size: f.size, type: f.type,
                        path: `templates/attachments/${f.name}`
                    });
                }
                saveStatus.textContent = 'Saved';
                saveStatus.className = 'save-badge saved';
                setTimeout(() => { saveStatus.textContent = ''; saveStatus.className = 'save-badge'; }, 3000);
            } else {
                saveStatus.textContent = 'Save failed';
                saveStatus.className = 'save-badge';
            }
        } catch (e) {
            saveStatus.textContent = '';
            saveStatus.className = 'save-badge';
        }
    }, 1200);
}

// ── Template checkbox ─────────────────────────────────────────
templateCheckbox.addEventListener('change', async (e) => {
    if (e.target.checked) {
        previousSubject = subjectInput.value;
        previousMessage = messageInput.value;
        subjectInput.value = '⏳ Loading…';
        messageInput.value = '⏳ Loading…';
        subjectInput.disabled = true;
        messageInput.disabled = true;
        try {
            const res = await fetch(`${API_BASE}/api/template/artemis-sponsorship`);
            if (!res.ok) throw new Error('Failed to load template');
            const tmpl = await res.json();
            subjectInput.value = tmpl.subject;
            messageInput.value = tmpl.message;

            if (tmpl.attachments?.length > 0) {
                selectedFiles = [];
                for (const p of tmpl.attachments) {
                    const fname = p.split('/').pop();
                    try {
                        const fr = await fetch(`${API_BASE}/api/template-attachment/${fname}`);
                        if (fr.ok) {
                            const blob = await fr.blob();
                            const f = new File([blob], fname, { type: fr.headers.get('content-type') || 'application/octet-stream' });
                            f.path = p;
                            selectedFiles.push(f);
                        }
                    } catch { }
                }
                renderFileList();
            }
        } catch (err) {
            showToast('Failed to load template', 'error');
            subjectInput.value = previousSubject;
            messageInput.value = previousMessage;
            e.target.checked = false;
        } finally {
            subjectInput.disabled = false;
            messageInput.disabled = false;
            updateStats();
            updateChecklist();
        }
    } else {
        subjectInput.value = previousSubject;
        messageInput.value = previousMessage;
        selectedFiles = selectedFiles.filter(f => !f.path);
        renderFileList();
        updateStats();
        updateChecklist();
    }
});

// ── File handling ─────────────────────────────────────────────
fileUploadArea.addEventListener('click', (e) => { if (e.target !== fileInput) fileInput.click(); });
fileInput.addEventListener('change', e => addFiles(e.target.files));

fileUploadArea.addEventListener('dragover', e => { e.preventDefault(); fileUploadArea.classList.add('drag-over'); });
fileUploadArea.addEventListener('dragleave', () => fileUploadArea.classList.remove('drag-over'));
fileUploadArea.addEventListener('drop', e => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    addFiles(e.dataTransfer.files);
});

function addFiles(files) {
    const arr = Array.from(files);
    const oversized = arr.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
        showToast(`Files over 10 MB skipped: ${oversized.map(f => f.name).join(', ')}`, 'error');
    }
    selectedFiles.push(...arr.filter(f => f.size <= 10 * 1024 * 1024));
    renderFileList();
    updateStats();
    triggerAutoSave();
}

function renderFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, i) => {
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.innerHTML = `
            <span class="file-chip-name" title="${file.name}">${getFileEmoji(file.type || '')} ${file.name}</span>
            <button type="button" class="file-chip-remove" data-i="${i}" aria-label="Remove ${file.name}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>`;
        fileList.appendChild(chip);
    });
    document.querySelectorAll('.file-chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedFiles.splice(parseInt(btn.dataset.i), 1);
            renderFileList();
            updateStats();
            triggerAutoSave();
        });
    });
}

function getFileEmoji(type) {
    if (type.startsWith('image/')) return '🖼';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('zip')) return '📦';
    return '📎';
}

// ── Preview ───────────────────────────────────────────────────
previewBtn.addEventListener('click', () => {
    const emails = parseEmails(emailListInput.value);
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();
    if (!emails.length) { showToast('Add at least one valid email address first.', 'error'); return; }
    if (!subject) { showToast('Please enter a subject line.', 'error'); return; }

    document.getElementById('previewSubject').textContent = subject;
    document.getElementById('previewRecipients').textContent = emails.length > 5
        ? `${emails.slice(0, 5).join(', ')}  …+${emails.length - 5} more`
        : emails.join(', ');
    document.getElementById('previewMessage').textContent = message;
    previewModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => previewModal.classList.add('hidden'));
previewModal.addEventListener('click', e => { if (e.target === previewModal) previewModal.classList.add('hidden'); });
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') previewModal.classList.add('hidden');
});

// ── Cancel ─────────────────────────────────────────────────────
cancelBtn.addEventListener('click', () => { cancelRequested = true; });

// ── Form submit ───────────────────────────────────────────────
emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emails = parseEmails(emailListInput.value);
    const subject = subjectInput.value.trim();
    let message = messageInput.value.trim();

    if (!emails.length) { showToast('Add at least one valid email address.', 'error'); return; }
    if (!subject || !message) { showToast('Please fill in all required fields.', 'error'); return; }

    // Append unsubscribe footer
    if (unsubscribeFooter.checked) {
        message += '\n\n---\nTo unsubscribe from future emails, simply reply with "unsubscribe" in the subject line.';
    }

    const useTrickle = trickleMode.checked;
    const DELAY_MS = useTrickle ? 5 * 60 * 1000 : 0; // 5 min in ms (or 0)

    // Prepare attachments list
    const newFiles = selectedFiles.filter(f => !f.path);
    const existingPaths = selectedFiles.filter(f => f.path).map(f => f.path);

    // --- UI: start sending state ---
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<svg class="spinner" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10"/></svg> Sending…`;
    progressCard.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressTotal.textContent = `of ${emails.length}`;
    progressSent.textContent = '0 sent';
    progressNote.textContent = useTrickle ? 'Trickle mode: 5 min between emails.' : '';
    setStatus('sending', 'Sending…');
    cancelRequested = false;

    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < emails.length; i++) {
        if (cancelRequested) {
            showToast(`Cancelled after ${sentCount} sent.`, 'info');
            break;
        }

        const recipient = emails[i];
        progressNote.textContent = `Sending to ${recipient}…`;

        try {
            const formData = new FormData();
            formData.append('recipients', JSON.stringify([recipient]));
            formData.append('subject', subject);
            formData.append('message', message);
            newFiles.forEach(f => formData.append('attachments', f));
            existingPaths.forEach(p => formData.append('existingAttachments', p));

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 90000);

            const res = await fetch(`${API_BASE}/send-emails`, {
                method: 'POST', body: formData, signal: controller.signal
            });
            clearTimeout(timeout);

            if (res.ok) {
                sentCount++;
            } else {
                const err = await res.json().catch(() => ({}));
                console.warn(`Failed to ${recipient}:`, err.error);
                failCount++;
            }
        } catch (err) {
            console.error(`Error sending to ${recipient}:`, err);
            failCount++;
        }

        // Update progress
        const pct = Math.round(((i + 1) / emails.length) * 100);
        progressFill.style.width = `${pct}%`;
        progressSent.textContent = `${sentCount} sent${failCount > 0 ? `, ${failCount} failed` : ''}`;

        // Delay before next (except after last)
        if (i < emails.length - 1 && DELAY_MS > 0 && !cancelRequested) {
            // Countdown display
            const end = Date.now() + DELAY_MS;
            const countdown = setInterval(() => {
                if (cancelRequested) { clearInterval(countdown); return; }
                const rem = Math.max(0, Math.round((end - Date.now()) / 1000));
                progressNote.textContent = `Next email in ${rem}s…`;
                if (rem === 0) clearInterval(countdown);
            }, 1000);
            await new Promise(r => setTimeout(r, DELAY_MS));
            clearInterval(countdown);
        }
    }

    // --- Done ---
    const success = failCount === 0 && sentCount > 0;
    setStatus(success ? 'done' : 'error', success ? 'Done' : 'Partial');
    showToast(
        failCount === 0
            ? `✓ Sent ${sentCount} email${sentCount !== 1 ? 's' : ''} successfully.`
            : `${sentCount} sent, ${failCount} failed.`,
        failCount === 0 ? 'success' : 'error',
        8000
    );

    progressNote.textContent = failCount === 0 ? 'All done!' : `${failCount} failed.`;
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Campaign`;

    if (success) {
        setTimeout(() => {
            emailListInput.value = '';
            emailCountBadge.textContent = '0';
            statRecipients.textContent = '0';
            statTime.textContent = '—';
            progressCard.classList.add('hidden');
            setStatus('ready', 'Ready');
        }, 3000);
    }
});

// ── Initial render ────────────────────────────────────────────
updateStats();
updateChecklist();
setStatus('ready', 'Ready');
