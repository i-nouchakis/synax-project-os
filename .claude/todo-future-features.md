# Synax - Future Features Todo List

**Δημιουργήθηκε:** 2026-01-31
**Τελευταία ενημέρωση:** 2026-02-09

---

## 🔔 Επικοινωνία & Ενημερώσεις

- [x] **Notifications Center** - Real-time ειδοποιήσεις για issues, assignments, completions. ✅ Υλοποιήθηκε πλήρως (controller, service, store, unread tracking)
- [x] **Team Chat (Messenger)** - In-app messaging ανά project, group chats, file sharing. ✅ WebSocket real-time, attachments, typing indicators, read receipts
- [ ] **@Mentions** - Αναφορά χρηστών σε comments, αυτόματη ειδοποίηση
- [ ] **Email Digests** - Ημερήσια/εβδομαδιαία περίληψη δραστηριότητας

---

## 📅 Scheduling & Planning

- [x] **Calendar View** - Ημερολόγιο με events, deadlines, milestones. ✅ 6 event types, attendees, overlap detection, color coding
- [ ] **Gantt Charts** - Timeline visualization με dependencies
- [ ] **Technician Scheduling** - Διαθεσιμότητα τεχνικών, ανάθεση βάρδιων
- [x] **Recurring Tasks** - Επαναλαμβανόμενες εργασίες. ✅ DAILY/WEEKLY/MONTHLY/YEARLY recurrence rules στο Calendar

---

## 📊 Analytics & Insights

- [ ] **Advanced Dashboard** - Customizable widgets, drag & drop layout
- [ ] **Productivity Metrics** - Performance ανά τεχνικό, ώρες/task
- [ ] **Budget vs Actual** - Κοστολόγηση υλικών, σύγκριση με budget
- [ ] **Custom Reports Builder** - Drag & drop report δημιουργία
- [ ] **Trend Analysis** - Γραφήματα progress over time

---

## 🔄 Workflows & Approvals

- [ ] **Approval Chains** - Multi-step approvals για critical tasks
- [ ] **Stage Gates** - Υποχρεωτική έγκριση πριν το επόμενο στάδιο
- [ ] **Review System** - Peer review για ολοκληρωμένες εργασίες
- [ ] **Escalation Rules** - Αυτόματη κλιμάκωση αν δεν υπάρξει απάντηση

---

## 📦 Data Management

- [ ] **Excel Import/Export** - Bulk import assets, export reports σε Excel
- [ ] **Project Templates** - Πρότυπα projects με preset floors/rooms
- [x] **Equipment Library (Lookups/Dropdowns)** - Κεντρική βάση εξοπλισμού. ✅ Room Types, Manufacturers, Asset Models, Inventory Units, Issue Causes
- [ ] **Custom Fields** - User-defined fields σε οποιοδήποτε entity
- [ ] **Activity Audit Log** - Πλήρες ιστορικό "who did what when"

---

## 🌍 Integrations

- [ ] **Google Maps** - Project locations σε χάρτη, navigation
- [ ] **Slack/Teams** - Notifications σε εταιρικό chat
- [ ] **Google Drive/Dropbox** - Sync αρχείων με cloud storage
- [ ] **Accounting Software** - Export για τιμολόγηση
- [ ] **Webhook API** - Custom integrations

---

## 📱 Mobile & Offline

- [ ] **React Native App** - Native mobile για καλύτερο performance
- [ ] **Voice Commands** - "Ολοκλήρωσε το checklist item 3"
- [ ] **Video Documentation** - Capture & annotate video
- [ ] **Offline Sync Improvements** - Conflict resolution UI, sync status per item

---

## 🤖 AI Features

- [ ] **Smart Photo Analysis** - AI detection για defects από φωτογραφίες
- [ ] **Auto-categorization** - Αυτόματη κατηγοριοποίηση issues
- [ ] **Predictive Maintenance** - Πρόβλεψη πότε θα χρειαστεί service
- [ ] **OCR για Labels** - Scan ετικέτες και auto-fill data

---

## 🎓 Training & Support

- [ ] **Interactive Tutorials** - Step-by-step onboarding
- [ ] **Video Guides** - How-to videos per feature
- [x] **Knowledge Base** - Searchable documentation. ✅ Help Bot με 12 κατηγορίες, 30+ articles, keyword search
- [x] **In-app Help** - Contextual tooltips, guided tours. ✅ HelpChatWidget με context-aware help ανά σελίδα

---

## 🏢 Client Experience

- [x] **Client Management** - Πελατολόγιο με στοιχεία επικοινωνίας. ✅ Full CRUD, σύνδεση με projects
- [ ] **Progress Updates** - Automated email με status
- [x] **Project Files / Document Sharing** - Secure file sharing. ✅ 5 κατηγορίες (Contracts, Drawings, Reports, Photos, Other), MinIO storage
- [x] **Feedback System** - Client ratings & comments. ✅ BUG/CHANGE types, screenshot upload, admin notes, resolution tracking

---

## 🎨 UI/UX Enhancements

- [ ] **Multi-language (i18n)** - Ελληνικά, Αγγλικά, κλπ
- [ ] **Global Search** - Search παντού με filters
- [ ] **Keyboard Shortcuts** - Power user navigation
- [ ] **More Themes** - Περισσότερα color themes
- [ ] **3D Floor Plans** - 3D visualization, virtual tours

---

## 🏗️ Πρόσθετα Features (υλοποιήθηκαν χωρίς να ήταν στη λίστα)

- [x] **Buildings CRUD** - Ιεραρχία Project → Building → Floor → Room. Floorplan upload, pin placement στο masterplan
- [x] **Checklist Templates** - 5 τύποι (General, Cabling, Equipment, Config, Documentation). Template items με required/photo flags
- [x] **Cable Management** - 8 τύποι καλωδίων, routing modes (Straight/Orthogonal/Auto/Custom), bundling system
- [x] **Drawing Shapes on Plans** - 7 shape types (Rectangle, Circle, Line, Arrow, Text, Freehand, Polygon), layers, z-index
- [x] **Admin Password Reset** - Admin μπορεί να κάνει reset κωδικό χρήστη από το Edit User modal
- [x] **Admin Feedback Type Toggle** - Admin μπορεί να αλλάξει τύπο feedback (BUG ↔ CHANGE) από το detail modal
- [x] **Demo Environment** - Ανεξάρτητο demo instance στο Contabo (docker-compose.demo.yml) με realistic seed data (6 projects, 586 assets)
- [x] **Manual/Documentation Page** - Πλήρης σελίδα εγχειριδίου χρήσης με όλες τις ενότητες
- [x] **Seed Scripts** - seed-demo.ts (6 ρεαλιστικά projects), seed-lookups.ts (dropdowns), seed-ookea.ts

---

## ⭐ Priority Features (Top 5 - Pending)

| Priority | Feature | Complexity | Impact |
|----------|---------|------------|--------|
| 1 | Excel Import/Export | Medium | High |
| 2 | Gantt Charts | High | High |
| 3 | Activity Audit Log | Medium | Medium |
| 4 | Global Search | Medium | High |
| 5 | Multi-language (i18n) | High | High |

---

## Completed Features ✅

- [x] Authentication & Authorization
- [x] User Management
- [x] Projects CRUD
- [x] Buildings CRUD
- [x] Floors & Rooms CRUD
- [x] Interactive Floor Plans (Konva.js)
- [x] Assets CRUD with pins
- [x] Checklists System
- [x] Checklist Templates (5 types)
- [x] Issues Tracking
- [x] Inventory Management
- [x] Reports (Summary, Client, Internal)
- [x] PDF Export
- [x] PWA & Offline Support
- [x] QR Code Scanner
- [x] Photo Management
- [x] Digital Signatures
- [x] Label Generation
- [x] Theme System (dark/light)
- [x] Settings Page
- [x] Manual/Documentation
- [x] DWG → SVG Conversion
- [x] Password Reset (self + admin reset)
- [x] Room Floorplan Crop
- [x] Notifications Center
- [x] Team Chat / Messenger (WebSocket)
- [x] Calendar View + Recurring Events
- [x] Equipment Library (Lookups/Dropdowns)
- [x] Cable Management + Bundling
- [x] Drawing Shapes on Plans
- [x] Project Files Management
- [x] Client Management
- [x] Feedback System (BUG/CHANGE)
- [x] Help Bot / Knowledge Base
- [x] Admin Password Reset
- [x] Admin Feedback Type Toggle
- [x] Demo Environment (Contabo)
- [x] Seed Scripts (demo, lookups, ookea)
- [ ] Time Tracking (removed from v1, specs preserved below)

---

## ⏱️ Time Tracking Module (Removed from v1)

**Status:** Specs preserved for future implementation
**Removed:** 2026-02-05

### Database Schema

```prisma
model TimeEntry {
  id          String        @id @default(cuid())
  projectId   String        // Required - which project
  userId      String        // Required - who worked
  roomId      String?       // Optional - specific room
  assetId     String?       // Optional - specific asset
  type        TimeEntryType // Work category
  description String?
  date        DateTime      @default(now())
  startTime   DateTime?     // For timer mode
  endTime     DateTime?     // For timer mode
  hours       Float         // 0.1 - 24
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  asset       Asset?        @relation(...)
  project     Project       @relation(..., onDelete: Cascade)
  room        Room?         @relation(...)
  user        User          @relation(...)
}

enum TimeEntryType {
  INSTALLATION
  CONFIGURATION
  TESTING
  TROUBLESHOOTING
  TRAVEL
  MEETING
  OTHER
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/time-entries/start` | Start timer |
| POST | `/api/time-entries/:id/stop` | Stop timer |
| POST | `/api/time-entries` | Create manual entry |
| GET | `/api/time-entries` | Get all (role-based) |
| GET | `/api/time-entries/my` | Get current user's entries |
| GET | `/api/time-entries/project/:id/summary` | Project analytics |
| PUT | `/api/time-entries/:id` | Update entry |
| DELETE | `/api/time-entries/:id` | Delete entry |

### Features

**Two Input Modes:**
1. **Timer Mode** - Start/Stop, auto-calculates hours
2. **Manual Mode** - User enters hours directly

**Work Types (7):**
- INSTALLATION (blue)
- CONFIGURATION (purple)
- TESTING (green)
- TROUBLESHOOTING (orange)
- TRAVEL (gray)
- MEETING (pink)
- OTHER (slate)

**Permissions:**
- TECHNICIAN: View/edit own entries only
- PM/ADMIN: View/edit all entries

**UI Components:**
- Active timer card with real-time display
- Manual entry form (collapsible)
- Filters (project, date range)
- Summary stats (total entries, hours, this week)
- Paginated entries table

**Project Summary Analytics:**
- Total hours & entries
- Hours by user
- Hours by work type
- Recent 10 entries

### File Locations (were)

| Type | Path |
|------|------|
| Frontend Page | `pages/time-tracking/TimeTrackingPage.tsx` |
| Frontend Service | `services/timeentry.service.ts` |
| Backend Controller | `controllers/timeentry.controller.ts` |
| DB Table | `time_entries` |

---

*Last Updated: 2026-02-09*
