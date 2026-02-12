# Template Feature Guide

## How to Use the Sponsorship Template
1. **Open the Email Bot**
2. **Click the checkbox**: "Use Artemis Sponsorship Template"
3. **Review**: The subject, message, and PDF attachment will load automatically.
4. **Send**: Click "Send Emails".

## Updating the Template

### 1. Update the Message/Subject
Edit this file in your project:
`templates/artemis-sponsorship.json`

### 2. Update the PDF Attachment
The app looks for: `templates/attachments/artemis-sponsorship.pdf`

**To update the PDF:**
1. **GitHub Upload (Recommended)**:
   - Go to your GitHub repository
   - Navigate to `templates/attachments/`
   - Upload your new PDF
   - Name it exactly: `artemis-sponsorship.pdf` (it will replace the old one)

2. **Local Replacement**:
   - Save your PDF as `artemis-sponsorship.pdf`
   - Overwrite the file in the `templates/attachments/` folder

## Adding New Templates
To add a new template, duplicate `artemis-sponsorship.json` and give it a new name (e.g., `new-campaign.json`). You'll also need to update `server.js` to include it in the list.
