# Email Bot Configuration Guide

## Quick Setup

### 1. Create `.env` file
```bash
cp .env.example .env
```

### 2. Edit `.env` with your credentials

**For Gmail:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=Your Name
```

**Get Gmail App Password:**
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" → Generate
4. Copy the 16-character password
5. Paste into `EMAIL_PASSWORD`

**For Outlook/Hotmail:**
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM_NAME=Your Name
```

**For Yahoo:**
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Your Name
```

### 3. Start the server
```bash
npm start
```

### 4. Open the app
Navigate to: http://localhost:3000

## Features

✨ **Beautiful dark-themed UI**
📧 **Bulk email sending**
📎 **File attachments** (images, PDFs, documents)
🖱️ **Drag-and-drop file uploads**
👀 **Preview before sending**
✅ **Email validation**

## Usage

1. **Paste email addresses** (one per line or comma-separated)
2. **Write your subject and message**
3. **Attach files** (optional - drag & drop or click to upload)
4. **Preview** to review
5. **Send** to all recipients

## Troubleshooting

**"Email credentials not configured"**
- Create a `.env` file (copy from `.env.example`)
- Restart the server after creating `.env`

**Gmail "Less secure app" error**
- Use an App Password (see steps above)
- Don't use your regular Gmail password

**Files not attaching**
- Max file size: 10MB per file
- All file types supported

**Rate limiting**
- Emails are sent with 500ms delay between each
- This prevents spam filters
