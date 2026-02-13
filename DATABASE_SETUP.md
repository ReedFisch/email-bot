# Database Setup Guide (MongoDB)

To make your Email Bot save templates and files permanently on Render, you need a database.
We will use **MongoDB Atlas** (it's free and easy).

## Step 1: Create a Free Cluster
1.  Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2.  Sign up (you can use Google).
3.  Select the **"M0 Free"** tier.
4.  Choose a provider (AWS) and region closest to you.
5.  Click **"Create"**.

## Step 2: Create a Database User
1.  In the "Security Quickstart", enter a **Username** (e.g., `admin`).
2.  Enter a **Password** (make it strong, but remember it!).
3.  Click **"Create User"**.

## Step 3: Allow Access
1.  Scroll down to "IP Access List".
2.  Click **"Add My Current IP Address"** (for local testing).
3.  **IMPORTANT**: Also Click **"Allow Access from Anywhere"** (0.0.0.0/0).
    *   *Why?* Render's servers change IP addresses constantly, so we need to allow any IP to connect. Since you have a strong password, this is safe for this project.
4.  Click **"Finish and Close"**.

## Step 4: Get Connection String
1.  On the Overview page, click **"Connect"**.
2.  Select **"Drivers"**.
3.  Copy the **Connection String**. It looks like:
    `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

## Step 5: Add to Render
1.  Go to your project dashboard on **Render**.
2.  Click **"Environment"**.
3.  Add a new Environment Variable:
    *   **Key**: `MONGODB_URI`
    *   **Value**: Paste the string you copied.
    *   **CRITICAL**: Replace `<password>` with the actual password you created in Step 2.
4.  Click **"Save Changes"**.

## Step 6: Redeploy (Optional)
Render usually restarts automatically when you change variables. If not, go to **"Manual Deploy"** -> **"Deploy latest commit"**.

✅ **Done!** Your templates will now be saved to the database and will persist forever!
