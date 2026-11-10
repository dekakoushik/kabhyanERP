# Deploying Kabhyan ERP on Dokploy

This guide outlines how to deploy the containerized **Kabhyan ERP** application on **Dokploy** (or any Docker / Coolify / CapRover PaaS infrastructure).

---

## Architecture Overview

```
                      Internet / HTTPS
                            │
                      ┌─────▼─────┐
                      │  Dokploy  │
                      │  Traefik  │
                      └─────┬─────┘
           ┌────────────────┴────────────────┐
           ▼                                 ▼
   https://erp.yourdomain.com       https://api-erp.yourdomain.com
   ┌────────────────────────┐       ┌────────────────────────┐
   │    Frontend Service    │       │     Backend Service    │
   │  Next.js 16 Standalone │       │ PHP 8.3 + Nginx Alpine │
   │      (Port 3000)       │       │        (Port 80)       │
   └───────────┬────────────┘       └───────────┬────────────┘
               │                                │
               └───────────► Network ◄──────────┘
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
              ┌──────────────┐        ┌──────────────┐
              │   MariaDB    │        │  Redis Node  │
              │ (Port 3306)  │        │ (Port 6379)  │
              └──────────────┘        └──────────────┘
```

---

## Deployment Option A: Dokploy Compose (Recommended)

1. **Create a New Project** in Dokploy (e.g. `Kabhyan ERP`).
2. Add a new **Compose Service**.
3. Point your Dokploy repository configuration to your Git repository:
   - **Repository**: Your GitHub / GitLab / Git repository URL
   - **Branch**: `main`
   - **Compose Path**: `docker-compose.yml`
4. In the Dokploy **Environment Variables** tab, copy the contents of `.env.example` and update with your production secrets:
   ```env
   APP_NAME=KabhyanERP
   APP_ENV=production
   APP_KEY=base64:YOUR_GENERATED_APP_KEY_HERE
   APP_DEBUG=false

   # Domain URLs
   BACKEND_URL=https://api-erp.yourcompany.com
   NEXT_PUBLIC_API_URL=https://api-erp.yourcompany.com/api/v1
   FRONTEND_URL=https://erp.yourcompany.com

   # Database Credentials
   DB_DATABASE=kabhyan_erp
   DB_USERNAME=kabhyan_user
   DB_PASSWORD=YourStrongDatabasePassword123
   DB_ROOT_PASSWORD=YourStrongRootPassword123

   # Startup routine
   RUN_MIGRATIONS=true
   RUN_SEEDERS=false
   ```
5. In Dokploy, assign your custom domains:
   - Domain `erp.yourcompany.com` ➔ Container `frontend` (Port `3000`)
   - Domain `api-erp.yourcompany.com` ➔ Container `backend` (Port `80`)
6. Click **Deploy**. Dokploy will automatically build both Dockerfiles, spin up MariaDB and Redis, run migrations, and provision SSL certificates via Traefik.

---

## Deployment Option B: Separate Dokploy Application Services

If you prefer managing the Frontend and Backend as independent services in Dokploy:

### 1. Database & Redis
- In Dokploy, click **Create Database**:
  - Select **MariaDB** (Database: `kabhyan_erp`).
  - Select **Redis**.

### 2. Backend Service
- Click **Create Application** ➔ **Docker**.
- Set context path to `/backend` and Dockerfile to `Dockerfile`.
- Set Environment Variables:
  ```env
  APP_NAME=KabhyanERP
  APP_ENV=production
  APP_KEY=base64:...
  DB_CONNECTION=mysql
  DB_HOST=mariadb-internal-dokploy-host
  DB_PORT=3306
  DB_DATABASE=kabhyan_erp
  DB_USERNAME=...
  DB_PASSWORD=...
  REDIS_HOST=redis-internal-dokploy-host
  REDIS_PORT=6379
  CACHE_STORE=redis
  SESSION_DRIVER=redis
  RUN_MIGRATIONS=true
  ```
- Expose Port: `80`.

### 3. Frontend Service
- Click **Create Application** ➔ **Docker**.
- Set context path to `/frontend` and Dockerfile to `Dockerfile`.
- Build Argument:
  ```env
  NEXT_PUBLIC_API_URL=https://api-erp.yourcompany.com/api/v1
  ```
- Expose Port: `3000`.

---

## Local Testing with Docker

To test the entire Dockerized stack on your machine:

```powershell
# Start all 4 containers in the background
docker compose up -d --build

# View container logs
docker compose logs -f

# Check container health status
docker compose ps
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1`
- Seed SuperAdmin: `superadmin@kabhyan.com` / `Kabhyan@2026`

