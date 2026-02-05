# Label-Asset Integration

**Created:** 2026-02-05
**Status:** In Development

---

## Overview

Σύνδεση του Labels service με το Inventory/Equipment service για πλήρη traceability των labels.

---

## Current State

### Labels Service
| Feature | Status |
|---------|--------|
| Database Storage | ❌ Client-side only |
| Persist after refresh | ❌ Lost |
| Link to Assets | ❌ None |
| QR Code Format | `SYNAX:{code}` |

### Asset/Equipment Service
| Feature | Status |
|---------|--------|
| `labelCode` field | ✅ Exists (unique, optional) |
| Lookup by labelCode | ✅ `/api/assets/by-label/:labelCode` |
| Auto-generation | ✅ Random code in form |
| Connection to Labels | ❌ None |

---

## New Database Model

```prisma
model Label {
  id          String      @id @default(cuid())
  projectId   String      @map("project_id")
  code        String      @unique
  type        LabelType   @default(ASSET)
  status      LabelStatus @default(AVAILABLE)
  assetId     String?     @unique @map("asset_id")
  createdAt   DateTime    @default(now()) @map("created_at")
  printedAt   DateTime?   @map("printed_at")
  assignedAt  DateTime?   @map("assigned_at")

  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  asset       Asset?      @relation(fields: [assetId], references: [id], onDelete: SetNull)

  @@map("labels")
}

enum LabelType {
  CABLE
  RACK
  ASSET
  ROOM
}

enum LabelStatus {
  AVAILABLE
  PRINTED
  ASSIGNED
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/labels/project/:projectId` | All labels for project |
| GET | `/api/labels/project/:projectId/available` | Available labels only |
| POST | `/api/labels/project/:projectId` | Create single label |
| POST | `/api/labels/project/:projectId/batch` | Generate batch |
| PUT | `/api/labels/:id/assign/:assetId` | Assign to asset |
| PUT | `/api/labels/:id/unassign` | Remove from asset |
| PUT | `/api/labels/:id/mark-printed` | Mark as printed |
| DELETE | `/api/labels/:id` | Delete (only if not assigned) |

---

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         LABELS PAGE                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Select Project (required)                                    │
│  2. Generate Batch: Type + Prefix + Start + Count                │
│  3. Save to Database (status: AVAILABLE)                         │
│  4. Print selected (status: PRINTED)                             │
│  5. View all labels with status                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY / ADD EQUIPMENT                     │
├─────────────────────────────────────────────────────────────────┤
│  Label Code: [Dropdown]                                          │
│              ↳ Shows AVAILABLE or PRINTED labels                 │
│              ↳ Filtered by project                               │
│  On Save: Label status → ASSIGNED                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 FLOOR/ROOM - EDIT ASSET POPUP                    │
├─────────────────────────────────────────────────────────────────┤
│  Label Code: [Dropdown]                                          │
│              ↳ Can assign/change label                           │
│              ↳ Previous label → PRINTED status                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI Changes

### 1. LabelsPage (Updated)
- Project dropdown (required)
- Generate batch → Save to DB
- Table view: Code, Type, Status, Assigned Asset, Actions
- Print selected → Mark as PRINTED
- Delete unassigned labels

### 2. Inventory - Add/Edit Equipment
```
Label Code: [──────────────────▼]
            │ AST-0001 (Available)     │
            │ AST-0002 (Printed)       │
            │ + Leave empty            │
            └──────────────────────────┘
```

### 3. Floor/Room - Asset Edit Popup
Same dropdown as Inventory.

---

## Benefits

| Benefit | Description |
|---------|-------------|
| Traceability | Know which label is on which asset |
| Inventory Control | See available labels count |
| No Duplicates | Unique constraint + one-to-one |
| Audit Trail | printedAt, assignedAt timestamps |
| Flexibility | Can reassign labels |

---

## Files to Create/Modify

### Backend
- `prisma/schema.prisma` - Add Label model
- `controllers/label.controller.ts` - New controller
- `server.ts` - Register routes

### Frontend
- `services/label.service.ts` - New service
- `pages/labels/LabelsPage.tsx` - Update UI
- `pages/inventory/InventoryPage.tsx` - Add label dropdown
- `pages/rooms/RoomDetailPage.tsx` - Add label dropdown
- `pages/floors/FloorDetailPage.tsx` - Add label dropdown
- `components/floor-plan/FloorPlanCanvas.tsx` - Asset popup
- `components/room-plan/RoomPlanCanvas.tsx` - Asset popup

---

*Created: 2026-02-05*
