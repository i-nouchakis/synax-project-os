# Synax - Εργασίες

**Τελευταία Ενημέρωση:** 2026-02-06

---

## Pending Tasks (8 items)

### Μικρή Πολυπλοκότητα

#### 1. Mobile Fine-tuning
- **Τι:** Audit όλων των pages για responsive issues σε mobile
- **Λεπτομέρειες:** Fix margins, padding, layout σε μικρές οθόνες. Το βασικό responsive nav (hamburger, overlay sidebar) είναι OK αλλά τα individual pages χρειάζονται fine-tuning
- **Status:** ⏳ Pending

#### 2. Cloud Deploy (Contabo)
- **Τι:** Sync DB schema + seed στον Contabo server
- **Λεπτομέρειες:** `prisma db push --force-reset` για νέα models (Cable, CableBundle, Feedback, DrawingShape, κλπ.), μετά `prisma db seed`
- **Status:** ⏳ Pending

### Μικρή-Μεσαία Πολυπλοκότητα

#### 3. File Sharing in Messenger
- **Τι:** Upload αρχείων/εικόνων μέσα στο chat
- **Λεπτομέρειες:** Τώρα μόνο text + emoji. Χρειάζεται: file upload, image preview, file download, validation τύπων αρχείων
- **Status:** ✅ Completed - MessageAttachment model, upload endpoint (10MB limit, images/PDF/docs), paperclip button, pending file preview, image thumbnails in bubbles, file download links, image lightbox

#### 4. Signatures UI Integration
- **Τι:** Ενσωμάτωση signature capture στο UI
- **Λεπτομέρειες:** Backend controller + frontend service υπάρχουν ήδη. Types: ROOM_HANDOVER, STAGE_COMPLETION, FINAL_ACCEPTANCE. Χρειάζεται integration σε workflows (room handover, checklist completion, κλπ.)
- **Status:** ✅ Completed - Integrated in RoomDetailPage (Sign Off button + signatures section) and ProjectDetailPage (Stage Completion + Final Acceptance buttons + signatures section)

### Μεσαία Πολυπλοκότητα

#### 5. WebSocket for Messenger
- **Τι:** Αντικατάσταση polling με WebSocket για real-time messaging
- **Λεπτομέρειες:** Τώρα: conversations every 5s, messages every 3s. Fastify supports WebSocket via @fastify/websocket. Connection management, room-based subscriptions, fallback to polling
- **Status:** ✅ Completed - @fastify/websocket installed, WS route at /api/messenger/ws, singleton hook useMessengerSocket, typing indicators, read receipts broadcast, sidebar unread badge, auto-reconnect

#### 6. Cable System Advanced Features
- **Τι:** Προηγμένες λειτουργίες για cables
- **Λεπτομέρειες:** Βασικό cable drawing δουλεύει (source→type→target, bend points, tension). Λείπει: Orthogonal routing auto-generation, Cable properties modal, Cable legend στο export
- **Status:** ⏳ Pending

#### 7. Recurring Calendar Events
- **Τι:** Επαναλαμβανόμενα events στο ημερολόγιο
- **Λεπτομέρειες:** Τώρα μόνο one-time events. Χρειάζεται: daily, weekly, monthly, yearly patterns, recurrence rules, exceptions, display recurring instances
- **Status:** ✅ Completed - RecurrenceRule enum (DAILY/WEEKLY/MONTHLY/YEARLY), interval + end date, virtual instance expansion, repeat icon in grid, recurrence section in form

#### 8. PWA Configuration
- **Τι:** Proper PWA setup
- **Λεπτομέρειες:** `vite-plugin-pwa` + `workbox-window` installed αλλά δεν είναι configured. Χρειάζεται: service worker, manifest.json, offline caching, install prompt, app icons
- **Status:** ⏳ Pending

### Μεγάλη Πολυπλοκότητα

#### 9. Floor Plan Layers Redesign
- **Τι:** Σχεδιασμός layers από την αρχή
- **Λεπτομέρειες:** Η προηγούμενη υλοποίηση αφαιρέθηκε (μη καθαρή αρχιτεκτονική). Νέος σχεδιασμός: κάθε layer τελείως ανεξάρτητο (δικά του shapes/cables), clean new layer creation (κενό canvas), download/export per layer ή combined, visibility/lock/reorder
- **Status:** ⏳ Pending

#### 10. Notification System
- **Τι:** In-app notifications
- **Λεπτομέρειες:** Bell icon με badge, notification types (issue assigned, checklist completed, calendar reminder, new message), mark as read, preferences στο settings. Future: push notifications via PWA
- **Status:** ⏳ Pending

#### 11. Offline Mode (Dexie/IndexedDB)
- **Τι:** Offline λειτουργία για critical features
- **Λεπτομέρειες:** `offline.store.ts` υπάρχει με Dexie αλλά δεν λειτουργεί. Χρειάζεται: offline caching (checklists, issues), sync queue, conflict resolution, online/offline indicator, background sync
- **Status:** ⏳ Pending

### Πολύ Μεγάλη Πολυπλοκότητα

#### 12. V2 Drawing Features
- **Τι:** Advanced drawing tools για canvas
- **Λεπτομέρειες:** Grid & Snap, Context menu (right-click), Symbol Library (electrical/network/safety icons), Path/Pen tool (bezier), Dimension Lines, Mini-map, Eyedropper, History panel, DXF/SVG export, Smart features (auto-distribute, mirror, snap to angles)
- **Documentation:** `.claude/features/canvas-drawing-cables-v2.md`
- **Status:** ⏳ Pending

---

## Ολοκληρωμένα Features (33 items) ✅

| # | Feature | Commit |
|---|---------|--------|
| 1 | Auth (Login, Roles, JWT, Forgot/Reset Password) | Multiple |
| 2 | Dashboard | Multiple |
| 3 | Users Management (ADMIN only) | Multiple |
| 4 | Clients (CRUD + linked projects) | `0fbfde9` |
| 5 | Projects (CRUD + client dropdown) | Multiple |
| 6 | Buildings (CRUD + fullscreen floor plan) | `2b29b5c` |
| 7 | Floors (CRUD + floor plan canvas + pins) | Multiple |
| 8 | Rooms (CRUD + room plan canvas + pins) | `38064b1` |
| 9 | Assets (CRUD + grouped by project) | `2b29b5c` |
| 10 | Checklists (CRUD + project filter) | `cafa629` |
| 11 | Checklist Templates (drag & drop) | `170a04a` |
| 12 | Issues (CRUD + project filter + comments + photos) | `cafa629` |
| 13 | Inventory (Equipment + Materials) | Multiple |
| 14 | Reports (Summary, Client, Assets, PDF) | `cafa629` |
| 15 | Labels (Batch create, assign, QR print) | `0fbfde9` |
| 16 | Calendar (Monthly/Weekly, attendees, overlap) | `0fbfde9` |
| 17 | Messenger (Conversations, read receipts, emoji) | `0fbfde9`, `e966983` |
| 18 | Project Files (Upload, categories) | `0fbfde9` |
| 19 | Settings (Profile, Password, Interface) | `8b9a893` |
| 20 | Manual (In-app user guide) | Multiple |
| 21 | Lookups (Room Types, Manufacturers, Models) | Multiple |
| 22 | Drawing V1 (7 tools, shapes, cables, measurement, export) | `e966983`, `4acd950` |
| 23 | Global Search (context-aware) | `95fc493` |
| 24 | Sortable Tables (10 tables, 7 pages) | `f591b15` |
| 25 | Responsive Mobile Nav (hamburger, overlay) | Multiple |
| 26 | Draggable Popups (floor & room canvas) | Multiple |
| 27 | Import from Inventory (floor & room bulk) | Multiple |
| 28 | Descriptive Error Messages (13 controllers) | Multiple |
| 29 | Fullscreen Modals (floor plans, z-index fix) | `9cb7ae8` |
| 30 | Feedback System (widget + admin + screenshot) | `b879e70` |
| 31 | Signatures UI (Room Sign Off + Project Stage/Final) | `d008e98` |
| 32 | WebSocket for Messenger (real-time, typing, unread badge) | `d008e98` |
| 33 | File Sharing in Messenger (upload, preview, lightbox) | Pending commit |
| 34 | Recurring Calendar Events (daily/weekly/monthly/yearly) | Pending commit |

---

*Updated: 2026-02-06*
