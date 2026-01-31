# SYNAX - Project Plan

**Version:** 1.0
**Ημερομηνία:** 2026-01-29
**Status:** Pending Approval

---

## 1. Executive Summary

Το **Synax** είναι μια εξειδικευμένη πλατφόρμα Project & Asset Management για εγκαταστάσεις ICT (δίκτυα, CCTV, WiFi). Σχεδιασμένη για τεχνικούς στο πεδίο, με offline-first λειτουργία και visual interface πάνω σε κατόψεις.

**Όνομα:** Synax (Συν- + Άξονας/Σύναξη)

---

## 2. Specifications

| Spec | Value |
|------|-------|
| Πλατφόρμα | PWA (Web + Mobile) |
| Offline | Ναι, με auto-sync |
| Χρήστες | ~50 ταυτόχρονοι |
| Roles | Admin, PM, Τεχνικός, Πελάτης |
| Hosting | Self-hosted στο cloud |
| DWG Support | Native (με conversion) |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SYNAX ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     FRONTEND (PWA)                       │    │
│  │  • React 18 + TypeScript                                 │    │
│  │  • Vite (build tool)                                     │    │
│  │  • TailwindCSS + shadcn/ui                               │    │
│  │  • Workbox (Service Worker για offline)                  │    │
│  │  • Dexie.js (IndexedDB wrapper)                          │    │
│  │  • React Query (data fetching + cache)                   │    │
│  │  • Konva.js (canvas για floor plans + pins)              │    │
│  │  • html5-qrcode (QR scanner)                             │    │
│  │  • signature_pad (digital signatures)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     BACKEND (API)                        │    │
│  │  • Node.js + Fastify                                     │    │
│  │  • TypeScript                                            │    │
│  │  • PostgreSQL (main database)                            │    │
│  │  • Prisma ORM                                            │    │
│  │  • JWT Authentication                                    │    │
│  │  • Multer (file uploads)                                 │    │
│  │  • Sharp (image processing)                              │    │
│  │  • ODA File Converter (DWG → SVG)                        │    │
│  │  • Puppeteer (report generation)                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     INFRASTRUCTURE                       │    │
│  │  • Docker + Docker Compose                               │    │
│  │  • Nginx (reverse proxy + SSL)                           │    │
│  │  • MinIO (S3-compatible file storage)                    │    │
│  │  • Redis (caching + sessions)                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type safety |
| Vite | Build tool |
| TailwindCSS | Styling |
| shadcn/ui | UI Components |
| Workbox | Service Worker / PWA |
| Dexie.js | IndexedDB wrapper |
| React Query | Data fetching + cache |
| Konva.js | Canvas για floor plans |
| html5-qrcode | QR code scanning |
| signature_pad | Digital signatures |
| react-pdf | PDF viewing |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Fastify | Web framework |
| TypeScript | Type safety |
| Prisma | ORM |
| PostgreSQL | Database |
| JWT | Authentication |
| Multer | File uploads |
| Sharp | Image processing |
| Puppeteer | PDF generation |
| ODA SDK | DWG conversion |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Orchestration |
| Nginx | Reverse proxy |
| MinIO | Object storage |
| Redis | Caching |
| Let's Encrypt | SSL |

---

## 5. Database Schema

### Core Entities

```sql
-- Users & Auth
Users (id, email, password_hash, name, role, created_at)
Sessions (id, user_id, token, expires_at)

-- Project Hierarchy
Projects (id, name, client_name, location, status, created_by, created_at)
ProjectMembers (project_id, user_id, role)

Floors (id, project_id, name, level, floorplan_url, floorplan_type)
Rooms (id, floor_id, name, type, pin_x, pin_y, status)

-- Assets & Equipment
Assets (id, room_id, type, model, serial_number, mac_address, status, installed_by, installed_at)
AssetTypes (id, name, icon, checklist_template)

-- Checklists
Checklists (id, asset_id, type, status, assigned_to)
ChecklistItems (id, checklist_id, name, completed, completed_by, completed_at)
ChecklistPhotos (id, checklist_item_id, photo_url, caption, uploaded_at)

-- Issues
Issues (id, project_id, room_id, title, description, caused_by, status, priority, created_by, created_at)
IssuePhotos (id, issue_id, photo_url)
IssueComments (id, issue_id, user_id, comment, created_at)

-- Inventory
InventoryItems (id, project_id, item_type, description, quantity_received, quantity_used)
InventoryLogs (id, item_id, action, quantity, serial_numbers[], user_id, created_at)

-- Signatures
Signatures (id, project_id, room_id, type, signature_data, signed_by_name, signed_at)

-- Sync
SyncQueue (id, user_id, entity_type, entity_id, action, data, created_at, synced_at)
```

### Entity Relationships

```
Users ─────┬──── Projects (many-to-many via ProjectMembers)
           │
Projects ──┼──── Floors (one-to-many)
           │        │
           │     Rooms (one-to-many)
           │        │
           │     Assets (one-to-many)
           │        │
           │     Checklists (one-to-many)
           │        │
           │     ChecklistItems + Photos
           │
           ├──── Issues (one-to-many)
           │
           ├──── Inventory (one-to-many)
           │
           └──── Signatures (one-to-many)
```

---

## 6. Modules

### Module 1: Authentication & Authorization
- Login/Logout
- JWT tokens με refresh
- Role-based access control (Admin, PM, Technician, Client)
- Password reset

### Module 2: Project Management
- Create/Edit/Archive projects
- Assign team members
- Project dashboard με overview
- Client information

### Module 3: Floor Management
- Upload floor plans (PDF, DWG)
- DWG → SVG conversion
- Floor listing και navigation
- Zoom/Pan controls

### Module 4: Visual Floor Plan Viewer
- Render floor plan ως background
- Place pins για rooms/points
- Click pin → open room details
- Color-coded status pins
- Pan, zoom, rotate

### Module 5: Room/Point Management
- CRUD rooms
- Position via drag-drop pin
- Room status tracking
- Room type categorization

### Module 6: Asset Management
- Add equipment στα rooms
- Serial number / MAC address tracking
- QR code generation & scanning
- Asset status lifecycle
- Asset search & filter

### Module 7: Installation Checklists
- Dynamic checklist per asset type
- Stages: Cabling → Equipment → Config → Documentation
- Item completion tracking
- Photo requirements per item
- Technician assignment

### Module 8: Photo Documentation
- Camera capture (mobile)
- File upload (desktop)
- Image compression
- Photo gallery per item
- Caption/annotation

### Module 9: Issue/Snag Tracking
- Create issue with location
- Assign cause (third party)
- Priority levels
- Status workflow (Open → In Progress → Resolved)
- Photo evidence
- Comments thread

### Module 10: Inventory Management
- Stock received per project
- Stock consumed tracking
- Serial number logging
- Remaining stock calculation
- Low stock alerts

### Module 11: QR Code Scanner
- Scan equipment QR/barcode
- Auto-lookup asset info
- Quick access to asset details
- Scan to add new asset

### Module 12: Digital Signatures
- Canvas signature capture
- Sign-off per room/stage
- Signer name recording
- Timestamp
- Export for reports

### Module 13: Automated Labels
- Cable label generation
- Rack label generation
- QR code inclusion
- PDF export for printing
- Batch generation

### Module 14: Reporting Engine

#### Internal Report
- Technician activity logs
- Hours tracking
- Technical measurements
- Material usage
- Budget vs actual
- Issues summary

#### External Report (Client)
- Executive dashboard
- Completion percentages
- As-built documentation
- Dependency report
- Digital sign-offs

### Module 15: Offline & Sync
- Service Worker registration
- IndexedDB schema
- Offline data access
- Background sync
- Conflict resolution
- Sync status indicator

---

## 7. Offline-First Strategy

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ONLINE MODE                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │  User   │───▶│ IndexDB │───▶│ Server  │                  │
│  │ Action  │    │ (cache) │    │  (API)  │                  │
│  └─────────┘    └─────────┘    └─────────┘                  │
│                      │              │                        │
│                      └──────────────┘                        │
│                         sync both                            │
│                                                              │
│  OFFLINE MODE                                                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │  User   │───▶│ IndexDB │    │ Pending │                  │
│  │ Action  │    │ (write) │───▶│  Queue  │                  │
│  └─────────┘    └─────────┘    └─────────┘                  │
│                                     │                        │
│  BACK ONLINE                        ▼                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │  Sync   │◀───│  Queue  │───▶│ Server  │                  │
│  │ Worker  │    │ Process │    │  (API)  │                  │
│  └─────────┘    └─────────┘    └─────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### IndexedDB Schema (Dexie.js)

```typescript
// db.ts
const db = new Dexie('SynaxDB');

db.version(1).stores({
  projects: '++id, name, status, syncStatus',
  floors: '++id, projectId, name, syncStatus',
  rooms: '++id, floorId, name, syncStatus',
  assets: '++id, roomId, serialNumber, syncStatus',
  checklists: '++id, assetId, status, syncStatus',
  checklistItems: '++id, checklistId, syncStatus',
  photos: '++id, checklistItemId, blob, syncStatus',
  issues: '++id, projectId, roomId, syncStatus',
  inventory: '++id, projectId, syncStatus',
  signatures: '++id, projectId, syncStatus',
  syncQueue: '++id, entityType, entityId, action, timestamp'
});
```

### Sync Strategy
1. **Optimistic Updates**: UI updates immediately
2. **Queue Actions**: Changes queued for sync
3. **Background Sync**: Service Worker syncs when online
4. **Conflict Resolution**: Last-write-wins με timestamp
5. **Retry Logic**: Exponential backoff για failures

---

## 8. Project Structure

```
synax/
├── frontend/                      # React PWA Application
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── sw.js                  # Service Worker
│   │   └── icons/                 # App icons
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # shadcn components
│   │   │   ├── layout/            # Layout components
│   │   │   ├── floor-plan/        # Floor plan viewer
│   │   │   ├── checklists/        # Checklist components
│   │   │   ├── photos/            # Photo components
│   │   │   └── signatures/        # Signature pad
│   │   ├── pages/                 # Route pages
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── projects/          # Project pages
│   │   │   ├── floors/            # Floor pages
│   │   │   ├── assets/            # Asset pages
│   │   │   ├── issues/            # Issue pages
│   │   │   ├── inventory/         # Inventory pages
│   │   │   └── reports/           # Report pages
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useOffline.ts
│   │   │   ├── useSync.ts
│   │   │   └── useCamera.ts
│   │   ├── services/              # API service layer
│   │   │   ├── api.ts             # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── project.service.ts
│   │   │   └── sync.service.ts
│   │   ├── stores/                # State management
│   │   │   ├── authStore.ts
│   │   │   └── syncStore.ts
│   │   ├── db/                    # IndexedDB (Dexie)
│   │   │   ├── database.ts
│   │   │   ├── models/
│   │   │   └── sync.ts
│   │   ├── utils/                 # Helper functions
│   │   ├── types/                 # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                       # Node.js API Server
│   ├── src/
│   │   ├── controllers/           # Route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── floor.controller.ts
│   │   │   ├── asset.controller.ts
│   │   │   ├── checklist.controller.ts
│   │   │   ├── issue.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   └── sync.controller.ts
│   │   ├── services/              # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── dwg.service.ts     # DWG conversion
│   │   │   ├── photo.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── label.service.ts
│   │   │   └── sync.service.ts
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   ├── utils/                 # Helper functions
│   │   ├── types/                 # TypeScript types
│   │   ├── config/                # Configuration
│   │   ├── app.ts                 # Express app setup
│   │   └── server.ts              # Entry point
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # DB migrations
│   │   └── seed.ts                # Seed data
│   ├── reports/                   # Report templates
│   │   ├── internal.template.html
│   │   └── client.template.html
│   ├── tsconfig.json
│   └── package.json
│
├── docker/                        # Docker configurations
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml             # Full stack orchestration
├── docker-compose.dev.yml         # Development setup
├── .env.example                   # Environment variables
├── .gitignore
├── README.md
└── package.json                   # Monorepo scripts
```

---

## 9. API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:id/dashboard
```

### Floors
```
GET    /api/projects/:projectId/floors
POST   /api/projects/:projectId/floors
GET    /api/floors/:id
PUT    /api/floors/:id
DELETE /api/floors/:id
POST   /api/floors/:id/upload-plan
```

### Rooms
```
GET    /api/floors/:floorId/rooms
POST   /api/floors/:floorId/rooms
GET    /api/rooms/:id
PUT    /api/rooms/:id
DELETE /api/rooms/:id
```

### Assets
```
GET    /api/rooms/:roomId/assets
POST   /api/rooms/:roomId/assets
GET    /api/assets/:id
PUT    /api/assets/:id
DELETE /api/assets/:id
GET    /api/assets/search?serial=X
GET    /api/assets/:id/qr
```

### Checklists
```
GET    /api/assets/:assetId/checklist
PUT    /api/checklists/:id
POST   /api/checklist-items/:id/complete
POST   /api/checklist-items/:id/photo
```

### Issues
```
GET    /api/projects/:projectId/issues
POST   /api/projects/:projectId/issues
GET    /api/issues/:id
PUT    /api/issues/:id
POST   /api/issues/:id/comment
POST   /api/issues/:id/photo
```

### Inventory
```
GET    /api/projects/:projectId/inventory
POST   /api/projects/:projectId/inventory
PUT    /api/inventory/:id
POST   /api/inventory/:id/consume
```

### Signatures
```
POST   /api/projects/:projectId/signatures
GET    /api/signatures/:id
```

### Reports
```
GET    /api/projects/:projectId/reports/internal
GET    /api/projects/:projectId/reports/client
GET    /api/projects/:projectId/reports/as-built
```

### Labels
```
POST   /api/projects/:projectId/labels/cables
POST   /api/projects/:projectId/labels/racks
```

### Sync
```
POST   /api/sync/push
GET    /api/sync/pull?since=timestamp
GET    /api/sync/status
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Goals:** Project setup, core infrastructure, basic CRUD

**Tasks:**
- [ ] Initialize monorepo structure
- [ ] Setup frontend (React + Vite + TypeScript)
- [ ] Setup backend (Node.js + Fastify + TypeScript)
- [ ] Configure Prisma + PostgreSQL
- [ ] Setup Docker + docker-compose
- [ ] Implement authentication (JWT)
- [ ] Create user management
- [ ] Basic Projects CRUD
- [ ] Basic Floors CRUD
- [ ] File upload infrastructure (MinIO)
- [ ] Basic API documentation

**Deliverables:**
- Working dev environment
- Auth system
- Project & Floor management
- File upload working

---

### Phase 2: Core Features (Weeks 4-6)

**Goals:** Floor plan viewer, assets, checklists

**Tasks:**
- [ ] PDF floor plan viewer
- [ ] DWG → SVG conversion pipeline
- [ ] Interactive canvas (Konva.js)
- [ ] Pin placement system
- [ ] Room management with pins
- [ ] Asset CRUD
- [ ] Asset types & templates
- [ ] Checklist system
- [ ] Checklist item completion
- [ ] Photo upload για checklists

**Deliverables:**
- Visual floor plan interface
- Asset tracking working
- Checklists functional

---

### Phase 3: Field Features (Weeks 7-9)

**Goals:** PWA, offline, mobile features

**Tasks:**
- [ ] PWA manifest
- [ ] Service Worker setup (Workbox)
- [ ] IndexedDB schema (Dexie.js)
- [ ] Offline data access
- [ ] Sync queue implementation
- [ ] Background sync
- [ ] Conflict resolution
- [ ] QR code scanner integration
- [ ] Camera capture (mobile)
- [ ] Issue tracking module
- [ ] Issue photo evidence

**Deliverables:**
- Full offline functionality
- QR scanning working
- Issue tracking complete

---

### Phase 4: Reporting & Polish (Weeks 10-12)

**Goals:** Reports, signatures, final features

**Tasks:**
- [ ] Inventory management
- [ ] Stock tracking
- [ ] Digital signature component
- [ ] Signature capture & storage
- [ ] Internal report template
- [ ] Client report template
- [ ] PDF report generation
- [ ] As-built documentation export
- [ ] Label generation (cables/racks)
- [ ] Dashboard analytics
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Documentation

**Deliverables:**
- Complete reporting system
- Digital signatures
- Label generation
- Production-ready application

---

## 11. User Roles & Permissions

| Permission | Admin | PM | Technician | Client |
|------------|-------|-----|------------|--------|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ❌ | ❌ |
| Edit projects | ✅ | ✅ | ❌ | ❌ |
| View projects | ✅ | ✅ | ✅ | ✅ (assigned) |
| Manage floors | ✅ | ✅ | ❌ | ❌ |
| Add/edit assets | ✅ | ✅ | ✅ | ❌ |
| Complete checklists | ✅ | ✅ | ✅ | ❌ |
| Upload photos | ✅ | ✅ | ✅ | ❌ |
| Create issues | ✅ | ✅ | ✅ | ✅ |
| Manage inventory | ✅ | ✅ | ✅ | ❌ |
| Sign-off | ✅ | ✅ | ❌ | ✅ |
| View internal reports | ✅ | ✅ | ❌ | ❌ |
| View client reports | ✅ | ✅ | ❌ | ✅ |
| Generate labels | ✅ | ✅ | ✅ | ❌ |

---

## 12. Security Considerations

- **Authentication:** JWT με short-lived access tokens + refresh tokens
- **Password:** bcrypt hashing, minimum complexity requirements
- **API:** Rate limiting, input validation, SQL injection prevention (Prisma)
- **Files:** Virus scanning, file type validation, size limits
- **HTTPS:** Mandatory SSL/TLS
- **CORS:** Restricted origins
- **Audit:** Action logging για sensitive operations

---

## 13. Performance Targets

| Metric | Target |
|--------|--------|
| Page load (cached) | < 1s |
| API response | < 200ms |
| Offline switch | Instant |
| Sync (100 items) | < 5s |
| Photo upload | < 3s |
| Report generation | < 10s |
| Concurrent users | 50+ |

---

## 14. Success Criteria

- [ ] Τεχνικός μπορεί να δουλέψει πλήρως offline
- [ ] Sync γίνεται αυτόματα χωρίς data loss
- [ ] Floor plans φορτώνουν και είναι interactive
- [ ] DWG files μετατρέπονται σωστά
- [ ] QR scanner λειτουργεί σε mobile
- [ ] Photos ανεβαίνουν και συμπιέζονται
- [ ] Reports εξάγονται σε PDF
- [ ] Digital signatures αποθηκεύονται
- [ ] Labels παράγονται σωστά
- [ ] 50 χρήστες ταυτόχρονα χωρίς lag

---

*Document Version: 1.0*
*Last Updated: 2026-01-29*
*Status: Awaiting Approval*
