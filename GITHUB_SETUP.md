# GitHub Setup Instructions

## Create GitHub Repository

Since GitHub CLI (`gh`) is not installed, follow these steps to create your repo:

### Option 1: Via GitHub Website (Easiest)

1. Go to https://github.com/new
2. Repository name: `email-bot`
3. Description: `Beautiful bulk email sender with file attachments`
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

7. Then run these commands in your terminal:
```bash
cd /Users/reedfisch/Documents/Projects/email-bot

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/email-bot.git

# Push your code
git branch -M main
git push -u origin main
```

### Option 2: Install GitHub CLI (For Future Use)

```bash
# Install GitHub CLI
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npm install -g gh

# Or download from: https://cli.github.com/
```

Then you can use:
```bash
gh repo create email-bot --public --source=. --push
```

## Current Status

✅ Code committed to local Git
✅ File attachments feature added
✅ Email configuration guide created

Next: Push to GitHub using the instructions above!
