# Project History (Compressed)

**Last Updated:** 2026-02-05

---

## Project Overview

**Synax** - Construction Project Management System
- **Stack:** React 18 + Vite + TypeScript + Tailwind v4 / Fastify + Prisma + PostgreSQL
- **Deployment:** Docker on Contabo VPS

---

## Key Milestones

### Phase 1 (2026-01-29 to 2026-01-30)
- Initial setup: Claude Protocol, STYLE-GUIDE.md
- Frontend: UI components (Button, Input, Card, Badge, Modal, Select, etc.)
- Backend: Fastify server, Prisma ORM, JWT auth
- Database: PostgreSQL with full schema
- Authentication flow complete

### Phase 2 (2026-01-31 to 2026-02-01)
- Project management pages
- Floor/Room hierarchy
- Konva.js canvas for floor plans
- Room pins with status colors
- Issue tracking system
- Checklist templates

### Phase 3 (2026-02-02 to 2026-02-03)
- Inventory management (equipment, materials)
- Asset placement on floor/room plans
- SVG icons for asset pins
- Equipment status: IN_STOCK, PLANNED, INSTALLED
- Production deployment to Contabo

### Phase 4 (2026-02-04)
- Database reset with comprehensive seed
- Floor plan popup workflow (Room vs Asset choice)
- Asset pins as squares with SVG icons
- Import from Inventory functionality
- Existing items without pins placement

### Phase 5 (2026-02-05) - Current
- Draggable popups in FloorPlanCanvas and RoomPlanCanvas
- View/Edit and Remove from Plan for placed assets
- Import from Inventory (replaced Create New) in Room page
- Unified popup sizes across all menus
- Popup position persistence across steps
- Updated CLAUDE.md with mandatory workflow rules

---

## Architecture

### Hierarchy
```
Project → Building → Floor → Room → Asset
                  ↓
              Floor-level Assets (no room)
```

### Frontend Structure
```
frontend/src/
├── components/
│   ├── ui/            # Reusable UI components
│   ├── layout/        # Sidebar, Header, Layout
│   ├── floor-plan/    # FloorPlanCanvas (Konva)
│   ├── room-plan/     # RoomPlanCanvas (Konva)
│   └── checklists/    # Checklist components
├── pages/
│   ├── projects/
│   ├── floors/
│   ├── rooms/
│   ├── inventory/
│   └── issues/
├── services/          # API service files
└── stores/            # Zustand stores
```

### Backend Structure
```
backend/src/
├── controllers/       # Route handlers
├── middleware/        # Auth, uploads
├── prisma/           # Schema, migrations, seed
└── uploads/          # File storage
```

---

## Equipment Flow

1. **Add to Inventory**: PM adds equipment with status (IN_STOCK/PLANNED)
2. **Floor Plan**: Click → Choose Type → Import from Inventory → Place pin
3. **Room Plan**: Click → Import from Inventory → Place pin
4. **Status Change**: Equipment becomes INSTALLED when assigned

---

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@synax.gr | admin123 | ADMIN |
| pm@synax.gr | pm123456 | PM |
| tech1@synax.gr | tech123456 | TECHNICIAN |
| tech2@synax.gr | tech123456 | TECHNICIAN |

---

## Git Commits (Recent)

- `d418dca` - feat: Add draggable popups and import from inventory for room assets
- `3899422` - docs: Update memory files with production deployment session
- `939b783` - fix: Fix asset model seed upsert
- `17ceac8` - feat: Add production seed script (pure JS)
- `0043984` - fix: Move tsx to dependencies and add pre-commit hook
- `cda1230` - fix: Update all controllers for Building layer hierarchy

---

*Compressed from 27k tokens on 2026-02-05*
