# Synax Architecture

## System Overview

Synax follows a modern client-server architecture with a React single-page application (SPA) frontend communicating with a Fastify REST API backend, backed by PostgreSQL for data persistence and MinIO for file storage.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │   Zustand   │  │     React Query         │  │
│  │   Router    │  │   Stores    │  │     (Cache)             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │                    API Client (fetch)                      │  │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────│─────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼─────────────────────────────────────┐
│                          Backend                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      Fastify Server                          │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐   │ │
│  │  │   Auth   │  │  Controllers │  │    Middleware       │   │ │
│  │  │Middleware│  │   (Routes)   │  │   (Validation)      │   │ │
│  │  └──────────┘  └──────────────┘  └─────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │                    Services Layer                          │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │  Prisma  │  │   Storage    │  │    PDF Service      │  │  │
│  │  │   ORM    │  │   Service    │  │   (Puppeteer)       │  │  │
│  │  └──────────┘  └──────────────┘  └─────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────│─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                       Data Layer                                  │
│  ┌─────────────────────┐        ┌─────────────────────────────┐  │
│  │    PostgreSQL       │        │         MinIO               │  │
│  │    (Database)       │        │    (File Storage)           │  │
│  └─────────────────────┘        └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Details

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 7.x | Build tool & dev server |
| TailwindCSS | 4.x | Styling |
| React Router | 6.x | Client-side routing |
| React Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| Konva.js | 9.x | Canvas rendering (floor plans) |
| Sonner | - | Toast notifications |
| Lucide React | - | Icons |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Fastify | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM & migrations |
| PostgreSQL | 15+ | Database |
| Zod | 3.x | Schema validation |
| bcrypt | - | Password hashing |
| jsonwebtoken | - | JWT auth tokens |
| Sharp | - | Image processing |
| Puppeteer | - | PDF generation |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local orchestration |
| MinIO | S3-compatible object storage |
| Nginx | Reverse proxy (production) |

---

## Application Layers

### 1. Presentation Layer (Frontend)

The React frontend is organized into:

```
frontend/src/
├── pages/              # Route components
│   ├── auth/           # Login page
│   ├── dashboard/      # Dashboard
│   ├── projects/       # Project list & detail
│   ├── floors/         # Floor list & detail
│   ├── rooms/          # Room detail
│   ├── assets/         # Asset list & detail
│   ├── checklists/     # Checklist management
│   ├── issues/         # Issue tracking
│   ├── inventory/      # Inventory management
│   ├── reports/        # Report generation
│   ├── users/          # User management
│   ├── settings/       # Settings
│   └── manual/         # User manual
│
├── components/
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components
│   ├── auth/           # Auth-related components
│   ├── floor-plan/     # Konva canvas components
│   ├── room-plan/      # Room floor plan
│   └── checklists/     # Checklist components
│
├── services/           # API client services
├── stores/             # Zustand stores
├── lib/                # Utilities
└── types/              # TypeScript types
```

### 2. API Layer (Backend Controllers)

Controllers handle HTTP requests and delegate to services:

```
backend/src/controllers/
├── auth.controller.ts       # Authentication endpoints
├── user.controller.ts       # User management
├── project.controller.ts    # Project CRUD
├── floor.controller.ts      # Floor & room management
├── room.controller.ts       # Room operations
├── asset.controller.ts      # Asset management
├── checklist.controller.ts  # Checklist operations
├── issue.controller.ts      # Issue tracking
├── inventory.controller.ts  # Inventory management
├── report.controller.ts     # Report generation
├── dashboard.controller.ts  # Dashboard data
├── upload.controller.ts     # File uploads
└── settings.controller.ts   # System settings
```

### 3. Service Layer

Business logic and external integrations:

```
backend/src/services/
├── storage.service.ts   # MinIO file operations
└── pdf.service.ts       # Puppeteer PDF generation
```

### 4. Data Layer (Prisma ORM)

Database access through Prisma:

```
backend/prisma/
├── schema.prisma        # Model definitions
├── migrations/          # Migration history
├── seed.ts              # Basic seed data
└── seed-realistic.ts    # Demo data
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐     1. POST /auth/login      ┌─────────┐
│ Client  │ ─────────────────────────────▶│ Backend │
│         │     {email, password}         │         │
└─────────┘                               └────┬────┘
                                               │
                                               │ 2. Validate credentials
                                               │    Hash comparison
                                               │
┌─────────┐     3. Return JWT token      ┌────▼────┐
│ Client  │ ◀─────────────────────────────│ Backend │
│         │     {token, user}             │         │
└────┬────┘                               └─────────┘
     │
     │ 4. Store token (localStorage)
     │
┌────▼────┐     5. API requests with     ┌─────────┐
│ Client  │ ─────────────────────────────▶│ Backend │
│         │    Authorization: Bearer xxx  │         │
└─────────┘                               └────┬────┘
                                               │
                                               │ 6. Verify JWT
                                               │    Extract user
                                               │
┌─────────┐     7. Return data           ┌────▼────┐
│ Client  │ ◀─────────────────────────────│ Backend │
│         │                               │         │
└─────────┘                               └─────────┘
```

### Authorization Middleware

```typescript
// Role-based access control
const requireAuth = async (request, reply) => {
  const token = request.headers.authorization?.split(' ')[1];
  if (!token) return reply.status(401).send({ error: 'Unauthorized' });

  const decoded = jwt.verify(token, JWT_SECRET);
  request.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
};

const requireRole = (...roles) => async (request, reply) => {
  if (!roles.includes(request.user.role)) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
};
```

---

## Data Flow Patterns

### 1. List Data Flow

```
User Action → Page Component → React Query → API Client → Backend → Prisma → Database
                  ↓                                                      │
              Render List ◀──────── Transform Data ◀───────────────────┘
```

### 2. Create/Update Flow

```
Form Submit → Service Call → API Request → Controller → Validation → Prisma → Database
                                                │                          │
                                         400 if invalid              Cascade relations
                                                │                          │
Success Toast ◀── Query Invalidate ◀── Response ◀──────────────────────────┘
```

### 3. File Upload Flow

```
File Select → FormData → POST /upload → Multer → Sharp → MinIO → Return URL
                                                  │
                                           Image compression
                                           (if applicable)
```

---

## State Management

### Server State (React Query)

- **Caching**: 5-minute stale time
- **Refetching**: On window focus, mutation success
- **Keys**: Hierarchical (`['projects', id]`, `['floors', projectId]`)

```typescript
// Example query
const { data: projects } = useQuery({
  queryKey: ['projects'],
  queryFn: () => projectService.getAll(),
});

// Example mutation
const mutation = useMutation({
  mutationFn: (data) => projectService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  },
});
```

### Client State (Zustand)

- **Auth Store**: User session, token management
- **Theme Store**: Dark/light mode preference

```typescript
// Auth store
const useAuthStore = create(persist((set) => ({
  user: null,
  token: null,
  login: async (credentials) => { /* ... */ },
  logout: () => set({ user: null, token: null }),
})));
```

---

## Database Design Principles

### 1. Hierarchical Structure

```
Project (1)
  └── Floor (n)
        └── Room (n)
              └── Asset (n)
                    └── Checklist (n)
                          └── ChecklistItem (n)
                                └── ChecklistPhoto (n)
```

### 2. Cascade Deletes

- Project → Floors → Rooms → Assets → Checklists → Items → Photos
- Issue → Photos, Comments
- InventoryItem → Logs

### 3. Soft References

- User references (createdBy, assignedTo, installedBy) use `SetNull` on delete
- Preserves historical data when users are removed

---

## Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | HTTPS | Nginx TLS termination |
| Authentication | JWT | Short-lived tokens |
| Password | Bcrypt | 10 rounds hashing |
| Input | Validation | Zod schemas |
| Database | ORM | Prisma (SQL injection prevention) |
| Files | Type check | Multer filters |
| CORS | Restricted | Configurable origins |

---

## Performance Considerations

### Frontend

- **Code Splitting**: Vite automatic chunks
- **Lazy Loading**: React.lazy for routes
- **Caching**: React Query with stale-while-revalidate
- **Memoization**: useMemo, useCallback for expensive operations

### Backend

- **Connection Pooling**: Prisma connection pool
- **Query Optimization**: Select only needed fields
- **Pagination**: Limit/offset for large lists
- **Indexing**: Database indexes on foreign keys

### Database

- **Indexes**: All foreign key columns
- **Constraints**: Unique constraints for emails, etc.
- **Cascades**: Database-level cascade deletes

---

## Deployment Architecture (Production)

```
┌──────────────────────────────────────────────────────────────────┐
│                         Load Balancer                             │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                          Nginx                                    │
│  ┌─────────────────────┐        ┌─────────────────────────────┐  │
│  │  Static Files       │        │   API Proxy                 │  │
│  │  (Frontend Build)   │        │   /api → Backend            │  │
│  └─────────────────────┘        └─────────────────────────────┘  │
└────────────────────────────────────────┬─────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────┐
│                    Backend Instances (N)                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Fastify Application                     │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────┬─────────────────────────┘
                                         │
┌──────────────────┬─────────────────────┴────────────┬────────────┐
│   PostgreSQL     │              MinIO               │   Redis    │
│   (Primary)      │         (Object Storage)         │  (Cache)   │
└──────────────────┴──────────────────────────────────┴────────────┘
```

---

## Environment Variables

### Backend

```env
DATABASE_URL="postgresql://user:pass@localhost:5433/synax_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="synax-files"
```

### Frontend

```env
VITE_API_URL="http://localhost:3002"
```

---

## Monitoring & Logging

### Recommended Tools

- **Application**: Fastify built-in logging (pino)
- **Metrics**: Prometheus + Grafana
- **Errors**: Sentry
- **Tracing**: OpenTelemetry

### Log Levels

| Level | Usage |
|-------|-------|
| error | Unexpected errors, exceptions |
| warn | Validation failures, deprecated usage |
| info | Request/response, important operations |
| debug | Development debugging |

---

*For database schema details, see [DATABASE.md](./DATABASE.md)*
*For API endpoints, see [API.md](./API.md)*
