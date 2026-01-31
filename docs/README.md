# Synax Documentation

**Version:** 1.0.0
**Last Updated:** 2026-01-30

---

## Overview

**Synax** is a comprehensive Project & Asset Management platform specifically designed for ICT installations (networks, CCTV, WiFi systems, digital signage). It enables field technicians and project managers to effectively manage technical installation projects with features including:

- **Offline-First Architecture** - Work without internet, sync when connected
- **Visual Floor Plans** - Interactive Konva.js canvas with pin positioning
- **Asset Tracking** - Serial numbers, MAC addresses, installation status
- **Checklists** - Quality assurance with photo evidence
- **Issue Management** - Track and resolve installation problems
- **Inventory Control** - Stock management with movement logs
- **Comprehensive Reporting** - PDF export for clients and internal teams

---

## Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | Technical architecture, stack, and system design |
| [Database](./DATABASE.md) | Database schema, models, and relationships |
| [API Reference](./API.md) | Complete API endpoints documentation |
| [Features](./FEATURES.md) | Detailed feature descriptions |
| [Workflows](./WORKFLOWS.md) | Common workflows and use cases |

### User Guides

| Guide | Target Audience |
|-------|-----------------|
| [Admin Guide](./user-guides/ADMIN.md) | System administrators |
| [PM Guide](./user-guides/PM.md) | Project managers |
| [Technician Guide](./user-guides/TECHNICIAN.md) | Field technicians |
| [Client Guide](./user-guides/CLIENT.md) | Client users (read-only) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd synax

# Install dependencies
npm install

# Start Docker services
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
cd backend && npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development servers
npm run dev:backend  # http://localhost:3002
npm run dev:frontend # http://localhost:5173
```

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@synax.app | admin123 | ADMIN |
| pm@synax.app | pm123456 | PM |
| tech@synax.app | tech123456 | TECHNICIAN |

---

## Project Structure

```
synax/
├── docs/                    # Documentation (you are here)
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── FEATURES.md
│   ├── WORKFLOWS.md
│   └── user-guides/
│       ├── ADMIN.md
│       ├── PM.md
│       ├── TECHNICIAN.md
│       └── CLIENT.md
│
├── backend/                 # Fastify + Prisma backend
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   └── server.ts
│   └── prisma/
│       ├── schema.prisma    # Database models
│       └── migrations/
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Route pages
│   │   ├── components/      # UI components
│   │   ├── services/        # API clients
│   │   └── stores/          # Zustand state
│   └── public/
│
├── .claude/                 # AI assistant context
├── docker-compose.dev.yml   # Local development
└── package.json             # Monorepo root
```

---

## User Roles Overview

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **ADMIN** | System administrator | Full access, user management, settings |
| **PM** | Project manager | Project/floor/room management, reports |
| **TECHNICIAN** | Field technician | Asset installation, checklists, issues |
| **CLIENT** | Customer | View progress, client reports, create issues |

See [User Guides](./user-guides/) for detailed role-specific documentation.

---

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS v4
- React Query (data fetching)
- Zustand (state management)
- Konva.js (canvas rendering)
- React Router v6

### Backend
- Node.js + Fastify
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod (validation)

### Infrastructure
- Docker & Docker Compose
- MinIO (S3 object storage)
- Puppeteer (PDF generation)

---

## Support

For issues or questions:
1. Check the [FAQ](./user-guides/FAQ.md)
2. Review the [Workflows](./WORKFLOWS.md) documentation
3. Contact your system administrator

---

*Synax - Professional ICT Installation Management*
