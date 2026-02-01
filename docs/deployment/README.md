# Synax - Production Deployment Guide

**Target:** Contabo Server με Dokploy + Traefik
**Date:** 2026-02-01

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
    │ (nginx) │     │  │ (Node)  │  │   API   │             │
    │  :80    │     │  │  :3002  │  │  :9000  │             │
    └─────────┘     │  └────┬────┘  └────┬────┘             │
                    │       │            │                   │
                    │       ▼            ▼                   │
                    │  ┌─────────┐  ┌─────────┐             │
                    │  │ Postgres│  │  MinIO  │             │
                    │  │  :5432  │  │  Data   │             │
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

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/i-nouchakis/synax-project-os.git
cd synax-project-os
```

### 2. Configure Environment
```bash
cp .env.prod.example .env.prod
# Edit .env.prod with your values
```

### 3. Deploy with Dokploy
See [DOKPLOY_SETUP.md](./DOKPLOY_SETUP.md) for detailed instructions.

---

## Files

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production compose file |
| `.env.prod.example` | Environment template |
| `frontend/Dockerfile.prod` | Frontend production build |
| `backend/Dockerfile.prod` | Backend production build |
| `frontend/nginx.conf` | Nginx config with API proxy |

---

## Services

| Service | Image | Port | Public |
|---------|-------|------|--------|
| Frontend | synax-frontend | 80 | Yes (synax.domain.com) |
| Backend | synax-backend | 3002 | Via nginx proxy (/api) |
| PostgreSQL | postgres:16-alpine | 5432 | No |
| Redis | redis:7-alpine | 6379 | No |
| MinIO | minio/minio | 9000, 9001 | Optional |

---

## Environment Variables

```env
# Domain (without https://)
DOMAIN=synax.yourdomain.com
STORAGE_PUBLIC_ENDPOINT=storage.yourdomain.com

# PostgreSQL
POSTGRES_USER=synax
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=synax_db

# JWT Secrets (min 32 characters each)
JWT_SECRET=generate_with_openssl_rand_base64_32
JWT_REFRESH_SECRET=generate_another_secret_here

# MinIO Storage
MINIO_ACCESS_KEY=synaxadmin
MINIO_SECRET_KEY=your_minio_secret
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

---

## Dokploy Configuration

| Setting | Value |
|---------|-------|
| Project Name | Synax Production |
| Service Type | Compose |
| Provider | GitHub |
| Repository | i-nouchakis/synax-project-os |
| Branch | main |
| **Compose Path** | `./docker-compose.prod.yml` |
| Trigger Type | On Push |
| Autodeploy | Enabled |

⚠️ **IMPORTANT:** Make sure Compose Path is `./docker-compose.prod.yml`

---

## Post-Deployment

### Run Database Migrations
```bash
# In Dokploy terminal for synax-backend container:
npx prisma migrate deploy
npx prisma db seed
```

### Default Users
| Email | Password | Role |
|-------|----------|------|
| admin@synax.app | admin123 | ADMIN |
| pm@synax.app | pm123456 | PM |
| tech@synax.app | tech123456 | TECHNICIAN |

---

## Troubleshooting

### dokploy-network not found
```bash
docker network create dokploy-network
```

### View Logs
```bash
docker logs synax-backend -f
docker logs synax-frontend -f
docker logs synax-postgres -f
```

### Database Connection Issues
1. Check POSTGRES_PASSWORD is set correctly
2. Wait for postgres healthcheck to pass
3. Verify DATABASE_URL format

### Health Check
```bash
curl http://localhost:3002/api/health
```

---

## Maintenance

### Backup Database
```bash
docker exec synax-postgres pg_dump -U synax synax_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i synax-postgres psql -U synax synax_db
```

### Update Application
Just push to main branch - Dokploy will auto-deploy.

---

## Documentation

- [DOKPLOY_SETUP.md](./DOKPLOY_SETUP.md) - Detailed Dokploy setup guide
- [../ARCHITECTURE.md](../ARCHITECTURE.md) - Technical architecture
- [../API.md](../API.md) - API reference

---

*Last Updated: 2026-02-01*
