# Synax - Dokploy Deployment Guide

## Prerequisites

- Contabo Server με Dokploy εγκατεστημένο
- Domain που δείχνει στον server (A record)
- GitHub repository: `i-nouchakis/synax-project-os`

---

## Step 1: Δημιουργία Project στο Dokploy

1. Login στο Dokploy: `http://YOUR_SERVER_IP:3000`
2. Κάνε click **Projects** → **Create Project**
3. Ονομασία: `Synax Production`

---

## Step 2: Δημιουργία Compose Service

1. Στο project, click **+ Create Service**
2. Επέλεξε **Compose**
3. Συμπλήρωσε:

| Field | Value |
|-------|-------|
| Service Name | `synax-app` |
| Provider | GitHub |
| GitHub Account | Επέλεξε το account |
| Repository | `synax-project-os` |
| Branch | `main` |
| **Compose Path** | `./docker-compose.prod.yml` |
| Trigger Type | On Push |
| Autodeploy | ✅ Enabled |

4. Click **Save**

---

## Step 3: Environment Variables

Πήγαινε στο tab **Environment** και πρόσθεσε:

```env
# Domain
DOMAIN=synax.yourdomain.com
STORAGE_PUBLIC_ENDPOINT=storage.yourdomain.com

# Database
POSTGRES_USER=synax
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=synax_db

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_generated_refresh_secret_32_chars_min

# MinIO
MINIO_ACCESS_KEY=synaxadmin
MINIO_SECRET_KEY=your_minio_secret_key_here
```

**IMPORTANT:** Αντικατέστησε όλα τα placeholder values με πραγματικά!

---

## Step 4: Domain Setup

### A. DNS Records

Στο domain provider σου, πρόσθεσε:

| Type | Name | Value |
|------|------|-------|
| A | synax | YOUR_SERVER_IP |
| A | storage | YOUR_SERVER_IP (optional) |

### B. Dokploy Domain Configuration

1. Πήγαινε στο tab **Domains**
2. Click **Add Domain**
3. Domain: `synax.yourdomain.com`
4. Port: `80` (για το frontend)
5. Enable SSL: ✅

---

## Step 5: Network Setup

Το Dokploy χρειάζεται το `dokploy-network`. Συνήθως υπάρχει ήδη.

Αν δεν υπάρχει, τρέξε στον server:
```bash
docker network create dokploy-network
```

---

## Step 6: Deploy

1. Πήγαινε στο tab **General**
2. Click **Deploy**
3. Παρακολούθησε τα logs στο tab **Deployments**

---

## Step 7: Database Migration

Μετά το πρώτο deploy, πρέπει να τρέξεις τα migrations:

1. Πήγαινε στο tab **General**
2. Click **Open Terminal**
3. Επέλεξε container: `synax-backend`
4. Τρέξε:
```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## Troubleshooting

### Error: "dokploy-network not found"
```bash
docker network create dokploy-network
```

### Error: "Port 80 already in use"
Το Traefik του Dokploy χρησιμοποιεί τα ports. Βεβαιώσου ότι το compose χρησιμοποιεί τα Traefik labels.

### Database connection error
Έλεγξε ότι:
1. Τα environment variables είναι σωστά
2. Ο postgres container είναι healthy
3. Το DATABASE_URL είναι σωστό

### Logs
```bash
# Δες logs όλων των containers
docker compose -f docker-compose.prod.yml logs -f

# Logs συγκεκριμένου container
docker logs synax-backend -f
```

---

## URLs μετά το Deploy

| Service | URL |
|---------|-----|
| Frontend | https://synax.yourdomain.com |
| API | https://synax.yourdomain.com/api |
| MinIO Console | https://storage.yourdomain.com (port 9001) |

---

## Default Credentials

Μετά το seed, μπορείς να κάνεις login με:

| Email | Password | Role |
|-------|----------|------|
| admin@synax.app | admin123 | ADMIN |
| pm@synax.app | pm123456 | PM |
| tech@synax.app | tech123456 | TECHNICIAN |

**IMPORTANT:** Άλλαξε τους κωδικούς αμέσως μετά το πρώτο login!

---

## Maintenance

### Backup Database
```bash
docker exec synax-postgres pg_dump -U synax synax_db > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i synax-postgres psql -U synax synax_db
```

### Update Application
Απλά push στο main branch - το Dokploy θα κάνει auto-deploy.

---

*Last updated: 2026-02-01*
