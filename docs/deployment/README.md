# Synax - Production Deployment Guide

**Target:** Contabo Server με Dokploy + Traefik
**Date:** 2026-01-31

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │            Contabo Server               │
                    │                                         │
    Internet        │  ┌─────────┐                           │
        │           │  │ Traefik │ ← SSL/Let's Encrypt       │
        └──────────────► :443    │                           │
                    │  └────┬────┘                           │
                    │       │                                 │
         ┌──────────┼───────┼──────────┐                     │
         │          │       │          │                     │
         ▼          │       ▼          ▼                     │
    ┌─────────┐     │  ┌─────────┐  ┌─────────┐             │
    │Frontend │     │  │ Backend │  │  MinIO  │             │
    │ (nginx) │     │  │ (Node)  │  │ Console │             │
    │  :80    │     │  │  :3002  │  │  :9001  │             │
    └─────────┘     │  └────┬────┘  └────┬────┘             │
                    │       │            │                   │
                    │       ▼            ▼                   │
                    │  ┌─────────┐  ┌─────────┐             │
                    │  │ Postgres│  │  MinIO  │             │
                    │  │  :5432  │  │  :9000  │             │
                    │  └─────────┘  └─────────┘             │
                    │       │                                │
                    │       ▼                                │
                    │  ┌─────────┐                           │
                    │  │  Redis  │                           │
                    │  │  :6379  │                           │
                    │  └─────────┘                           │
                    │                                         │
                    └─────────────────────────────────────────┘
```

---

## Services

| Service | Image | Port | Public |
|---------|-------|------|--------|
| Frontend | synax-frontend | 80 | Yes (synax.domain.com) |
| Backend | synax-backend | 3002 | Yes (/api) |
| PostgreSQL | postgres:16-alpine | 5432 | No |
| Redis | redis:7-alpine | 6379 | No |
| MinIO | minio/minio | 9000, 9001 | Optional |

---

## Domain Setup

**Προτεινόμενο:**
- `synax.yourdomain.com` → Frontend + Backend API
- `storage.yourdomain.com` → MinIO Console (optional)

**Routing:**
- `/` → Frontend (nginx)
- `/api/*` → Backend (Node.js)

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL=postgresql://synax:PASSWORD@postgres:5432/synax_db?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Redis
REDIS_URL=redis://redis:6379

# MinIO Storage
STORAGE_ENDPOINT=minio
STORAGE_PORT=9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=your-minio-secret-key
STORAGE_BUCKET=synax-files
STORAGE_USE_SSL=false
STORAGE_PUBLIC_ENDPOINT=storage.yourdomain.com
```

### Frontend (.env)
```env
VITE_API_URL=/api
```

---

## Deployment Steps

### 1. Dokploy Project Setup
- [ ] Create new project "Synax" in Dokploy
- [ ] Connect GitHub repo: `i-nouchakis/synax-project-os`
- [ ] Set branch: `main`

### 2. Database Setup
- [ ] Add PostgreSQL service in Dokploy
- [ ] Set credentials
- [ ] Note the internal hostname

### 3. Redis Setup
- [ ] Add Redis service in Dokploy
- [ ] Note the internal hostname

### 4. MinIO Setup
- [ ] Add MinIO service in Dokploy
- [ ] Configure access keys
- [ ] Set up bucket policy (public read)

### 5. Backend Deployment
- [ ] Create Dockerfile.prod (if needed)
- [ ] Set environment variables
- [ ] Configure Traefik labels for /api routing
- [ ] Run Prisma migrations

### 6. Frontend Deployment
- [ ] Create Dockerfile.prod with nginx
- [ ] Set VITE_API_URL
- [ ] Configure Traefik labels

### 7. SSL/Domain
- [ ] Point domain DNS to Contabo IP
- [ ] Traefik auto-generates SSL

---

## Files Created

```
synax/
├── docker-compose.prod.yml      # Main compose file for Dokploy
├── .env.prod.example            # Environment variables template
├── frontend/
│   ├── Dockerfile.prod          # Production build (nginx)
│   └── nginx.conf               # Nginx config with API proxy
└── backend/
    └── Dockerfile.prod          # Production build (Node.js)
```

---

## Status Log

| Time | Action | Status |
|------|--------|--------|
| 2026-01-31 | Created production Dockerfiles | ✅ |
| 2026-01-31 | Created docker-compose.prod.yml | ✅ |
| 2026-01-31 | Created .env.prod.example | ✅ |

---

## Notes

(θα προστίθενται notes κατά τη διάρκεια του setup)

---
