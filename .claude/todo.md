# Synax - Τρέχουσες Εργασίες

**Τελευταία Ενημέρωση:** 2026-02-05

---

## 🎨 Canvas Drawing & Cables System (FUTURE - Major Feature)

**📋 Documentation:**
- **V1 Plan:** `.claude/features/canvas-drawing-cables.md` (Core features + fixes + mockups)
- **V2 Plan:** `.claude/features/canvas-drawing-cables-v2.md` (40+ advanced features + mockups)

**⏱️ Time Estimates:**
- **V1 (Core):** 28-32 hours pure coding, 4-6 weeks calendar time
- **V2 (Advanced):** 20-30 days additional (depends on priorities)

**🎯 User Preferences from Chat:**
- Routing: User decides mode (Straight, Orthogonal, Auto, Custom)
- Scope: Both floor-level AND room-level
- Export: Multi-format with removal options
- Layers: Full layer management
- Priority: Correctness over speed
- Auto-routing: User-configurable

---

### V1 - Core Implementation (Ready to Start)

#### Phase 1: Backend Data Models (6-8 hours)
- [ ] **Prisma Schema Updates**
  - [ ] Create `Cable` model with flexible connections
    - `ConnectionType` enum (ASSET, ROOM, FLOOR)
    - `CableType` enum (Network, Power, Coaxial, Fiber, Phone, Other)
    - `RoutingMode` enum (STRAIGHT, ORTHOGONAL, AUTO, CUSTOM)
    - Fields: sourceType, sourceId, targetType, targetId, routingMode, routingPoints (Json)
  - [ ] Create `CableBundle` model
    - Fields: name, description, color, renderAsSingle, displayCount
    - Relation: Cable[] (one-to-many)
  - [ ] Create `DrawingShape` model
    - `ShapeType` enum (RECTANGLE, CIRCLE, LINE, ARROW, TEXT, FREEHAND, POLYGON)
    - Fields: floorId?, roomId?, type, layer, zIndex, locked, visible, data (Json), style (Json)
  - [ ] Run `npx prisma generate`
  - [ ] Run `npx prisma db push`

- [ ] **TypeScript Types (frontend/src/types/)**
  - [ ] `canvas.types.ts` - DrawingTool, ShapeType, DrawingShape interface
  - [ ] `cable.types.ts` - Cable, CableBundle, ConnectionType, RoutingMode
  - [ ] `layer.types.ts` - Layer, LayerConfig

#### Phase 2: Canvas State Management (4-5 hours)
- [ ] **Create Zustand Store: `drawing.store.ts`**
  - [ ] State: activeTool, shapes, cables, layers, selectedIds, history (undo/redo)
  - [ ] Actions: setTool, addShape, updateShape, deleteShape, undo, redo
  - [ ] Layer actions: addLayer, toggleLayer, setLayerLock, setLayerOpacity
  - [ ] Cable actions: addCable, updateCableRoute, deleteCable

#### Phase 3: UI Components (6-8 hours)
- [ ] **Drawing Toolbar Component**
  - [ ] Tool buttons: Select, Rectangle, Circle, Line, Arrow, Text, Freehand, Polygon, Cable
  - [ ] Active tool highlight
  - [ ] Tooltips for each tool
  - [ ] See mockup in `.claude/features/canvas-drawing-cables.md`

- [ ] **Layers Panel Component**
  - [ ] Layer list with eye (visibility), lock icons
  - [ ] Add/Delete/Rename layer
  - [ ] Drag-to-reorder layers (z-index)
  - [ ] Opacity slider per layer
  - [ ] See mockup in `.claude/features/canvas-drawing-cables.md`

- [ ] **Properties Panel Component**
  - [ ] Shape properties: fill, stroke, strokeWidth, opacity
  - [ ] Cable properties: type, routing mode, label
  - [ ] Text properties: fontSize, fontFamily, bold, italic
  - [ ] Multi-select: common properties only

#### Phase 4: Drawing Tools Implementation (8-10 hours)
- [ ] **Rectangle Tool**
  - [ ] Click-drag to draw
  - [ ] Konva.Rect component
  - [ ] Resizable handles when selected

- [ ] **Circle Tool**
  - [ ] Click-drag from center
  - [ ] Konva.Circle component
  - [ ] Radius handles when selected

- [ ] **Line Tool**
  - [ ] Click start, click end
  - [ ] Konva.Line component
  - [ ] Moveable endpoints

- [ ] **Arrow Tool**
  - [ ] Same as Line but with arrowhead
  - [ ] Konva.Arrow component

- [ ] **Text Tool**
  - [ ] Click to place, type text
  - [ ] Konva.Text component
  - [ ] Editable on double-click
  - [ ] Font size/family picker

- [ ] **Freehand Tool**
  - [ ] Mouse-down → draw path → mouse-up
  - [ ] Konva.Line with smooth curves
  - [ ] Simplify points on finish

- [ ] **Polygon Tool**
  - [ ] Click points, double-click to close
  - [ ] Konva.Line closed shape
  - [ ] Editable vertices

#### Phase 5: Cable System (6-8 hours)
- [ ] **Cable Drawing Workflow**
  - [ ] Step 1: Click source (asset/room/floor pin)
  - [ ] Step 2: Select cable type dropdown
  - [ ] Step 3: Click target (asset/room/floor pin)
  - [ ] Step 4: Choose routing mode (Straight/Orthogonal/Auto/Custom)
  - [ ] Step 5: Confirm (save to DB)

- [ ] **Routing Algorithms**
  - [ ] `STRAIGHT`: Direct line from A to B
  - [ ] `ORTHOGONAL`: 4 strategies (H-first, V-first, Shortest, Avoid-obstacles)
  - [ ] `AUTO`: A* pathfinding around shapes/assets
  - [ ] `CUSTOM`: User places waypoints, click-to-add nodes

- [ ] **Cable Rendering**
  - [ ] Konva.Line for cable path
  - [ ] Color by cable type (Network=blue, Power=red, etc.)
  - [ ] Dashed line if disconnected
  - [ ] Label at midpoint (optional)
  - [ ] Port labels at endpoints

- [ ] **Cable Bundling**
  - [ ] Detect overlapping cables
  - [ ] Group into visual bundle
  - [ ] Render as single thick line with count badge
  - [ ] Click to expand/collapse bundle

#### Phase 6: Backend API (4-5 hours)
- [ ] **Cable Controller** (`backend/src/controllers/cable.controller.ts`)
  - [ ] POST `/api/cables` - Create cable
  - [ ] GET `/api/cables/:floorId` or `/api/cables/:roomId` - List cables
  - [ ] PUT `/api/cables/:id` - Update cable (route, label, type)
  - [ ] DELETE `/api/cables/:id` - Delete cable
  - [ ] POST `/api/cables/bundle` - Create cable bundle

- [ ] **DrawingShape Controller** (`backend/src/controllers/drawing-shape.controller.ts`)
  - [ ] POST `/api/shapes` - Create shape
  - [ ] GET `/api/shapes/:floorId` or `/api/shapes/:roomId` - List shapes
  - [ ] PUT `/api/shapes/:id` - Update shape
  - [ ] DELETE `/api/shapes/:id` - Delete shape
  - [ ] PUT `/api/shapes/:id/layer` - Change shape layer/zIndex

- [ ] **Register routes in `server.ts`**

- [ ] **Frontend Services**
  - [ ] `cable.service.ts` - API calls for cables
  - [ ] `drawing-shape.service.ts` - API calls for shapes

#### Phase 7: Polish & Core Features (4-6 hours)
- [ ] **Undo/Redo**
  - [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  - [ ] History stack in store (max 50 actions)
  - [ ] Actions: add, delete, move, resize, style change

- [ ] **Multi-Select**
  - [ ] Click-drag selection rectangle
  - [ ] Shift+Click to add to selection
  - [ ] Bulk move/resize/delete
  - [ ] Group styling

- [ ] **Measurement Tool**
  - [ ] Calibration workflow (draw known distance, enter actual length)
  - [ ] Store scale in `FloorPlanScale` model (pixelsPerMeter)
  - [ ] Display real-world measurements on shapes/cables
  - [ ] Ruler overlay (optional)

- [ ] **Export**
  - [ ] PDF export with jsPDF (existing)
  - [ ] SVG export (Konva.Stage.toDataURL as SVG)
  - [ ] PNG/JPEG export (Konva.Stage.toDataURL)
  - [ ] JSON export (full state for backup)
  - [ ] Export options modal: format, include/exclude layers, cables

- [ ] **TypeScript Check**
  - [ ] `cd frontend && npx tsc --noEmit`
  - [ ] `cd backend && npx tsc --noEmit`

---

### V2 - Advanced Features (Future)

#### Phase 8: Essential V2 (5-7 days)
- [ ] **Grid & Snap Settings**
  - [ ] Toggle grid overlay
  - [ ] Configurable grid size (10px, 20px, 50px)
  - [ ] Snap to grid option
  - [ ] Snap to objects (edges, centers)

- [ ] **Context Menu (Right-Click)**
  - [ ] Copy, Paste, Duplicate
  - [ ] Bring to Front, Send to Back
  - [ ] Lock/Unlock, Show/Hide
  - [ ] Group/Ungroup

- [ ] **Rounded Shapes**
  - [ ] Rounded Rectangle (border-radius slider)
  - [ ] Ellipse/Oval (separate X/Y radius)

- [ ] **Calibration Tool UI**
  - [ ] Modal with instructions
  - [ ] Line drawing on canvas
  - [ ] Input field for actual length
  - [ ] Unit selector (meters, feet)

- [ ] **SVG Export**
  - [ ] Konva → SVG conversion
  - [ ] Preserve layers, styles
  - [ ] Scalable vector output

#### Phase 9: Professional Tools (7-10 days)
- [ ] **Symbol Library**
  - [ ] Categories: Electrical, Network, Safety, Furniture
  - [ ] 50+ pre-made symbols (SVG paths)
  - [ ] Drag-and-drop from sidebar
  - [ ] Custom symbol upload

- [ ] **Callouts/Annotations**
  - [ ] Speech bubble shapes
  - [ ] Arrow pointing to location
  - [ ] Text inside bubble
  - [ ] Style presets (Info, Warning, Note)

- [ ] **Dimension Lines**
  - [ ] Draw line with measurement arrows
  - [ ] Auto-calculate length (using scale)
  - [ ] Label with units

- [ ] **Port Diagrams**
  - [ ] Visual representation of device ports
  - [ ] Click port → highlight connected cables
  - [ ] Port status colors (active, inactive, error)

- [ ] **Mini-map Navigator**
  - [ ] Small overview of entire canvas
  - [ ] Viewport rectangle (draggable)
  - [ ] Useful for large floor plans

#### Phase 10: Advanced Features (8-13 days)
- [ ] **Path Tool (Pen Tool)**
  - [ ] Bezier curve drawing (Illustrator-style)
  - [ ] Click to add anchor points
  - [ ] Drag handles for curves
  - [ ] Edit mode: move/delete anchors

- [ ] **Eyedropper (Style Picker)**
  - [ ] Click shape → copy its style
  - [ ] Apply to selected shapes

- [ ] **Performance Optimizations**
  - [ ] Spatial Indexing (R-tree via rbush library)
  - [ ] Canvas Virtualization (only render visible viewport)
  - [ ] Shape Simplification (LOD - Level of Detail)

- [ ] **History Panel**
  - [ ] Visual undo/redo list
  - [ ] Jump to specific action
  - [ ] Action thumbnails

- [ ] **Cable Schedule/Report**
  - [ ] Auto-generated table of all cables
  - [ ] Columns: ID, Type, Source, Target, Length, Notes
  - [ ] Export as CSV/PDF

- [ ] **DXF Export**
  - [ ] AutoCAD-compatible format
  - [ ] Layer preservation
  - [ ] Use dxf-writer library

- [ ] **Smart Features**
  - [ ] Auto-Distribute (equal spacing between shapes)
  - [ ] Mirror/Flip (horizontal/vertical)
  - [ ] Rotate by exact degrees (input field)
  - [ ] Snap to Angles (0°, 45°, 90°, etc.)
  - [ ] Constraints (maintain relationships between shapes)
  - [ ] Smart Guides (alignment helpers, like Figma)

---

### Implementation Notes

**Key Technologies:**
- Konva.js (canvas rendering) - already integrated
- React Konva - React wrapper
- Zustand - state management for drawing tools
- Prisma - database models
- jsPDF - PDF export
- rbush (future) - spatial indexing for performance

**Architecture Decisions:**
- Cable connections support Asset→Asset, Room→Room, Floor→Floor, and mixed
- Cable bundling reduces visual clutter for parallel cables
- Layers enable complex drawings with selective visibility
- JSON data field in models allows flexible shape properties without schema changes
- Routing algorithms user-selectable, not auto-decided

**User Preferences:**
- User decides routing mode (no auto-assumptions)
- Both floor and room level support
- Export with layer/cable removal options
- Full layer management (add, delete, rename, reorder, lock, hide, opacity)
- Correctness prioritized over implementation speed

**Testing Checklist (Before "Done"):**
- [ ] TypeScript strict check (frontend + backend)
- [ ] Draw each shape type
- [ ] Create cable with all 4 routing modes
- [ ] Test undo/redo (10+ actions)
- [ ] Multi-select (5+ shapes)
- [ ] Export to all formats (PDF, SVG, PNG, JSON)
- [ ] Layer visibility/lock/opacity
- [ ] Cable bundling (create 5+ parallel cables)
- [ ] Measurement tool with calibration
- [ ] Properties panel updates on selection

**Timeline (Realistic with Claude):**
- Intensive (2-3 hours/day): 4 weeks for V1
- Normal (1-2 hours/day): 6 weeks for V1
- Casual (few sessions/week): 8-10 weeks for V1

---

## Νέα Features (v2.0)

### Phase A - Quick Wins

#### 1. Descriptive Error Messages (COMPLETE)
- [x] Audit all API error responses (backend) - 18 controllers audited
- [x] Created `backend/src/utils/errors.ts` - formatZodError utility
- [x] Updated 13 controllers with sendValidationError (44 replacements)
- [x] Fixed frontend `api.ts` - reads `error.error` field correctly
- [x] Test: Login wrong creds ✅, Invalid email ✅, Short password ✅, Existing email ✅
- [x] TypeScript check: Backend OK, Frontend OK
- **Status:** ✅ Complete

#### 2. Responsive UI & Mobile Nav
- [x] Fix sidebar: default closed on mobile
- [x] Add hamburger menu toggle
- [x] Overlay sidebar with backdrop on mobile
- [x] Auto-close sidebar on nav click (mobile)
- [x] TypeScript check: OK
- [ ] Fine-tune mobile margins/padding (αριστερά-δεξιά)
- [ ] Audit all pages for responsive issues on mobile
- **Status:** 🔶 Partial - βασικό responsive OK, χρειάζεται mobile fine-tuning

#### 3. Asset Floor Plan Button
- [x] Created `FloorPlanPreviewModal` component (HTML/CSS approach, no Konva)
- [x] Added "View on Floor Plan" button to AssetDetailPage (only when pin exists)
- [x] Pulsing marker at asset location with name label
- [x] Auto-scroll/center on the pin marker
- [x] Fixed back navigation for floor-level assets (was always `/rooms/...`)
- [x] Fixed location display for floor-level assets
- [x] Updated Asset interface with `floorplanUrl` fields
- [x] TypeScript check: OK
- **Status:** ✅ Complete

### Phase B - Medium Features

#### 4. Clients Management
- [x] Created Client model in Prisma schema (name, email, phone, address, contactPerson, notes)
- [x] Added `clientId` to Project model (optional FK → Client)
- [x] Created `client.controller.ts` (CRUD: list, get, create, update, delete)
- [x] Registered routes in `server.ts` → `/api/clients`
- [x] Created `client.service.ts` (frontend)
- [x] Created `ClientsPage` with card grid, search, create/edit/delete
- [x] Created `ClientDetailPage` with contact info + linked projects
- [x] Added routes in `App.tsx` (`/clients`, `/clients/:id`)
- [x] Added "Clients" menu item in Sidebar (Briefcase icon)
- [x] Updated `ProjectsPage` form: Client dropdown instead of text input
- [x] Updated `project.service.ts` & `project.controller.ts` with `clientId`
- [x] Added search placeholder for clients in Header
- [x] Fixed missing `Search` icon import in ProjectsPage (pre-existing bug)
- [x] Prisma generate + db push: OK
- [x] TypeScript check: Frontend OK, Backend OK
- **Status:** ✅ Complete

#### 5. Project Files
- [x] Created `ProjectFile` model + `FileCategory` enum in Prisma schema
- [x] Created `project-file.controller.ts` (GET list, POST upload, PUT category, DELETE)
- [x] Registered routes in `server.ts` → `/api/project-files`
- [x] Created `project-file.service.ts` (frontend) with upload via FormData
- [x] Added Files section to `ProjectDetailPage.tsx` with:
  - File list with category badges, sizes, dates
  - Upload button with category selector (PM/ADMIN only)
  - Category filter dropdown
  - Inline category change (hover)
  - View/Download/Delete buttons
  - Delete confirmation modal
- [x] Categories: Contracts, Drawings, Reports, Photos, Other
- [x] PM/ADMIN-only upload/delete permissions
- [x] Prisma generate + db push: OK
- [x] TypeScript check: Frontend OK, Backend OK
- [x] API Test: Upload (201), List (200), Delete (200) - all OK
- [x] Fixed dropdown styling (appearance-none, ChevronDown icon, design system colors)
- [x] TypeScript check: Frontend OK, Backend OK
- [ ] Visual testing by user
- **Status:** 🔶 Λειτουργεί - χρειάζεται visual check από χρήστη

### Phase C - Complex Features

#### 6. Calendar
- [x] Created `CalendarEvent` model + `CalendarEventType` enum in Prisma
- [x] Event types: Appointment, Reminder, Deadline, Meeting, Inspection, Delivery
- [x] Created `calendar.controller.ts` (CRUD + date range filter)
- [x] Registered routes in `server.ts` → `/api/calendar`
- [x] Created `calendar.service.ts` (frontend)
- [x] Created `CalendarPage` with:
  - Monthly view (custom grid, no external lib)
  - Weekly view toggle
  - Color-coded events by type
  - Day click → event list popup
  - Create/Edit/Delete event modals
  - Project association (optional)
  - All-day vs timed events
  - Event type legend
  - Search integration
- [x] Added `/calendar` route in App.tsx
- [x] Added Calendar menu item in Sidebar (Overview section)
- [x] Search placeholder for calendar in Header
- [x] Prisma generate + db push: OK
- [x] TypeScript check: Frontend OK, Backend OK
- [x] API Test: Create (201), List (200) - all OK
- [ ] Recurring events (future)
- [ ] Notifications/reminders (future)
- [x] Invite/Attendees system:
  - [x] CalendarEventAttendee model + AttendeeStatus enum
  - [x] Backend: attendeeIds in create/update, respond endpoint, overlap check
  - [x] Frontend: invite user picker, accept/decline buttons, overlap warning toast
  - [x] Prisma generate + db push: OK
  - [x] TypeScript check: Frontend OK, Backend OK
  - [x] API Test: Create with invites (201), Respond (200), Overlap detection working
- **Status:** ✅ Complete (recurring/notifications pending)

#### 7. Messenger
- [x] Created Conversation, ConversationParticipant, Message models in Prisma
- [x] Created `messenger.controller.ts` (conversations CRUD, messages, unread count, mark read)
- [x] Created `messenger.service.ts` (frontend API client)
- [x] Created `MessengerPage` with split layout:
  - Left: Conversation list with search, unread badges, last message preview
  - Right: Chat bubbles (mine=blue/right, others=gray/left), date separators
  - Message input with Enter to send
  - Auto-scroll to latest message
- [x] New Chat modal with user picker, group toggle, search
- [x] Polling: conversations every 5s, messages every 3s
- [x] Mark as read on conversation open
- [x] 1:1 chat dedup (reuses existing conversation)
- [x] Route `/messenger` in App.tsx
- [x] Sidebar menu item (MessageSquare icon)
- [x] Header search placeholder
- [x] Prisma generate + db push: OK
- [x] TypeScript: Frontend OK, Backend OK
- [x] API Tests: Create conv (201), Send msg (201), List msgs (200), Unread (200), Group chat (201)
- [ ] WebSocket upgrade (future)
- [ ] File sharing in messages (future)
- **Status:** ✅ Complete (polling-based, WebSocket upgrade pending)

---

## Ολοκληρωμένα Σήμερα

### Business Flows Documentation (Complete)
- [x] Created `docs/BUSINESS-FLOWS.md`
- [x] Bilingual document (English + Greek)
- [x] Comprehensive sections:
  - Executive Summary
  - System Overview with architecture diagram
  - User Roles & Permissions matrix
  - Entity Hierarchy with Mermaid diagrams
  - Business Flows (7 flows with diagrams):
    - Project Setup Flow
    - Equipment Lifecycle
    - Issue Management Flow
    - Checklist Workflow
    - Label Management Flow
    - Inventory Management Flow
    - Reporting Flow
  - Status Transitions (state machines)
  - Integration Points
  - Glossary (EN/EL)

### Time Tracking Module Removed (Complete)
- [x] Documented specs in `.claude/todo-future-features.md`
- [x] Deleted `frontend/src/pages/time-tracking/` folder
- [x] Deleted `frontend/src/services/timeentry.service.ts`
- [x] Deleted `backend/src/controllers/timeentry.controller.ts`
- [x] Removed route from `App.tsx`
- [x] Removed menu item from `Sidebar.tsx`
- [x] Removed routes from `server.ts`
- [x] Removed `TimeEntry` model from schema.prisma
- [x] Removed `TimeEntryType` enum from schema.prisma
- [x] TypeScript check: OK

### Fullscreen Popup Z-Index Fix (Complete)
- [x] Fixed popups appearing behind fullscreen modals
- [x] Added `nested` prop to Modal component (z-[80])
- [x] Updated FloorPlanCanvas popups: z-40→z-[60], z-50→z-[70]
- [x] Updated RoomPlanCanvas popups: z-40→z-[60], z-50→z-[70]
- [x] Updated BuildingDetailPage nested modals (Add/Edit/Delete Floor)
- [x] Updated FloorDetailPage nested modals (Room/Asset modals, Import)
- [x] Updated RoomDetailPage nested modals (Asset modals, Import)
- [x] Updated ProjectDetailPage nested modals (Add/Delete Building)
- [x] Updated ImportInventoryModal with nested prop
- [x] TypeScript check: OK

### Project Filters (Complete)
- [x] Added project filter dropdown to ChecklistsPage
- [x] Added project filter dropdown to IssuesPage
- [x] Fixed ChecklistsPage data path (added missing `building` layer)
- [x] TypeScript check: OK

### Report Metrics Fix (Complete)
- [x] Investigated Project Metrics calculation
- [x] Found issue: floor-level assets not counted
- [x] Fixed `/summary`, `/client`, `/assets` endpoints
- [x] Fixed PDF export queries
- [x] Added OR condition for floor-level assets
- [x] TypeScript check: OK
- [x] Tested API response matches database

### Sortable Table Columns (Complete)
- [x] Created `useSortable` hook for reusable sorting
- [x] Created `SortableHeader` component with chevron icons
- [x] Updated 10 tables across 7 pages:
  - UsersPage, ChecklistsPage, InventoryPage (2), FloorDetailPage (2)
  - RoomDetailPage, ReportsPage (3)
- [x] Support for nested object sorting
- [x] Sort direction cycles: asc → desc → none
- [x] TypeScript check: OK
- [x] Commit: `f591b15`
- [x] Pushed to main

### AssetsPage Restructure (Complete)
- [x] Group assets by project (accordion style)
- [x] Per-project search field (visible when expanded)
- [x] Only show assets assigned to floor/room
- [x] Asset cards with icon, name, type, location, status
- [x] Expand All / Collapse All buttons
- [x] Updated Manual with new features
- [x] Commits: `2b29b5c`, `6b1612d`
- [x] Pushed to main

### BuildingDetailPage Fullscreen (Complete)
- [x] Added fullscreen modal for floor plan
- [x] Edit mode toggle in fullscreen
- [x] Commit: `2b29b5c`
- [x] Pushed to main

---

### RoomsPage & Room Type Icons (Complete)
- [x] Added /rooms route with rooms grouped by project
- [x] Added "Rooms" menu item in Sidebar (below Floors)
- [x] Installed react-icons library
- [x] Created IconPicker component with 60+ room icons
- [x] Updated LookupsPage for room type icon selection
- [x] Updated room.controller.ts to include roomTypeIcon
- [x] Updated seed.ts with icons for all 20 room types
- [x] Updated existing room types in database with icons
- [x] Commit: `38064b1`
- [x] Pushed to main

### FloorsPage Restructure (Complete)
- [x] Group floors by project (accordion style)
- [x] Show building name in each floor card
- [x] Sort: project → building → floor level
- [x] Commit: `b1eb778`
- [x] Pushed to main

### Custom Date Picker (Complete)
- [x] Installed react-datepicker + date-fns
- [x] Created DateInput component with English locale
- [x] Added dark theme CSS styling
- [x] Replaced all native date inputs (Projects, Time Tracking)
- [x] Commit: `95fc493`
- [x] Pushed to main

### Global Search (Complete)
- [x] Created search.store.ts (Zustand)
- [x] Header search context-aware (placeholder per page)
- [x] Removed local search from 7 list pages
- [x] Auto-clear on section navigation
- [x] Commit: `95fc493`
- [x] Pushed to main

### Checklist Templates Drag & Drop (Complete)
- [x] Installed @dnd-kit libraries
- [x] Created SortableItem component
- [x] Accordion behavior (one open at a time)
- [x] Commit: `170a04a`
- [x] Pushed to main

### TypeScript Production Build Fix (Complete)
- [x] Fixed 25+ TypeScript strict mode errors
- [x] Removed unused imports/variables (not underscore prefix)
- [x] Fixed asset path (floor.building.project)
- [x] Fixed type mismatches (pinX/pinY accepts null)
- [x] Commits: `0f0a698`, `da78485`, `7ebb96f`
- [x] Pushed to main
- [x] Production frontend/backend running

### Pending on Cloud
- [ ] Run `prisma db push --force-reset` on cloud
- [ ] Run `prisma db seed` on cloud

### Floor Plan Visibility Toggle (Settings)
- [x] Created `ui.store.ts` (Zustand + persist middleware)
- [x] Added "Interface" tab in SettingsPage
- [x] Toggle: "Hide Floor Plans by Default"
- [x] Applied to FloorDetailPage, RoomDetailPage, ProjectDetailPage, BuildingDetailPage
- [x] Setting persisted in localStorage
- [x] TypeScript check: OK
- [x] Git commits: `8b9a893`, `aa5b380`
- [x] Pushed to main

### Import from Inventory Modal
- [x] Created `ImportInventoryModal` component with multi-select
- [x] Integrated in FloorDetailPage (Add Asset button)
- [x] Integrated in RoomDetailPage (Add Asset button)
- [x] Bulk import handler with parallel API calls
- [x] TypeScript check: OK

### Manual Update (Comprehensive)
- [x] Added BuildingsSection (Project hierarchy)
- [x] Added LookupsSection (Room Types, Manufacturers, Asset Models, etc.)
- [x] Added ChecklistTemplatesSection
- [x] Updated FloorsSection (floor-level assets, draggable popups, type choice)
- [x] Updated RoomsSection (Import from Inventory, View/Edit, Remove from Plan)
- [x] Updated InventorySection (Equipment/Materials tabs, status lifecycle)
- [x] Added 7 new FAQ questions
- [x] TypeScript check: OK

### Codebase Review
- [x] Έλεγχος για bugs σε όλο το codebase
- [x] Εντοπισμός dead/unused code
- [x] Cleanup: Removed `updateOrderSchema` from lookup.controller.ts

### Frontend Unused Code (Low Priority - Keep for Future)
- PhotoGalleryCompact, PhotoUploaderCompact, OfflineIndicatorCompact, QRCodeCompact
- PhotoAnnotator, InstallButton, SignatureDisplay, DownloadFloorplanDropdown
- signature.service.ts (unused but may be needed later)

---

## Ολοκληρωμένα (2026-02-05)

### Git Commit & Push
- [x] TypeScript check (Frontend OK, Backend OK)
- [x] Git commit: `d418dca`
- [x] Git push to main

### CLAUDE.md Update
- [x] Νέο section: "ΥΠΟΧΡΕΩΤΙΚΟ Workflow"
- [x] Κανόνες: Κατανόηση → Σχέδιο → Todo → Test
- [x] Ενημέρωση ΠΟΤΕ/ΠΑΝΤΑ rules

### MD Files Update
- [x] Compressed history.md (27k → ~2k tokens)
- [x] Updated todo.md
- [x] Updated chat-history.md

---

## Ολοκληρωμένα (2026-02-04)

### Draggable Popups
- [x] FloorPlanCanvas: draggable from header
- [x] RoomPlanCanvas: draggable from header
- [x] Popup position persistence across steps
- [x] Reset position only on new canvas click

### Room Plan Features
- [x] View/Edit popup for placed asset pins
- [x] Remove from Plan option
- [x] Import from Inventory (replaced Create New)
- [x] Connected to project inventory

### UI Improvements
- [x] Unified popup sizes (min-w-[280px])
- [x] Larger icons (w-12 h-12)
- [x] Better visual consistency

---

*Cleaned: 2026-02-05*
