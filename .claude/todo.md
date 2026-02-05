# Synax - Τρέχουσες Εργασίες

**Τελευταία Ενημέρωση:** 2026-02-05

---

## Ολοκληρωμένα Σήμερα

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
