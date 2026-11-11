# Deploying Kabhyan ERP on Dokploy (Separate Applications)

This step-by-step guide explains how to deploy **Kabhyan ERP** as separate, isolated services inside your Dokploy project:

1. **Database Service**: PostgreSQL (Already created in your Dokploy project)
2. **Backend API Service**: Laravel 13 (PHP 8.3-FPM + Nginx Alpine)
3. **Frontend Web Service**: Next.js 16 Standalone (Node.js 20 Alpine)

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
                                 ▼
                    ┌─────────────────────────┐
                    │ Dokploy Managed Postgres │
                    │       (Port 5432)       │
                    └─────────────────────────┘
```

---

## Service 1: PostgreSQL Database (Already Created)

Use the internal credentials from your Dokploy PostgreSQL service:
- **Internal Host**: `kabhyanerp-kabhyanerpdb-ccxmb7`
- **Internal Port**: `5432`
- **Database Name**: `kabhyan_erp`
- **User**: `kabhyan_erp_user`
- **Password**: `8mUrgpG018UVlmnS8IX4`

---

## Service 2: Backend Application

### 1. Create the Application in Dokploy
1. In your Dokploy Project, click **Create Application** (or **Add Service** ➔ **Application**).
2. Name it: `kabhyan-backend`.
3. In the **Source** section:
   - Select **GitHub** (or **Git**).
   - **Repository**: `https://github.com/dekakoushik/kabhyanERP.git`
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`
   - **Context Path**: `/backend`
   - **Dockerfile Path**: `Dockerfile`

### 2. Configure Environment Variables
Navigate to the **Environment** tab and paste:

```env
APP_NAME=KabhyanERP
APP_ENV=production
APP_KEY=base64:XQ0XmYmGZlE8wB2c3d4E5f6G7h8I9j0K1l2M3n4O5p8=
APP_DEBUG=false
APP_URL=https://api-erp.yourcompany.com

# Database Connection (Dokploy PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=kabhyanerp-kabhyanerpdb-ccxmb7
DB_PORT=5432
DB_DATABASE=kabhyan_erp
DB_USERNAME=kabhyan_erp_user
DB_PASSWORD=8mUrgpG018UVlmnS8IX4

# Application Cache & Session Driver (Use file/database if Redis not added)
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# Automatic Migrations & SuperAdmin Seeding
RUN_MIGRATIONS=true
RUN_SEEDERS=true
```

> **Note**: Replace `APP_URL` with your actual backend domain.

### 3. Domains & Port
- Go to the **Domains** tab in `kabhyan-backend`.
- **Domain**: `api-erp.yourcompany.com` (pointing to your VPS IP via DNS A Record).
- **Container Port**: `80`.
- Enable **HTTPS / SSL**.

### 4. Deploy
Click **Deploy**. Dokploy will pull the repo, build the image from `/backend/Dockerfile`, run PostgreSQL migrations, seed the SuperAdmin, and launch the Nginx + PHP-FPM webserver.

---

## Service 3: Frontend Application

### 1. Create the Application in Dokploy
1. In your Dokploy Project, click **Create Application**.
2. Name it: `kabhyan-frontend`.
3. In the **Source** section:
   - **Repository**: `https://github.com/dekakoushik/kabhyanERP.git`
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`
   - **Context Path**: `/frontend`
   - **Dockerfile Path**: `Dockerfile`

### 2. Configure Build Arguments & Environment
1. In the **Build Args** tab (or **Environment** tab):
   ```env
   NEXT_PUBLIC_API_URL=https://api-erp.yourcompany.com/api/v1
   ```
2. In the **Environment** tab:
   ```env
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_API_URL=https://api-erp.yourcompany.com/api/v1
   ```

### 3. Domains & Port
- Go to the **Domains** tab in `kabhyan-frontend`.
- **Domain**: `erp.yourcompany.com` (pointing to your VPS IP via DNS A Record).
- **Container Port**: `3000`.
- Enable **HTTPS / SSL**.

### 4. Deploy
Click **Deploy**. Dokploy will run the Next.js production build and start the standalone Node runner.

---

## Default Access Credentials
Once both services are running:
- **Portal URL**: `https://erp.yourcompany.com`
- **Default SuperAdmin Email**: `superadmin@kabhyan.com`
- **Default SuperAdmin Password**: `Kabhyan@2026`
