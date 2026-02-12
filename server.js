const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

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

        // Send emails sequentially to avoid rate limiting
        for (const recipient of recipients) {
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

            // Add small delay between emails to avoid rate limiting
            if (recipients.indexOf(recipient) < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
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

// Health check endpoint
app.get('/health', (req, res) => {
    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    res.json({
        status: 'ok',
        configured: isConfigured,
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
