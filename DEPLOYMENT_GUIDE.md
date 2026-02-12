# How to Deploy Your Email Bot Online

You asked for a "GitHub link to view the website".

Here is the important thing to know: **GitHub Pages only hosts static websites** (HTML/CSS/JS).

But your Email Bot is a **Full-Stack Application**:
1.  **Frontend**: The website (HTML/CSS)
2.  **Backend**: The server (`server.js`) that actually sends the emails and saves templates.

Because of this backend, **you cannot host the working bot on GitHub Pages**. If you did, the website would load, but the "Send Email" and "Save Template" buttons would break.

## The Solution: Deploy on Render (Free)

To get a link you can share and use, you need a host that supports Node.js servers. **Render** has a free tier that is perfect for this.

### Step 1: Sign Up for Render
1.  Go to [https://render.com/](https://render.com/)
2.  Click **"Get Started"** and sign up with **GitHub**.

### Step 2: Create a Web Service
1.  Click **"New +"** -> **"Web Service"**.
2.  Select your `email-bot` repository from the list.
3.  Give it a name (e.g., `my-email-bot`).
4.  **Region**: Choose the one closest to you (e.g., US East).
5.  **Branch**: `main`
6.  **Root Directory**: Leave blank (it's the root).
7.  **Runtime**: `Node`
8.  **Build Command**: `npm install`
9.  **Start Command**: `npm start`
10. **Plan**: Select **"Free"**.

### Step 3: Add Your Secrets (Environment Variables)
This is critical! Your `.env` file is not on GitHub (for security), so you must tell Render your email credentials manually.

1.  Scroll down to the **"Environment Variables"** section.
2.  Click **"Add Environment Variable"** and add these (copy the values from your local `.env` file):

    *   **Key**: `EMAIL_SERVICE`
        *   **Value**: `gmail`
    *   **Key**: `EMAIL_USER`
        *   **Value**: `(your email address)`
    *   **Key**: `EMAIL_PASSWORD`
        *   **Value**: `(your app password)`
    *   **Key**: `EMAIL_FROM_NAME`
        *   **Value**: `(your name)`

### Step 4: Deploy
1.  Click **"Create Web Service"**.
2.  Render will start building your app. It may take a few minutes.
3.  Once done, you will see a green **"Live"** checking status.
4.  Your bot will be available at a URL like `https://my-email-bot.onrender.com`.

**Note on Free Tier**: Render's free servers "sleep" after 15 minutes of inactivity. When you visit the link after a break, it might take 30-50 seconds to wake up. This is normal!
