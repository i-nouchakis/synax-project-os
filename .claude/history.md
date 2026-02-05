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
- **Settings Interface section** with floor plan visibility toggle
- UI Store (Zustand + persist) for user preferences
- **Checklist Templates** drag & drop reordering + accordion behavior
- **Global Search** in header (context-aware, replaced local search)
- **Custom Date Picker** with English locale and dark theme

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

- `95fc493` - feat: Add global search and custom date picker with English locale
- `170a04a` - feat: Add drag & drop reordering and accordion behavior to Checklist Templates
- `7ebb96f` - fix: Remove unused assetSearchQuery state from RoomPlanCanvas
- `da78485` - fix: Remove unused code and fix null type for pinX/pinY
- `0f0a698` - fix: Resolve TypeScript strict mode errors for production build
- `aa5b380` - feat: Major enhancements to Inventory, Checklists, and UI components
- `8b9a893` - feat: Add Settings toggle for floor plan visibility preference
- `ce7c9eb` - fix: Keep IN_STOCK assets available in project inventory
- `7be53f0` - feat: Comprehensive seed, import modal, workflow rules
- `d418dca` - feat: Add draggable popups and import from inventory for room assets

---

*Compressed from 27k tokens on 2026-02-05*
