# Synax - Future Features Todo List

**Δημιουργήθηκε:** 2026-01-31
**Status:** Pending Prioritization

---

## 🔔 Επικοινωνία & Ενημερώσεις

- [ ] **Notifications Center** - Real-time ειδοποιήσεις για issues, assignments, completions. Push notifications στο PWA.
- [ ] **Team Chat** - In-app messaging ανά project, group chats, file sharing
- [ ] **@Mentions** - Αναφορά χρηστών σε comments, αυτόματη ειδοποίηση
- [ ] **Email Digests** - Ημερήσια/εβδομαδιαία περίληψη δραστηριότητας

---

## 📅 Scheduling & Planning

- [ ] **Calendar View** - Ημερολόγιο με tasks, deadlines, milestones
- [ ] **Gantt Charts** - Timeline visualization με dependencies
- [ ] **Technician Scheduling** - Διαθεσιμότητα τεχνικών, ανάθεση βάρδιων
- [ ] **Recurring Tasks** - Επαναλαμβανόμενες εργασίες συντήρησης

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
- [ ] **Equipment Library** - Κεντρική βάση εξοπλισμού με specs, manuals
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
- [ ] **Knowledge Base** - Searchable documentation
- [ ] **In-app Help** - Contextual tooltips, guided tours

---

## 🏢 Client Experience

- [ ] **Client Portal** - Ξεχωριστό UI για πελάτες
- [ ] **Progress Updates** - Automated email με status
- [ ] **Document Sharing** - Secure file sharing με clients
- [ ] **Feedback System** - Client ratings & comments

---

## 🎨 UI/UX Enhancements

- [ ] **Multi-language (i18n)** - Ελληνικά, Αγγλικά, κλπ
- [ ] **Global Search** - Search παντού με filters
- [ ] **Keyboard Shortcuts** - Power user navigation
- [ ] **More Themes** - Περισσότερα color themes
- [ ] **3D Floor Plans** - 3D visualization, virtual tours

---

## ⭐ Priority Features (Top 5)

| Priority | Feature | Complexity | Impact |
|----------|---------|------------|--------|
| 1 | Notifications Center | Medium | High |
| 2 | Excel Import/Export | Medium | High |
| 3 | Calendar/Gantt | High | High |
| 4 | Activity Audit Log | Medium | Medium |
| 5 | Client Portal | High | High |

---

## Completed Features ✅

- [x] Authentication & Authorization
- [x] User Management
- [x] Projects CRUD
- [x] Floors & Rooms CRUD
- [x] Interactive Floor Plans (Konva.js)
- [x] Assets CRUD with pins
- [x] Checklists System
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
- [x] Password Reset
- [ ] Time Tracking (removed from v1, see specs below)
- [x] Room Floorplan Crop

---

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

*Last Updated: 2026-02-05*
