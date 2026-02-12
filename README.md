# Email Bot

A beautiful, modern web interface for sending bulk emails through your personal email account.

## Features

✨ **Beautiful UI** - Modern dark theme with gradient accents and smooth animations  
📧 **Bulk Sending** - Send personalized emails to multiple recipients at once  
👀 **Preview Mode** - Preview your email before sending  
✅ **Email Validation** - Automatic validation and duplicate removal  
🔒 **Secure** - Credentials stored locally in `.env` file  
⚡ **Real-time Feedback** - Live recipient count and sending status

## Screenshots

The interface includes:
- Email list input (paste multiple emails)
- Subject and message editor
- Live recipient counter
- Preview modal
- Success/error status notifications

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Credentials

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your email credentials:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM_NAME=Your Name
```

#### Getting an App Password for Gmail

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Copy the 16-character password and paste it in `.env`

#### For Other Email Providers

- **Outlook/Hotmail**: Use your regular password or create an app password
- **Yahoo**: Create an app-specific password in account settings
- **Custom SMTP**: Modify `server.js` to use custom SMTP settings

### 3. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 4. Open the Web Interface

Open your browser and navigate to:

```
http://localhost:3000
```

## Usage

1. **Paste Email Addresses**: Enter recipient emails in the text area (one per line or comma-separated)
2. **Write Your Email**: Add a subject and compose your message
3. **Preview** (Optional): Click "Preview" to review before sending
4. **Send**: Click "Send Emails" to deliver your message to all recipients

## Email Format Support

- **Plain Text**: Messages are sent as plain text by default
- **HTML**: Line breaks are automatically converted to `<br>` tags
- **HTML Support**: You can include HTML in your message for formatting

## Technical Details

### Frontend
- Pure HTML, CSS, and JavaScript (no frameworks)
- Modern, responsive design
- Email validation and parsing
- Real-time recipient counter

### Backend
- Node.js with Express
- Nodemailer for SMTP email sending
- Rate limiting (500ms delay between emails)
- Comprehensive error handling

### Architecture
- Frontend communicates with backend via REST API
- POST `/send-emails` - Send bulk emails
- GET `/health` - Check server and configuration status

## Security Notes

⚠️ **Important Security Considerations:**

- Never commit your `.env` file to version control
- Use app-specific passwords, not your main email password
- The `.gitignore` file protects your `.env` automatically
- This tool runs locally and doesn't send data to any third-party services

## Troubleshooting

### "Email credentials not configured" error
- Make sure you created a `.env` file with valid credentials
- Restart the server after creating/modifying `.env`

### Gmail "Less secure app" error
- Enable 2-Factor Authentication
- Use an App Password instead of your regular password

### Emails not sending
- Check your email credentials in `.env`
- Verify your email provider allows SMTP access
- Check the server console for detailed error messages

### Rate limiting
- If sending to many recipients, emails are sent with 500ms delays
- This prevents triggering spam filters or rate limits

## Development

The project structure:

```
email-bot/
├── index.html        # Main web interface
├── style.css         # Styling and animations
├── script.js         # Frontend logic
├── server.js         # Express server and email logic
├── package.json      # Dependencies
├── .env.example      # Example configuration
├── .env              # Your actual credentials (not in git)
├── .gitignore        # Protects sensitive files
└── README.md         # This file
```

## License

MIT
