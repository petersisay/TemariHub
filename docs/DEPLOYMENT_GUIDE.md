# TemariHub Production Deployment & Operations Guide

This guide provides step-by-step instructions for deploying and operating TemariHub in production using the approved modern cloud topology:
- **Frontend:** [Vercel](https://vercel.com) (Global Edge CDN for React + Vite)
- **Backend:** [Render](https://render.com) (Node.js Express + TypeScript REST API)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Managed Cloud Database)
- **Identity Provider:** [Google Cloud Console](https://console.cloud.google.com) (Google Identity Services OAuth 2.0)

**Live Production URLs:**
- **Frontend Web Application:** [https://temari-hub.vercel.app](https://temari-hub.vercel.app)
- **Backend REST API:** [https://temarihub-api.onrender.com](https://temarihub-api.onrender.com)
- **GitHub Repository:** [https://github.com/petersisay/TemariHub](https://github.com/petersisay/TemariHub)

---

## 1. System Topology Overview

```
                                      +------------------------+
                                      |     MongoDB Atlas      |
                                      |   (M0 Free or Shared)  |
                                      +-----------+------------+
                                                  ^
                                                  | TLS 1.3 / Mongoose
                                                  v
+-----------------------+              +------------------------+
|     Vercel Edge       |   HTTPS      |     Render Web Service |
|  React 18/19 Vite SPA +------------> |  Express API + Sessions|
| https://temari-hub.   | CORS/Cookies |  https://temarihub-api.|
|      vercel.app       |              |      onrender.com      |
+-----------+-----------+              +-----------+------------+
            |                                      ^
            |  Google ID Token (GIS)               | Token Verification
            v                                      v
+---------------------------------------------------------------+
|               Google Identity Services (OAuth 2.0)             |
+---------------------------------------------------------------+
```

---

## 2. Step 1: Configure Google Cloud OAuth 2.0 Credentials

TemariHub uses Google-Only authentication. Before deploying the frontend or backend, establish your OAuth 2.0 credentials:

1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create or select a project (e.g. `temarihub-production`).
3. Configure the **OAuth Consent Screen**:
   - User Type: **External**
   - App Name: `TemariHub (ተማሪሀብ)`
   - User Support & Developer Contact Email: `petrossisay1646@gmail.com`
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
4. Create **OAuth 2.0 Client IDs**:
   - Application Type: **Web application**
   - Name: `TemariHub Web Client`
   - **Authorized JavaScript origins:**
     - `https://temari-hub.vercel.app`
     - `http://localhost:5173`
   - **Authorized redirect URIs:**
     - `https://temari-hub.vercel.app`
     - `http://localhost:5173`
5. Copy your **Client ID** (e.g., `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`).

---

## 3. Step 2: Set Up MongoDB Atlas

1. **Log in or create a cluster:** [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster:**
   - Provider & Region: AWS Frankfurt (`eu-central-1`) or AWS Ireland (`eu-west-1`) for optimal latency to Ethiopia and East Africa.
   - Cluster Tier: M0 (Free) or M10 (Production).
3. **Configure Network Access:**
   - In **Security** > **Network Access**, add IP address `0.0.0.0/0` (Allow access from anywhere) so that Render's dynamic IP instances can connect reliably.
4. **Create Database User:**
   - In **Security** > **Database Access**, create user `temarihub_admin` with **Read and write to any database** permissions.
5. **Obtain Connection String:**
   - Format:
     ```
     mongodb+srv://temarihub_admin:<password>@temarihub-cluster.xxxxx.mongodb.net/temarihub?retryWrites=true&w=majority
     ```

---

## 4. Step 3: Deploy Backend to Render

1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service** and connect `https://github.com/petersisay/TemariHub`.
3. **Configure Web Service:**
   - **Name:** `temarihub-api`
   - **Region:** Frankfurt (EU Central)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. **Environment Variables:**
   Under **Environment**, add the following production variables:

| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enforces production security, cookies, and error masks |
| `PORT` | `10000` | Port assigned by Render |
| `API_PREFIX` | `/api/v1` | Versioned REST root prefix |
| `CLIENT_URL` | `https://temari-hub.vercel.app` | Exact allowed CORS origin & CSRF origin |
| `MONGODB_URI` | `mongodb+srv://temarihub_admin:...` | Atlas connection string |
| `SESSION_SECRET` | *(Random >= 32 characters)* | Generate via `openssl rand -hex 32` |
| `SESSION_COOKIE_NAME` | `temarihub_sid` | Cookie name |
| `SESSION_COOKIE_SAME_SITE` | `none` | Required for cross-domain cookie transmission (Vercel <-> Render) |
| `GOOGLE_CLIENT_ID` | `xxxxxxxxxxxx.apps.googleusercontent.com` | Google OAuth Client ID |
| `ADMIN_EMAIL` | `petrossisay1646@gmail.com` | Designated administrator email |
| `SUBMITTER_EMAIL` | `petrossisay7164@gmail.com` | Designated opportunity submitter email |
| `ENABLE_SOURCE_MONITORING`| `true` | Enables background checks for 12 trusted sources |
| `SOURCE_MONITOR_INTERVAL_HOURS`| `6` | Automated discovery interval |

5. **Deploy Service:** Click **Save Changes** / **Deploy**.
6. **Verify API Health:**
   Visit `https://temarihub-api.onrender.com/api/v1/health` in your browser. Expected response:
   ```json
   {
     "success": true,
     "status": "healthy",
     "timestamp": "2026-10-27T01:00:00.000Z",
     "uptime": 120,
     "environment": "production",
     "version": "1.0.0"
   }
   ```

---

## 5. Step 4: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project** and import `petersisay/TemariHub`.
3. **Configure Project Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `client`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:**
   Add the following variables in Vercel:

| Variable | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://temarihub-api.onrender.com/api/v1` | Backend API URL (no trailing slash) |
| `VITE_GOOGLE_CLIENT_ID` | `xxxxxxxxxxxx.apps.googleusercontent.com` | Google OAuth Client ID matching backend |

5. **Deploy:** Click **Deploy**. Vercel will provision the live application at `https://temari-hub.vercel.app`.

---

## 6. Step 5: Production User Roles & Access

TemariHub automatically assigns roles upon Google sign-in without manual CLI password seeding:

1. **Administrator Access (`admin`):**
   - Sign in using `petrossisay1646@gmail.com`.
   - The backend recognizes the email and grants `admin` role automatically.
   - Access the Admin Dashboard at `https://temari-hub.vercel.app/admin`.
   - Review pending submissions in `/admin/opportunities/verification-queue`.
   - Monitor the 12 candidate sources at `/sources`.
2. **Submitter Access (`submitter`):**
   - Sign in using `petrossisay7164@gmail.com`.
   - The backend grants `submitter` role automatically.
   - Submit new opportunities at `/submit`.
   - Track submission status and edit listings at `/submission-status`.
3. **Student Access (`student`):**
   - Any other Google account automatically receives the `student` role.
   - Explore verified listings, bookmark opportunities (`/saved`), track applications in 7 stages (`/tracker`), and configure student academic profile (`/profile`).

---

## 7. Step 6: Production Verification Checklist

- [ ] **HTTPS & Domains:** `https://temari-hub.vercel.app` loads cleanly with modern brand assets.
- [ ] **Google Sign-In:** One-click Google Identity Services button functions without popup blocker warnings.
- [ ] **Role Assignment:** `petrossisay1646@gmail.com` logs in as Admin; `petrossisay7164@gmail.com` logs in as Submitter.
- [ ] **Cross-Domain Cookies:** `temarihub_sid` session cookie is stored with `SameSite: none` and `Secure`.
- [ ] **Public Opportunities Feed:** Returns only verified (`VERIFIED`), published listings.
- [ ] **Submission & Re-Verification:** Submitter can edit listings via `PUT /api/v1/opportunities/:id`; edits reset status to `draft` and `PENDING_REVIEW`.
- [ ] **Verification Queue:** Administrator can verify candidate listings with recorded source evidence via `POST /api/v1/opportunities/:id/verify`.
- [ ] **Trusted Sources:** Admin can view all 12 monitored sources and trigger manual discovery checks.
- [ ] **Student Tracker:** Students can move tracked opportunities across all 7 stages with private notes.
