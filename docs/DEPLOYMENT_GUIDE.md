# TemariHub Production Deployment Guide

This guide provides step-by-step instructions for deploying TemariHub using the approved split architecture:
- **Frontend:** [Vercel](https://vercel.com) (Global Edge CDN for React + Vite)
- **Backend:** [Render](https://render.com) (Node.js Express + TypeScript REST API)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Managed Cloud Database)

---

## Architecture Overview

```
                                      +------------------------+
                                      |     MongoDB Atlas      |
                                      |   (M0 Free or Shared)  |
                                      +-----------+------------+
                                                  ^
                                                  | TLS / Mongoose
                                                  v
+-----------------------+              +------------------------+
|     Vercel Edge       |   HTTPS      |     Render Web Service |
|  React 19 + Vite SPA  +------------> |  Express API + Sessions|
| https://temarihub.    | CORS/Cookies |  https://temarihub-api.|
|      vercel.app       |              |      onrender.com      |
+-----------------------+              +------------------------+
```

---

## Step 1: Set Up MongoDB Atlas

1. **Log in or create a free account:** [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create a Free Cluster:**
   - Choose the free **M0** tier (AWS Frankfurt `eu-central-1` or AWS Ireland `eu-west-1` for low latency to Africa/Europe).
   - Cluster Name: `temarihub-cluster`
3. **Configure Network Access (Crucial):**
   - In the left sidebar, navigate to **Security** > **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. (This enables Render's dynamic cloud IPs to connect to your database).
4. **Create a Database User:**
   - In the left sidebar, navigate to **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `temarihub_admin`
   - Password: Click **Autogenerate Secure Password** and copy it safely.
   - Database User Privileges: **Read and write to any database**.
   - Click **Add User**.
5. **Obtain Connection String:**
   - In **Database Deployments**, click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy the URI, which looks like:
     ```
     mongodb+srv://temarihub_admin:<password>@temarihub-cluster.xxxxx.mongodb.net/temarihub?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and ensure `/temarihub` is the database name before `?retryWrites=true`.

---

## Step 2: Deploy Backend to Render

1. **Log in to Render:** [https://dashboard.render.com](https://dashboard.render.com)
2. **Create Web Service:**
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository: `https://github.com/petersisay/TemariHub`.
3. **Configure Web Service Settings:**
   - **Name:** `temarihub-api`
   - **Region:** Frankfurt (EU Central) or Oregon (US West)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Instance Type:** `Free`

   > **Crucial: Match your Root Directory & Commands:**
   >
   > **If Root Directory is `server` (Your current Render configuration):**
   > - **Root Directory:** `server`
   > - **Build Command:** `npm install && npm run build`
   > - **Start Command:** `npm start` *(or `node dist/server.js`)*
   >
   > *(Do NOT put `--workspace=server` in the start command when running inside the `server` directory, because workspaces only exist at the repository root).*
   >
   > ---
   >
   > **If Root Directory is left blank / `./` (Root configuration):**
   > - **Root Directory:** *(Leave blank)*
   > - **Build Command:** `npm install && npm run build:server`
   > - **Start Command:** `npm run start --workspace=server`
4. **Add Environment Variables:**
   Under **Environment Variables**, add the following key-value pairs:

   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enforces production security checks |
   | `API_PREFIX` | `/api/v1` | Versioned REST prefix |
   | `MONGODB_URI` | `mongodb+srv://temarihub_admin:...` | Your Atlas connection string from Step 1 |
   | `SESSION_SECRET` | *(Random 32+ character string)* | Generate with `openssl rand -hex 32` |
   | `SESSION_COOKIE_NAME` | `temarihub_sid` | Cookie name |
   | `SESSION_COOKIE_SAME_SITE` | `none` | Required for cross-domain cookies (Vercel <-> Render) |
   | `CLIENT_URL` | `https://temarihub.vercel.app` | *Update with your actual Vercel URL in Step 4* |

5. **Deploy Service:**
   - Click **Deploy Web Service**.
   - Once deployed, your Render API will be live at: `https://temarihub-api.onrender.com`.
   - Verify health: Open `https://temarihub-api.onrender.com/api/v1/health` in your browser. You should receive:
     ```json
     {"success":true,"status":"healthy","version":"1.0.0"}
     ```

---

## Step 3: Deploy Frontend to Vercel

1. **Log in to Vercel:** [https://vercel.com](https://vercel.com)
2. **Add New Project:**
   - Click **Add New...** > **Project**.
   - Import `petersisay/TemariHub` from GitHub.
3. **Configure Build Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `client`.
   - **Build Command:** `npm run build` (Default)
   - **Output Directory:** `dist` (Default)
4. **Add Environment Variable:**
   Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://temarihub-api.onrender.com/api/v1` |

   *(Replace with your actual Render URL from Step 2, making sure to include `/api/v1` and no trailing slash).*

5. **Deploy:**
   - Click **Deploy**.
   - Vercel will install dependencies, build the React SPA, and provision your live URL (e.g. `https://temarihub.vercel.app` or `https://temari-hub.vercel.app`).

---

## Step 4: Finalize CORS & Cookie Alignment

1. Go back to your [Render Dashboard](https://dashboard.render.com).
2. Select your `temarihub-api` service > **Environment**.
3. Set `CLIENT_URL` to your exact Vercel URL:
   ```
   CLIENT_URL = https://temarihub.vercel.app
   ```
   *(Ensure no trailing slash).*
4. Render will automatically redeploy with the updated CORS allowlist and CSRF origin verification.

---

## Step 5: Seed Production Administrator & Opportunities

To populate your live database with the initial platform administrator and real verified Ethiopian STEM opportunities:

1. In Render, open your `temarihub-api` service.
2. Click the **Shell** tab on the left navigation bar.
3. In the terminal, execute:
   ```bash
   INITIAL_ADMIN_EMAIL=admin@temarihub.et INITIAL_ADMIN_PASSWORD=YourStrongPassword2026! npm run seed:admin --workspace=server
   ```
4. Next, populate realistic verified opportunities:
   ```bash
   npm run seed:opportunities --workspace=server
   ```
5. You can now log into your live platform at `https://temarihub.vercel.app/login` with your administrator credentials!

---

## Step 6: Production Verification Checklist

- [ ] `https://temarihub.vercel.app` loads the animated education-tech hero and graduation-cap logo.
- [ ] English and Amharic language switcher toggles seamlessly.
- [ ] Opportunity search and faceted filters return live database listings.
- [ ] Student registration and login establish secure cross-domain session cookies.
- [ ] Application tracker allows adding opportunities and updating stages.
- [ ] Admin portal at `/admin` displays live system telemetry and moderation queue.
