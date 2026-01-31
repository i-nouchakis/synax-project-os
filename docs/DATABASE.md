# Synax Database Schema

## Overview

Synax uses PostgreSQL as its primary database with Prisma ORM for data access. The schema is designed around a hierarchical project structure with comprehensive audit trails.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER                                        │
│  id, email, passwordHash, name, role, avatar, isActive                  │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROJECT MEMBER                                   │
│  id, projectId, userId, role, joinedAt                                  │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ N:1
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            PROJECT                                       │
│  id, name, description, clientName, location, status, dates             │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             FLOOR                                        │
│  id, projectId, name, level, floorplanUrl, floorplanType                │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              ROOM                                        │
│  id, floorId, name, type, pinX, pinY, status, notes, floorplanUrl       │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             ASSET                                        │
│  id, roomId, assetTypeId, name, model, serialNumber, macAddress, status │
│  ipAddress, pinX, pinY, installedById, installedAt                      │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           CHECKLIST                                      │
│  id, assetId, type, status, assignedToId, completedAt                   │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHECKLIST ITEM                                    │
│  id, checklistId, name, description, isRequired, requiresPhoto,         │
│  completed, completedById, completedAt, order                           │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       CHECKLIST PHOTO                                    │
│  id, checklistItemId, photoUrl, caption, uploadedAt                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Models

### User

Stores user accounts and authentication data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique, login identifier |
| passwordHash | String | Bcrypt hashed password |
| name | String? | Display name |
| role | Enum | ADMIN, PM, TECHNICIAN, CLIENT |
| avatar | String? | Avatar image URL |
| isActive | Boolean | Account status (default: true) |
| createdAt | DateTime | Account creation time |
| updatedAt | DateTime | Last modification time |

**Relations:**
- `projectMembers` → ProjectMember[]
- `assignedAssets` → Asset[]
- `assignedChecklists` → Checklist[]
- `completedItems` → ChecklistItem[]
- `createdIssues` → Issue[]
- `issueComments` → IssueComment[]
- `inventoryLogs` → InventoryLog[]
- `signatures` → Signature[]
- `generatedReports` → GeneratedReport[]

**Indexes:**
- Unique on `email`

---

### Project

Top-level container for installation projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Project name |
| description | String? | Detailed description |
| clientName | String | Client/customer name |
| location | String? | Physical address |
| status | Enum | PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, ARCHIVED |
| startDate | DateTime? | Project start date |
| endDate | DateTime? | Expected completion date |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `members` → ProjectMember[]
- `floors` → Floor[]
- `issues` → Issue[]
- `inventory` → InventoryItem[]
- `signatures` → Signature[]
- `generatedReports` → GeneratedReport[]

**Cascade Deletes:**
- Deleting a project cascades to all floors, members, issues, inventory, signatures, and reports

---

### ProjectMember

Many-to-many relationship between users and projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| projectId | UUID | FK to Project |
| userId | UUID | FK to User |
| role | String? | Role within project |
| joinedAt | DateTime | When user joined project |

**Constraints:**
- Unique on `(projectId, userId)` - user can only be member once per project

---

### Floor

Building floors within a project.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| projectId | UUID | FK to Project |
| name | String | Floor name (e.g., "Ground Floor") |
| level | Int | Floor number (0, 1, 2, -1) |
| floorplanUrl | String? | URL to floor plan image/PDF |
| floorplanType | Enum? | PDF, DWG, SVG, IMAGE |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `project` → Project
- `rooms` → Room[]

---

### Room

Spaces within floors where assets are installed.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| floorId | UUID | FK to Floor |
| name | String | Room identifier (e.g., "Room 101") |
| type | String? | Room type (Guest Room, Corridor, etc.) |
| pinX | Float? | X position on floor plan |
| pinY | Float? | Y position on floor plan |
| status | Enum | NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED |
| notes | String? | Additional notes |
| floorplanUrl | String? | Room-level floor plan |
| floorplanType | String? | Floor plan type |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `floor` → Floor
- `assets` → Asset[]
- `issues` → Issue[]
- `signatures` → Signature[]

---

### AssetType

Templates for different equipment types.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Type name (Access Point, Switch, etc.) |
| icon | String? | Icon identifier |
| checklistTemplate | Json? | Default checklist items template |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Default Asset Types:**
- Access Point (wifi icon)
- Network Switch (router icon)
- Smart TV (tv icon)
- IP Camera (camera icon)
- VoIP Phone (phone icon)
- POS Terminal (credit-card icon)

---

### Asset

Individual equipment items installed in rooms.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| roomId | UUID | FK to Room |
| assetTypeId | UUID? | FK to AssetType |
| name | String | Asset name/identifier |
| model | String? | Model number |
| serialNumber | String? | Manufacturer serial |
| macAddress | String? | Network MAC address |
| ipAddress | String? | Assigned IP address |
| pinX | Float? | X position on room floor plan |
| pinY | Float? | Y position on room floor plan |
| status | Enum | PLANNED, IN_STOCK, INSTALLED, CONFIGURED, VERIFIED, FAULTY |
| installedById | UUID? | FK to User who installed |
| installedAt | DateTime? | Installation timestamp |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `room` → Room
- `assetType` → AssetType?
- `installedBy` → User?
- `checklists` → Checklist[]

---

### Checklist

Quality assurance checklists for assets.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| assetId | UUID | FK to Asset |
| type | Enum | CABLING, EQUIPMENT, CONFIG, DOCUMENTATION |
| status | Enum | NOT_STARTED, IN_PROGRESS, COMPLETED |
| assignedToId | UUID? | FK to assigned User |
| completedAt | DateTime? | Completion timestamp |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `asset` → Asset
- `assignedTo` → User?
- `items` → ChecklistItem[]

**Checklist Types:**

| Type | Purpose |
|------|---------|
| CABLING | Cable routing, termination, labeling |
| EQUIPMENT | Physical installation, mounting, power |
| CONFIG | Network configuration, IP, testing |
| DOCUMENTATION | Labels, as-built, handover docs |

---

### ChecklistItem

Individual items within a checklist.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| checklistId | UUID | FK to Checklist |
| name | String | Item name |
| description | String? | Detailed instructions |
| isRequired | Boolean | Must be completed |
| requiresPhoto | Boolean | Photo evidence required |
| completed | Boolean | Completion status |
| completedById | UUID? | FK to User who completed |
| completedAt | DateTime? | Completion timestamp |
| order | Int | Display order |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `checklist` → Checklist
- `completedBy` → User?
- `photos` → ChecklistPhoto[]

---

### ChecklistPhoto

Photo evidence for checklist items.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| checklistItemId | UUID | FK to ChecklistItem |
| photoUrl | String | MinIO file URL |
| caption | String? | Photo description |
| uploadedAt | DateTime | Upload timestamp |

---

### Issue

Problems and snags during installation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| projectId | UUID | FK to Project |
| roomId | UUID? | FK to Room (optional) |
| title | String | Issue title |
| description | String? | Detailed description |
| causedBy | String? | Third-party cause |
| priority | Enum | LOW, MEDIUM, HIGH, CRITICAL |
| status | Enum | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| createdById | UUID | FK to creating User |
| resolvedAt | DateTime? | Resolution timestamp |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `project` → Project
- `room` → Room?
- `createdBy` → User
- `photos` → IssuePhoto[]
- `comments` → IssueComment[]

---

### IssuePhoto

Photo evidence for issues.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| issueId | UUID | FK to Issue |
| photoUrl | String | MinIO file URL |
| caption | String? | Photo description |
| uploadedAt | DateTime | Upload timestamp |

---

### IssueComment

Discussion thread on issues.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| issueId | UUID | FK to Issue |
| userId | UUID | FK to commenting User |
| comment | String | Comment text |
| createdAt | DateTime | Creation timestamp |

**Relations:**
- `issue` → Issue
- `user` → User

---

### InventoryItem

Stock items for projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| projectId | UUID | FK to Project |
| itemType | String | Item type/name |
| description | String | Detailed description |
| unit | String | Unit of measure (pcs, m, kg) |
| quantityReceived | Int | Total received |
| quantityUsed | Int | Total consumed |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:**
- `project` → Project
- `logs` → InventoryLog[]

**Computed Values:**
- `currentStock` = quantityReceived - quantityUsed
- `lowStock` = currentStock < max(5, quantityReceived * 0.1)

---

### InventoryLog

Audit trail for stock movements.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| itemId | UUID | FK to InventoryItem |
| action | Enum | RECEIVED, CONSUMED, RETURNED, ADJUSTED |
| quantity | Int | Quantity changed |
| serialNumbers | String[]? | Serial numbers involved |
| notes | String? | Movement notes |
| userId | UUID | FK to User who made change |
| createdAt | DateTime | Movement timestamp |

**Action Types:**

| Action | Effect on Stock |
|--------|-----------------|
| RECEIVED | +quantity to received |
| CONSUMED | +quantity to used |
| RETURNED | -quantity from used |
| ADJUSTED | Direct adjustment (can be +/-) |

---

### Signature

Digital signatures for handovers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| projectId | UUID | FK to Project |
| roomId | UUID? | FK to Room (optional) |
| type | Enum | ROOM_HANDOVER, STAGE_COMPLETION, FINAL_ACCEPTANCE |
| signatureData | String | Base64 encoded signature |
| signedByName | String | Signer's name |
| signedById | UUID? | FK to User (if registered) |
| signedAt | DateTime | Signing timestamp |
| createdAt | DateTime | Creation timestamp |

---

### GeneratedReport

History of generated PDF reports.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| projectId | UUID | FK to Project |
| type | Enum | SUMMARY, CLIENT, INTERNAL, ASSETS |
| title | String | Report title |
| fileUrl | String | MinIO file URL |
| fileSize | Int? | File size in bytes |
| generatedById | UUID | FK to generating User |
| createdAt | DateTime | Generation timestamp |

---

## Enums

### UserRole
```
ADMIN       - Full system access
PM          - Project manager
TECHNICIAN  - Field technician
CLIENT      - Customer (read-only)
```

### ProjectStatus
```
PLANNING    - Initial planning phase
IN_PROGRESS - Active installation
ON_HOLD     - Temporarily paused
COMPLETED   - Installation complete
ARCHIVED    - Historical reference
```

### RoomStatus
```
NOT_STARTED - No work begun
IN_PROGRESS - Work underway
COMPLETED   - All work done
BLOCKED     - Cannot proceed
```

### AssetStatus
```
PLANNED     - Scheduled for installation
IN_STOCK    - Received, not installed
INSTALLED   - Physically installed
CONFIGURED  - Network configured
VERIFIED    - Tested and working
FAULTY      - Defective/broken
```

### ChecklistType
```
CABLING       - Cable installation
EQUIPMENT     - Physical installation
CONFIG        - Configuration
DOCUMENTATION - Documentation
```

### ChecklistStatus
```
NOT_STARTED - No items completed
IN_PROGRESS - Some items completed
COMPLETED   - All items completed
```

### IssuePriority
```
LOW      - Minor issue
MEDIUM   - Standard priority
HIGH     - Urgent attention needed
CRITICAL - Immediate action required
```

### IssueStatus
```
OPEN        - New issue
IN_PROGRESS - Being worked on
RESOLVED    - Fix implemented
CLOSED      - Verified and closed
```

### InventoryAction
```
RECEIVED - Stock received
CONSUMED - Stock used
RETURNED - Stock returned
ADJUSTED - Stock adjusted
```

### FloorplanType
```
PDF   - PDF document
DWG   - AutoCAD drawing
SVG   - Scalable vector
IMAGE - Raster image (PNG, JPG)
```

### SignatureType
```
ROOM_HANDOVER     - Room completion sign-off
STAGE_COMPLETION  - Phase completion
FINAL_ACCEPTANCE  - Project acceptance
```

### ReportType
```
SUMMARY  - High-level overview
CLIENT   - Customer report
INTERNAL - Technical report
ASSETS   - Asset inventory
```

---

## Cascade Behavior

| Parent | Child | On Delete |
|--------|-------|-----------|
| Project | Floor | Cascade |
| Project | ProjectMember | Cascade |
| Project | Issue | Cascade |
| Project | InventoryItem | Cascade |
| Project | Signature | Cascade |
| Project | GeneratedReport | Cascade |
| Floor | Room | Cascade |
| Room | Asset | Cascade |
| Room | Issue | SetNull |
| Room | Signature | SetNull |
| Asset | Checklist | Cascade |
| Checklist | ChecklistItem | Cascade |
| ChecklistItem | ChecklistPhoto | Cascade |
| Issue | IssuePhoto | Cascade |
| Issue | IssueComment | Cascade |
| InventoryItem | InventoryLog | Cascade |
| User | Various | SetNull |

---

## Indexes

Prisma automatically creates indexes on:
- All primary keys (id)
- All foreign key relationships
- Unique constraints (User.email, ProjectMember unique compound)

Additional recommended indexes for performance:
- `Asset.serialNumber`
- `Asset.macAddress`
- `Issue.status`
- `Issue.priority`
- `Checklist.status`

---

## Migration Commands

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

---

*For API usage, see [API.md](./API.md)*
