const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const mongoose = require('mongoose');

// MongoDB Connection
let isMongoConnected = false;
const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.log('📝 Using local file system (MONGODB_URI not set)');
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isMongoConnected = true;
        console.log('🍃 Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
    }
};
connectDB();

// Schema
const templateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    subject: String,
    message: String,
    attachments: [{
        filename: String,
        contentType: String,
        data: Buffer
    }]
});
let Template;
try {
    Template = mongoose.model('Template');
} catch {
    Template = mongoose.model('Template', templateSchema);
}

// Configure multer for file uploads (store in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Create reusable transporter
function createTransporter() {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

// Send emails endpoint
app.post('/send-emails', upload.array('attachments', 10), async (req, res) => {
    // Parse recipients from JSON string (FormData sends it as string)
    const recipients = req.body.recipients ? JSON.parse(req.body.recipients) : [];
    const { subject, message } = req.body;
    const files = req.files || [];

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients array is required' });
    }

    if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return res.status(500).json({
            error: 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file.'
        });
    }

    try {
        const transporter = createTransporter();

        // Verify transporter configuration
        await transporter.verify();

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Prepare attachments
        const attachments = files.map(file => ({
            filename: file.originalname,
            content: file.buffer,
            contentType: file.mimetype
        }));

        // Helper function to send a single email
        const sendSingleEmail = async (recipient) => {
            try {
                await transporter.sendMail({
                    from: `"${process.env.EMAIL_FROM_NAME || 'Email Bot'}" <${process.env.EMAIL_USER}>`,
                    to: recipient,
                    subject: subject,
                    text: message,
                    html: message.replace(/\n/g, '<br>'),
                    attachments: attachments
                });
                successCount++;
                console.log(`✓ Email sent to ${recipient}`);
            } catch (error) {
                errorCount++;
                errors.push({ recipient, error: error.message });
                console.error(`✗ Failed to send to ${recipient}:`, error.message);
            }
        };

        // Send in batches to improve speed while respecting rate limits
        const BATCH_SIZE = 3;
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(recipient => sendSingleEmail(recipient)));

            // Small delay between batches if there are more emails
            if (i + BATCH_SIZE < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const response = {
            sent: successCount,
            failed: errorCount,
            total: recipients.length
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        if (errorCount > 0) {
            return res.status(207).json(response); // Multi-Status
        }

        res.json(response);

    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({
            error: error.message || 'Failed to send emails',
            details: error.toString()
        });
    }
});

// Template endpoints
app.get('/api/templates', (req, res) => {
    // For now, return hardcoded list or scan directory
    res.json([
        { id: 'artemis-sponsorship', name: 'Artemis Sponsorship' }
    ]);
});

app.get('/api/template/:name', async (req, res) => {
    const templateName = req.params.name;
    const fs = require('fs');
    const path = require('path');

    // Try MongoDB first
    if (isMongoConnected) {
        try {
            const template = await Template.findOne({ name: templateName });
            if (template) {
                // Return structure matching local JSON
                return res.json({
                    subject: template.subject,
                    message: template.message,
                    attachments: template.attachments.map(a => `templates/attachments/${a.filename}`)
                });
            }
        } catch (err) {
            console.error('DB Read Error:', err);
        }
    }

    // Fallback to local file
    try {
        const filePath = path.join(__dirname, 'templates', `${templateName}.json`);
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const template = JSON.parse(fileData);
            res.json(template);
        } else {
            res.status(404).json({ error: 'Template not found' });
        }
    } catch (error) {
        console.error('Error reading template:', error);
        res.status(500).json({ error: 'Failed to read template' });
    }
});


app.get('/api/template-attachment/:filename', async (req, res) => {
    const filename = req.params.filename;

    // Try MongoDB
    if (isMongoConnected) {
        try {
            // Find any template containing this attachment
            const template = await Template.findOne({ 'attachments.filename': filename });
            if (template) {
                const attachment = template.attachments.find(a => a.filename === filename);
                if (attachment) {
                    res.set('Content-Type', attachment.contentType);
                    return res.send(attachment.data);
                }
            }
        } catch (err) {
            console.error('DB Attachment Read Error:', err);
        }
    }

    // Fallback to local file
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, 'templates', 'attachments', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Attachment not found' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    res.json({
        status: 'ok',
        configured: isConfigured,
        mongodb: isMongoConnected,
        message: isConfigured
            ? 'Email service is configured'
            : 'Email credentials not set. Please configure .env file.'
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Email Bot Server running on http://localhost:${PORT}`);
    console.log(`\n📧 Email Configuration:`);
    console.log(`   Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
    console.log(`   User: ${process.env.EMAIL_USER || 'NOT SET ⚠️'}`);
    console.log(`   Password: ${process.env.EMAIL_PASSWORD ? '****** (set)' : 'NOT SET ⚠️'}\n`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️  WARNING: Email credentials not configured!');
        console.log('   Please create a .env file with your email credentials.\n');
    }
});

app.post('/api/template/:name', upload.array('newAttachments', 10), async (req, res) => {
    const templateName = req.params.name;
    const { subject, message } = req.body;
    let existingAttachments = req.body.existingAttachments || [];
    const newFiles = req.files || [];
    const fs = require('fs');
    const path = require('path');

    // Parse existingAttachments
    if (typeof existingAttachments === 'string') {
        try { existingAttachments = JSON.parse(existingAttachments); }
        catch (e) { existingAttachments = [existingAttachments]; }
    }
    if (!Array.isArray(existingAttachments)) existingAttachments = [];

    if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }

    // MongoDB Save
    if (isMongoConnected) {
        try {
            let template = await Template.findOne({ name: templateName });
            if (!template) {
                template = new Template({ name: templateName, attachments: [] });
            }

            template.subject = subject;
            template.message = message;

            // Keep existing
            const keepFilenames = existingAttachments.map(p => p.split('/').pop());
            template.attachments = template.attachments.filter(a => keepFilenames.includes(a.filename));

            // Add new
            for (const file of newFiles) {
                template.attachments.push({
                    filename: file.originalname,
                    contentType: file.mimetype,
                    data: file.buffer
                });
            }

            await template.save();

            return res.json({
                success: true,
                message: 'Template saved to Database',
                attachments: template.attachments.map(a => `templates/attachments/${a.filename}`)
            });
        } catch (err) {
            console.error('DB Write Error:', err);
            return res.status(500).json({ error: 'Database write failed' });
        }
    }

    // Local Fallback
    try {
        const filePath = path.join(__dirname, 'templates', `${templateName}.json`);
        const attachmentsDir = path.join(__dirname, 'templates', 'attachments');

        if (!fs.existsSync(attachmentsDir)) fs.mkdirSync(attachmentsDir, { recursive: true });

        let template = {};
        if (fs.existsSync(filePath)) {
            template = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        const savedNewAttachments = newFiles.map(file => {
            const targetPath = path.join(attachmentsDir, file.originalname);
            fs.writeFileSync(targetPath, file.buffer);
            return `templates/attachments/${file.originalname}`;
        });

        const validExisting = existingAttachments.filter(p => p.startsWith('templates/attachments/'));

        template.subject = subject;
        template.message = message;
        template.attachments = [...validExisting, ...savedNewAttachments];
        if (!template.name) template.name = 'Custom Template';

        fs.writeFileSync(filePath, JSON.stringify(template, null, 2));

        res.json({
            success: true,
            message: 'Template and attachments saved locally',
            attachments: template.attachments
        });
    } catch (error) {
        console.error('Error saving template:', error);
        res.status(500).json({ error: 'Failed to save template' });
    }
});
