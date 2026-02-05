# Canvas Drawing & Cables System - Implementation Plan

## 📋 Overview

Επέκταση του FloorPlanCanvas & RoomPlanCanvas για να γίνουν πλήρη εργαλεία σχεδίασης με:
- **Cables/Connections System** - Διασυνδέσεις μεταξύ assets
- **Drawing Tools** - Shapes, annotations, measurements
- **Layers Management** - Z-index, visibility, locking
- **Export Enhancement** - PDF με cables/shapes

---

## 🎯 ΚΑΤΑΝΟΗΣΗ - Τι Θέλουμε

### User Requirements (από chat)

1. **Cable System**
   - Σχεδίαση καλωδίων μεταξύ assets
   - Διάφοροι τύποι: Ethernet, Fiber, Power, HDMI, κλπ
   - User επιλέγει routing mode:
     - Straight line (ευθεία)
     - Orthogonal (90° γωνίες)
     - Auto-pathfinding (smart, αποφεύγει obstacles)
     - Custom (editable waypoints)
   - Όλα editable μετά τη δημιουργία
   - Ports, labels, length, notes
   - Visual styles (colors, dash patterns)

2. **Drawing Tools**
   - Shapes: Rectangle, Circle, Line, Arrow, Polygon
   - Text annotations
   - Freehand drawing
   - Measurement tool (με scale)
   - Editable properties (fill, stroke, opacity)

3. **Scope**
   - Floor-level ΚΑΙ room-level
   - Και τα δύο canvas components

4. **Export**
   - PDF με cables/shapes
   - Επιλογές τι να συμπεριληφθεί (toggles)
   - Cable legend/table

5. **Layers**
   - Full layer management
   - Z-index control
   - Lock/unlock layers
   - Show/hide layers

6. **UX**
   - Toolbar με tools (όπως Figma/CAD)
   - Keyboard shortcuts
   - Undo/Redo
   - Multi-select & group
   - Drag handles για resize/edit

---

## 🏗️ ΑΡΧΙΤΕΚΤΟΝΙΚΗ

### Current State (Υπάρχον System)

**Components:**
- `FloorPlanCanvas.tsx` - Floor plan με room pins & asset pins
- `RoomPlanCanvas.tsx` - Room plan με asset pins μόνο
- Konva.js library για canvas rendering
- Zoom/Pan με lock/unlock
- Drag & drop pins
- Asset type SVG icons

**Data Flow:**
```
Page → Canvas Component → Konva Stage → Layer → Shapes/Groups
                ↓
        Props: assets, pins, callbacks
```

### Target State (Μετά την Επέκταση)

**New Components:**
```
components/canvas/
├── tools/
│   ├── DrawingToolbar.tsx       - Vertical tool palette (left sidebar)
│   ├── CableToolbar.tsx         - Cable-specific controls
│   ├── LayersPanel.tsx          - Layer visibility/lock/reorder
│   └── PropertiesPanel.tsx      - Selected shape properties
├── shapes/
│   ├── ShapeRenderer.tsx        - Renders DrawingShape objects
│   ├── CableRenderer.tsx        - Renders Cable with routing
│   └── MeasurementLine.tsx      - Distance measurement tool
├── modals/
│   ├── CableModal.tsx           - Cable properties editor
│   └── ShapePropertiesModal.tsx - Shape style editor
└── hooks/
    ├── useCanvasDrawing.ts      - Drawing tool state & logic
    ├── useCableDrawing.ts       - Cable creation workflow
    ├── useCableRouting.ts       - Routing algorithms
    └── useCanvasHistory.ts      - Undo/Redo system
```

**Enhanced Data Flow:**
```
Page → Canvas Component → Tool State → Drawing/Cable Hooks
         ↓                    ↓
    Konva Stage          Backend API
         ↓                    ↓
   Multiple Layers      Prisma Models
    (cables, shapes,
     assets, annotations)
```

---

## 💾 DATA MODELS

### Backend - Prisma Schema

```prisma
model Cable {
  id              String      @id @default(cuid())
  floorId         String?
  roomId          String?
  sourceAssetId   String
  targetAssetId   String
  cableType       CableType
  routingMode     RoutingMode @default(STRAIGHT)
  routingPoints   Json?       // [{x, y}] waypoints for CUSTOM mode
  label           String?
  portSource      String?     // e.g., "Port 1"
  portTarget      String?     // e.g., "Port 8"
  length          Float?      // meters
  notes           String?
  style           Json?       // {color, strokeWidth, dashPattern}
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  floor           Floor?      @relation(fields: [floorId], references: [id], onDelete: Cascade)
  room            Room?       @relation(fields: [roomId], references: [id], onDelete: Cascade)
  sourceAsset     Asset       @relation("CableSource", fields: [sourceAssetId], references: [id], onDelete: Cascade)
  targetAsset     Asset       @relation("CableTarget", fields: [targetAssetId], references: [id], onDelete: Cascade)

  @@index([floorId])
  @@index([roomId])
  @@index([sourceAssetId])
  @@index([targetAssetId])
}

enum CableType {
  ETHERNET_CAT6
  FIBER_OPTIC
  POWER
  COAXIAL
  HDMI
  USB
  CUSTOM
}

enum RoutingMode {
  STRAIGHT      // Direct line A→B
  ORTHOGONAL    // 90° angles (Manhattan routing)
  AUTO          // Smart pathfinding (avoids obstacles)
  CUSTOM        // User-defined waypoints
}

model DrawingShape {
  id        String    @id @default(cuid())
  floorId   String?
  roomId    String?
  type      ShapeType
  layer     String    @default("shapes")  // 'background', 'shapes', 'annotations', etc.
  zIndex    Int       @default(0)
  locked    Boolean   @default(false)
  visible   Boolean   @default(true)
  data      Json      // Shape-specific data: {x, y, width, height, points, text, etc.}
  style     Json      // {fill, stroke, strokeWidth, opacity, rotation}
  label     String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  floor     Floor?    @relation(fields: [floorId], references: [id], onDelete: Cascade)
  room      Room?     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([floorId])
  @@index([roomId])
  @@index([layer, zIndex])
}

enum ShapeType {
  RECTANGLE
  CIRCLE
  POLYGON
  LINE
  ARROW
  TEXT
  FREEHAND
}
```

### Frontend - TypeScript Types

```typescript
// frontend/src/types/canvas.types.ts

export interface Cable {
  id: string;
  floorId?: string;
  roomId?: string;
  sourceAssetId: string;
  targetAssetId: string;
  cableType: CableType;
  routingMode: RoutingMode;
  routingPoints?: Point[];
  label?: string;
  portSource?: string;
  portTarget?: string;
  length?: number;
  notes?: string;
  style?: CableStyle;
  createdAt: string;
  updatedAt: string;
  // Populated from relations
  sourceAsset?: Asset;
  targetAsset?: Asset;
}

export interface CableStyle {
  color?: string;
  strokeWidth?: number;
  dashPattern?: number[];
  arrowType?: 'single' | 'double' | 'none';
}

export enum CableType {
  ETHERNET_CAT6 = 'ETHERNET_CAT6',
  FIBER_OPTIC = 'FIBER_OPTIC',
  POWER = 'POWER',
  COAXIAL = 'COAXIAL',
  HDMI = 'HDMI',
  USB = 'USB',
  CUSTOM = 'CUSTOM',
}

export enum RoutingMode {
  STRAIGHT = 'STRAIGHT',
  ORTHOGONAL = 'ORTHOGONAL',
  AUTO = 'AUTO',
  CUSTOM = 'CUSTOM',
}

export interface DrawingShape {
  id: string;
  floorId?: string;
  roomId?: string;
  type: ShapeType;
  layer: string;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  data: ShapeData;
  style: ShapeStyle;
  label?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShapeData =
  | RectangleData
  | CircleData
  | PolygonData
  | LineData
  | ArrowData
  | TextData
  | FreehandData;

export interface RectangleData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface CircleData {
  x: number;
  y: number;
  radius: number;
}

export interface PolygonData {
  points: Point[]; // Array of {x, y}
}

export interface LineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ArrowData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pointerLength?: number;
  pointerWidth?: number;
}

export interface TextData {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FreehandData {
  points: number[]; // Flat array: [x1, y1, x2, y2, ...]
  tension?: number; // For curve smoothing
}

export interface ShapeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  dashPattern?: number[];
}

export enum ShapeType {
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  POLYGON = 'POLYGON',
  LINE = 'LINE',
  ARROW = 'ARROW',
  TEXT = 'TEXT',
  FREEHAND = 'FREEHAND',
}

export interface Point {
  x: number;
  y: number;
}

export type DrawingTool =
  | 'select'
  | 'cable'
  | 'rectangle'
  | 'circle'
  | 'polygon'
  | 'line'
  | 'arrow'
  | 'text'
  | 'freehand'
  | 'measure';

export interface Layer {
  id: string;
  name: string;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

export interface CanvasState {
  cables: Cable[];
  shapes: DrawingShape[];
  selectedItemIds: string[];
}

// Cable style presets
export const CABLE_STYLES: Record<CableType, CableStyle> = {
  ETHERNET_CAT6: {
    color: '#3b82f6',
    strokeWidth: 3,
    dashPattern: [],
    arrowType: 'double',
  },
  FIBER_OPTIC: {
    color: '#22c55e',
    strokeWidth: 2,
    dashPattern: [],
    arrowType: 'double',
  },
  POWER: {
    color: '#ef4444',
    strokeWidth: 4,
    dashPattern: [],
    arrowType: 'single',
  },
  COAXIAL: {
    color: '#f59e0b',
    strokeWidth: 3,
    dashPattern: [10, 5],
    arrowType: 'single',
  },
  HDMI: {
    color: '#8b5cf6',
    strokeWidth: 3,
    dashPattern: [],
    arrowType: 'single',
  },
  USB: {
    color: '#06b6d4',
    strokeWidth: 2,
    dashPattern: [],
    arrowType: 'single',
  },
  CUSTOM: {
    color: '#64748b',
    strokeWidth: 2,
    dashPattern: [],
    arrowType: 'none',
  },
};

// Default layers
export const DEFAULT_LAYERS: Layer[] = [
  { id: 'background', name: 'Background', zIndex: 0, visible: true, locked: false },
  { id: 'cables', name: 'Cables', zIndex: 1, visible: true, locked: false },
  { id: 'shapes', name: 'Shapes', zIndex: 2, visible: true, locked: false },
  { id: 'assets', name: 'Assets', zIndex: 3, visible: true, locked: false },
  { id: 'annotations', name: 'Annotations', zIndex: 4, visible: true, locked: false },
];
```

---

## 🛠️ IMPLEMENTATION PLAN - PHASES

### ✅ PHASE 1: Foundation & Data Models (2 days)

**Goal:** Database schema, types, και API services έτοιμα

#### Tasks:

- [ ] **1.1 Backend - Prisma Schema**
  - [ ] Add `Cable` model to `schema.prisma`
  - [ ] Add `DrawingShape` model
  - [ ] Add enums: `CableType`, `RoutingMode`, `ShapeType`
  - [ ] Add relations to `Floor`, `Room`, `Asset`
  - [ ] Run migration: `npx prisma migrate dev --name add_canvas_drawing_cables`
  - [ ] Update seed data (optional test cables/shapes)

- [ ] **1.2 Frontend - TypeScript Types**
  - [ ] Create `frontend/src/types/canvas.types.ts`
  - [ ] Define all interfaces/enums from above
  - [ ] Export constants: `CABLE_STYLES`, `DEFAULT_LAYERS`

- [ ] **1.3 Frontend - API Services**
  - [ ] Create `frontend/src/services/cable.service.ts`
    - [ ] `getCablesByFloor(floorId)`
    - [ ] `getCablesByRoom(roomId)`
    - [ ] `createCable(data)`
    - [ ] `updateCable(id, data)`
    - [ ] `deleteCable(id)`
  - [ ] Create `frontend/src/services/shape.service.ts`
    - [ ] `getShapesByFloor(floorId)`
    - [ ] `getShapesByRoom(roomId)`
    - [ ] `createShape(data)`
    - [ ] `updateShape(id, data)`
    - [ ] `deleteShape(id)`
    - [ ] `reorderShapes(updates)` - bulk z-index update

- [ ] **1.4 Test Migration**
  - [ ] Verify database schema
  - [ ] Test API service calls (mock data)

**Deliverable:** Database ready, types defined, API services scaffolded

---

### ✅ PHASE 2: Drawing Tools UI (2 days)

**Goal:** Toolbar, layers panel, tool state management

#### Tasks:

- [ ] **2.1 State Management**
  - [ ] Create Zustand store: `frontend/src/stores/canvasStore.ts`
    ```typescript
    interface CanvasStore {
      activeTool: DrawingTool;
      setActiveTool: (tool: DrawingTool) => void;
      cables: Cable[];
      shapes: DrawingShape[];
      selectedItemIds: string[];
      layers: Layer[];
      // ... actions
    }
    ```
  - [ ] Or use Context API if preferred

- [ ] **2.2 DrawingToolbar Component**
  - [ ] Create `frontend/src/components/canvas/tools/DrawingToolbar.tsx`
  - [ ] Tool buttons: Select, Cable, Rectangle, Circle, Line, Arrow, Text, Freehand
  - [ ] Active tool highlighting
  - [ ] Tooltips με shortcuts

- [ ] **2.3 LayersPanel Component**
  - [ ] Create `frontend/src/components/canvas/tools/LayersPanel.tsx`
  - [ ] List all layers
  - [ ] Eye icon - toggle visibility
  - [ ] Lock icon - toggle locked
  - [ ] Drag to reorder (optional Phase 6)

- [ ] **2.4 Keyboard Shortcuts Hook**
  - [ ] Create `frontend/src/hooks/useKeyboardShortcuts.ts`
  - [ ] V - Select, C - Cable, R - Rectangle, O - Circle, L - Line, A - Arrow, T - Text, P - Pencil
  - [ ] Ctrl+Z - Undo, Ctrl+Shift+Z - Redo
  - [ ] Delete/Backspace - Delete selected

- [ ] **2.5 Integrate into Canvas**
  - [ ] Update `FloorPlanCanvas.tsx` to include `<DrawingToolbar />`
  - [ ] Update `RoomPlanCanvas.tsx` same
  - [ ] Position toolbar: `absolute left-2 top-1/2 -translate-y-1/2`

**Deliverable:** UI controls visible, tool selection works

---

### ✅ PHASE 3: Shape Drawing Implementation (3 days)

**Goal:** User μπορεί να σχεδιάσει shapes στο canvas

#### Tasks:

- [ ] **3.1 useCanvasDrawing Hook**
  - [ ] Create `frontend/src/hooks/useCanvasDrawing.ts`
  - [ ] State: `isDrawing`, `currentShape`, `startPoint`
  - [ ] Handlers: `handleMouseDown`, `handleMouseMove`, `handleMouseUp`
  - [ ] Logic για κάθε tool type (rectangle, circle, line)

- [ ] **3.2 ShapeRenderer Component**
  - [ ] Create `frontend/src/components/canvas/shapes/ShapeRenderer.tsx`
  - [ ] Switch case για κάθε `ShapeType`
  - [ ] Render Konva components: `<Rect>`, `<Circle>`, `<Line>`, `<Arrow>`, `<Text>`, `<Path>`
  - [ ] Props: `shape`, `isSelected`, `onSelect`, `onUpdate`, `onDelete`

- [ ] **3.3 Rectangle Tool**
  - [ ] Click & drag → draw rectangle
  - [ ] Show dimensions while drawing
  - [ ] Save to backend on release

- [ ] **3.4 Circle Tool**
  - [ ] Click (center) & drag (radius) → draw circle
  - [ ] Show radius while drawing

- [ ] **3.5 Line Tool**
  - [ ] Click start → Click end → draw line
  - [ ] Show length while drawing

- [ ] **3.6 Arrow Tool**
  - [ ] Same as line + arrow head
  - [ ] Configurable pointer size

- [ ] **3.7 Text Tool**
  - [ ] Click → open text input modal
  - [ ] Place text at click position
  - [ ] Editable: double-click text

- [ ] **3.8 Freehand Tool**
  - [ ] Press & drag → continuous path
  - [ ] Simplify/smooth path on release
  - [ ] Use Konva `<Line>` με bezier curves

- [ ] **3.9 Selection & Editing**
  - [ ] Click shape → select (highlight με border)
  - [ ] Use Konva `<Transformer>` για resize handles
  - [ ] Drag shape → move
  - [ ] Delete key → remove shape

- [ ] **3.10 Integrate into Canvas**
  - [ ] Add shapes layer to `<Stage>`
  - [ ] Render all shapes με `ShapeRenderer`
  - [ ] Connect drawing hook to mouse events
  - [ ] Save shapes to backend after draw

**Deliverable:** User μπορεί να σχεδιάσει και edit shapes

---

### ✅ PHASE 4: Cable System (3 days)

**Goal:** Cables μεταξύ assets με routing options

#### Tasks:

- [ ] **4.1 useCableDrawing Hook**
  - [ ] Create `frontend/src/hooks/useCableDrawing.ts`
  - [ ] State machine:
    - `idle` → Click asset → `selecting-target`
    - `selecting-target` → Click asset → Create cable → `idle`
  - [ ] Visual feedback: source asset glowing while selecting target

- [ ] **4.2 Cable Routing Algorithms**
  - [ ] Create `frontend/src/hooks/useCableRouting.ts`
  - [ ] **Straight:** `[x1, y1, x2, y2]`
  - [ ] **Orthogonal:** Calculate right-angle path
    ```typescript
    function calculateOrthogonalPath(x1, y1, x2, y2): number[] {
      const midX = (x1 + x2) / 2;
      return [x1, y1, midX, y1, midX, y2, x2, y2];
    }
    ```
  - [ ] **Auto:** A* pathfinding που αποφεύγει pins
    ```typescript
    function calculateAutoPath(x1, y1, x2, y2, obstacles: Point[]): number[] {
      // Simplified A* or visibility graph
      // Return array of waypoints
    }
    ```
  - [ ] **Custom:** User-defined waypoints (editable)

- [ ] **4.3 CableRenderer Component**
  - [ ] Create `frontend/src/components/canvas/shapes/CableRenderer.tsx`
  - [ ] Render Konva `<Arrow>` or `<Line>`
  - [ ] Apply routing mode to calculate `points` array
  - [ ] Style based on `cableType` (color, width, dash)
  - [ ] Show label at midpoint
  - [ ] Render waypoint circles για CUSTOM mode (draggable)

- [ ] **4.4 Cable Creation Workflow**
  - [ ] User clicks Cable tool
  - [ ] Click source asset → visual feedback (glow)
  - [ ] Cursor changes to crosshair με cable icon
  - [ ] Hover over target assets → highlight
  - [ ] Click target asset → CableModal opens

- [ ] **4.5 CableModal Component**
  - [ ] Create `frontend/src/components/canvas/modals/CableModal.tsx`
  - [ ] Form fields:
    - Cable Type (dropdown)
    - Routing Mode (dropdown)
    - Label (text)
    - Source Port (text)
    - Target Port (text)
    - Length (number, auto-calculated από distance)
    - Notes (textarea)
  - [ ] Preview cable με selected style
  - [ ] Save → Create cable in backend
  - [ ] Cancel → Remove temp cable

- [ ] **4.6 Cable Editing**
  - [ ] Click cable → select (highlight με glow)
  - [ ] Show popup με actions: Edit, Delete
  - [ ] Edit → Open CableModal με current data
  - [ ] Change routing mode → re-calculate path
  - [ ] Drag waypoints (CUSTOM mode only)

- [ ] **4.7 Cable Filtering**
  - [ ] Dropdown: "Show cables by type"
  - [ ] Checkboxes: Ethernet, Fiber, Power, etc.
  - [ ] Hide unselected cable types

- [ ] **4.8 Integrate into Canvas**
  - [ ] Add cables layer to `<Stage>` (zIndex: 1)
  - [ ] Render all cables με `CableRenderer`
  - [ ] Connect cable hook to asset click events
  - [ ] Fetch cables from backend on mount

**Deliverable:** User μπορεί να δημιουργήσει και edit cables μεταξύ assets

---

### ✅ PHASE 5: Backend API (2 days)

**Goal:** REST API για cables και shapes

#### Tasks:

- [ ] **5.1 Cable Controller**
  - [ ] Create `backend/src/controllers/cable.controller.ts`
  - [ ] `POST /api/cables` - Create cable
  - [ ] `GET /api/cables/floor/:floorId` - Get all cables για floor
  - [ ] `GET /api/cables/room/:roomId` - Get all cables για room
  - [ ] `PUT /api/cables/:id` - Update cable
  - [ ] `DELETE /api/cables/:id` - Delete cable
  - [ ] Include relations: `sourceAsset`, `targetAsset`

- [ ] **5.2 Shape Controller**
  - [ ] Create `backend/src/controllers/shape.controller.ts`
  - [ ] `POST /api/shapes` - Create shape
  - [ ] `GET /api/shapes/floor/:floorId` - Get shapes για floor (ordered by zIndex)
  - [ ] `GET /api/shapes/room/:roomId` - Get shapes για room
  - [ ] `PUT /api/shapes/:id` - Update shape
  - [ ] `DELETE /api/shapes/:id` - Delete shape
  - [ ] `PATCH /api/shapes/reorder` - Bulk update zIndex (για layer reordering)

- [ ] **5.3 Validation**
  - [ ] Use Zod schemas για request validation
  - [ ] Cable validation:
    - `sourceAssetId` and `targetAssetId` must exist
    - Both assets must be on same floor/room
    - `routingPoints` must be valid JSON array
  - [ ] Shape validation:
    - `data` and `style` must be valid JSON
    - `zIndex` must be number

- [ ] **5.4 Routes**
  - [ ] Create `backend/src/routes/cable.routes.ts`
  - [ ] Create `backend/src/routes/shape.routes.ts`
  - [ ] Register routes in `backend/src/server.ts`

- [ ] **5.5 Tests (Optional)**
  - [ ] Unit tests για controllers
  - [ ] Integration tests με test database

**Deliverable:** Backend API functional και tested

---

### ✅ PHASE 6: Polish & Advanced Features (3 days)

**Goal:** UX improvements, undo/redo, export, performance

#### Tasks:

- [ ] **6.1 Undo/Redo System**
  - [ ] Create `frontend/src/hooks/useCanvasHistory.ts`
  - [ ] State: `history: CanvasState[]`, `historyIndex: number`
  - [ ] `saveState()` - snapshot current canvas state
  - [ ] `undo()` - restore previous state
  - [ ] `redo()` - restore next state
  - [ ] Integrate με keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  - [ ] Max history size: 50 states

- [ ] **6.2 Multi-Select**
  - [ ] Click-drag selection box (Konva `<Rect>` με dashed border)
  - [ ] Shift+Click → add to selection
  - [ ] Bulk delete: Delete key → remove all selected
  - [ ] Bulk move: Drag one → move all selected

- [ ] **6.3 Group/Ungroup**
  - [ ] Toolbar button: Group selected items
  - [ ] Create logical group (store group IDs)
  - [ ] Move group together
  - [ ] Ungroup → separate items

- [ ] **6.4 Alignment Tools**
  - [ ] Toolbar: Align Left, Center, Right, Top, Middle, Bottom
  - [ ] Distribute Horizontally/Vertically
  - [ ] Works on multi-selected shapes

- [ ] **6.5 Shape Properties Panel**
  - [ ] Create `frontend/src/components/canvas/tools/PropertiesPanel.tsx`
  - [ ] Show when shape selected
  - [ ] Live edit: Fill color, Stroke color, Stroke width, Opacity
  - [ ] Color picker component
  - [ ] Apply changes on blur

- [ ] **6.6 Measurement Tool**
  - [ ] Create `frontend/src/components/canvas/shapes/MeasurementLine.tsx`
  - [ ] Click start → Click end → draw line με distance label
  - [ ] Calculate distance in meters (based on floor plan scale)
  - [ ] Store scale in floor metadata: `pixelsPerMeter`

- [ ] **6.7 PDF Export Enhancement**
  - [ ] Extend `DownloadFloorplanModal.tsx`
  - [ ] Checkboxes:
    - [ ] Include Cables
    - [ ] Include Shapes
    - [ ] Include Annotations
    - [ ] Include Cable Legend
  - [ ] Temporarily show hidden layers για export
  - [ ] Add cable table to PDF:
    ```
    Cable Connections:
    1. Router-01 (Port 1) → Switch-02 (Port 8) - Ethernet Cat6 - 15.2m
    2. Switch-02 (Port 2) → AP-03 - Ethernet Cat6 - 22.5m
    ...
    ```

- [ ] **6.8 Performance Optimization**
  - [ ] Lazy render: Only render shapes in viewport
  - [ ] Virtualization για large number of cables/shapes
  - [ ] Debounce shape updates during drag
  - [ ] Use Konva caching για complex shapes

- [ ] **6.9 Touch Support**
  - [ ] Test on tablet/mobile
  - [ ] Adjust hit areas για touch (larger tap targets)
  - [ ] Pinch-to-zoom

- [ ] **6.10 Dark Mode Support**
  - [ ] Ensure cables/shapes readable σε dark theme
  - [ ] Adjust colors: toolbar, panels, shapes

**Deliverable:** Polished, production-ready feature

---

## 🎨 VISUAL DESIGN NOTES

### Toolbar Layout
```
┌─────────────────┐
│  Drawing Tools  │ (Left sidebar, vertical)
│                 │
│   [Select]  V   │ ← Active tool = primary blue
│   [Cable]   C   │
│   [Rect]    R   │
│   [Circle]  O   │
│   [Line]    L   │
│   [Arrow]   A   │
│   [Text]    T   │
│   [Pencil]  P   │
│                 │
└─────────────────┘
```

### Layers Panel
```
┌──────────────────────┐
│ Layers               │
├──────────────────────┤
│ 👁 🔓 Annotations    │ ← zIndex: 4
│ 👁 🔓 Assets         │ ← zIndex: 3
│ 👁 🔓 Shapes         │ ← zIndex: 2
│ 👁 🔓 Cables         │ ← zIndex: 1
│ 👁 🔓 Background     │ ← zIndex: 0
└──────────────────────┘
```

### Cable Visual Styles
```
Ethernet Cat6:  ────────────────▶  Blue, solid, 3px
Fiber Optic:    ────────────────▶  Green, solid, 2px
Power:          ━━━━━━━━━━━━━━━▶  Red, solid, 4px
Coaxial:        ─ ─ ─ ─ ─ ─ ─ ▶  Amber, dashed, 3px
HDMI:           ────────────────▶  Purple, solid, 3px
USB:            ────────────────▶  Cyan, solid, 2px
```

---

## 📦 FILES TO CREATE

### Backend (10 files)
```
backend/
├── prisma/
│   ├── schema.prisma                      ✏️ MODIFY (add Cable, DrawingShape models)
│   └── migrations/
│       └── XXXXXX_add_canvas_drawing_cables/
│           └── migration.sql              🆕 NEW
├── src/
│   ├── controllers/
│   │   ├── cable.controller.ts            🆕 NEW
│   │   └── shape.controller.ts            🆕 NEW
│   ├── routes/
│   │   ├── cable.routes.ts                🆕 NEW
│   │   └── shape.routes.ts                🆕 NEW
│   ├── validation/
│   │   ├── cable.validation.ts            🆕 NEW
│   │   └── shape.validation.ts            🆕 NEW
│   └── server.ts                          ✏️ MODIFY (register new routes)
```

### Frontend (20+ files)
```
frontend/src/
├── types/
│   └── canvas.types.ts                    🆕 NEW (all TS types)
├── services/
│   ├── cable.service.ts                   🆕 NEW
│   └── shape.service.ts                   🆕 NEW
├── stores/
│   └── canvasStore.ts                     🆕 NEW (Zustand store)
├── hooks/
│   ├── useCanvasDrawing.ts                🆕 NEW
│   ├── useCableDrawing.ts                 🆕 NEW
│   ├── useCableRouting.ts                 🆕 NEW
│   ├── useCanvasHistory.ts                🆕 NEW
│   └── useKeyboardShortcuts.ts            🆕 NEW
├── components/
│   ├── floor-plan/
│   │   ├── FloorPlanCanvas.tsx            ✏️ MODIFY (add toolbar, layers, shapes/cables)
│   │   └── DownloadFloorplanModal.tsx     ✏️ MODIFY (add cable/shape export options)
│   ├── room-plan/
│   │   └── RoomPlanCanvas.tsx             ✏️ MODIFY (same as FloorPlanCanvas)
│   └── canvas/
│       ├── tools/
│       │   ├── DrawingToolbar.tsx         🆕 NEW
│       │   ├── CableToolbar.tsx           🆕 NEW
│       │   ├── LayersPanel.tsx            🆕 NEW
│       │   └── PropertiesPanel.tsx        🆕 NEW
│       ├── shapes/
│       │   ├── ShapeRenderer.tsx          🆕 NEW
│       │   ├── CableRenderer.tsx          🆕 NEW
│       │   └── MeasurementLine.tsx        🆕 NEW
│       ├── modals/
│       │   ├── CableModal.tsx             🆕 NEW
│       │   └── ShapePropertiesModal.tsx   🆕 NEW
│       └── utils/
│           ├── routingAlgorithms.ts       🆕 NEW
│           └── canvasHelpers.ts           🆕 NEW
```

**Total: ~35 new/modified files**

---

## 🧪 TESTING STRATEGY

### Manual Testing Checklist

**Phase 3 - Shapes:**
- [ ] Draw rectangle → saves to DB
- [ ] Draw circle → correct radius
- [ ] Draw line → accurate endpoints
- [ ] Draw text → editable on double-click
- [ ] Freehand → smooth path
- [ ] Select shape → Transformer appears
- [ ] Resize shape → updates in DB
- [ ] Delete shape → removed from DB
- [ ] Undo → restores deleted shape

**Phase 4 - Cables:**
- [ ] Click asset → Click asset → Cable created
- [ ] Straight routing → direct line
- [ ] Orthogonal routing → 90° angles
- [ ] Auto routing → avoids pins
- [ ] Custom routing → drag waypoints
- [ ] Edit cable → CableModal opens με current data
- [ ] Change routing mode → path updates
- [ ] Delete cable → removed from DB
- [ ] Cable label → shows at midpoint

**Phase 6 - Advanced:**
- [ ] Undo/Redo → history works
- [ ] Multi-select → selection box
- [ ] Align tools → shapes align correctly
- [ ] PDF export → includes cables/shapes
- [ ] Performance → 100+ shapes smooth

### Unit Tests (Optional)

```typescript
// Example: useCableRouting.test.ts
describe('calculateOrthogonalPath', () => {
  it('should create right-angle path', () => {
    const path = calculateOrthogonalPath(0, 0, 100, 100);
    expect(path).toEqual([0, 0, 50, 0, 50, 100, 100, 100]);
  });
});
```

---

## 🚀 DEPLOYMENT NOTES

### Database Migration
```bash
# Development
cd backend
DATABASE_URL="postgresql://synax:synax_password@localhost:5433/synax_db?schema=public" \
  npx prisma migrate dev --name add_canvas_drawing_cables

# Production
DATABASE_URL="..." npx prisma migrate deploy
```

### Environment Variables
No new env vars needed - uses existing DB connection.

### Backwards Compatibility
- Existing floors/rooms χωρίς cables/shapes → works fine (empty arrays)
- Old PDF exports → still work (no cables/shapes included)

---

## 💡 FUTURE ENHANCEMENTS (Post-v1)

- [ ] **Real-time Collaboration** - Multiple users editing same canvas
- [ ] **Templates** - Save/load cable configurations
- [ ] **Auto-layout** - Suggest optimal cable routing
- [ ] **Cable trays** - Group cables in trays/conduits
- [ ] **3D View** - Visualize cables in 3D space
- [ ] **BOM Export** - Bill of materials από cables
- [ ] **Import CAD** - Import DXF/DWG files
- [ ] **Mobile App** - Native iOS/Android με canvas

---

## 📚 REFERENCES

### Libraries Used
- **Konva.js** - Canvas rendering (already in project)
  - Docs: https://konvajs.org/docs/
  - React: https://konvajs.org/docs/react/
- **React Konva** - React wrapper
- **jsPDF** - PDF generation (already in project)
- **Zustand** - State management (if chosen)

### Algorithms
- **A* Pathfinding** - For auto-routing
  - https://en.wikipedia.org/wiki/A*_search_algorithm
- **Manhattan Routing** - Orthogonal paths
  - https://en.wikipedia.org/wiki/Taxicab_geometry

### Similar Tools (Inspiration)
- **Figma** - Drawing tools UX
- **Lucidchart** - Diagramming
- **Visio** - Enterprise diagramming
- **AutoCAD** - CAD software

---

## ✅ TODO CHECKLIST

Copy this to `.claude/todo.md` και track progress:

```markdown
## Canvas Drawing & Cables - TODO

### 🔴 Phase 1: Foundation (2 days)
- [ ] Prisma schema - Cable model
- [ ] Prisma schema - DrawingShape model
- [ ] Run migration
- [ ] Create canvas.types.ts
- [ ] Create cable.service.ts
- [ ] Create shape.service.ts

### 🟠 Phase 2: UI Foundation (2 days)
- [ ] Canvas store (Zustand/Context)
- [ ] DrawingToolbar component
- [ ] LayersPanel component
- [ ] Keyboard shortcuts hook
- [ ] Integrate toolbar into FloorPlanCanvas
- [ ] Integrate toolbar into RoomPlanCanvas

### 🟡 Phase 3: Shape Drawing (3 days)
- [ ] useCanvasDrawing hook
- [ ] ShapeRenderer component
- [ ] Rectangle tool
- [ ] Circle tool
- [ ] Line tool
- [ ] Arrow tool
- [ ] Text tool
- [ ] Freehand tool
- [ ] Selection & Transformer
- [ ] Shape drag & resize

### 🟢 Phase 4: Cables (3 days)
- [ ] useCableDrawing hook
- [ ] Routing algorithms (straight, orthogonal, auto)
- [ ] CableRenderer component
- [ ] Cable creation workflow
- [ ] CableModal component
- [ ] Cable editing
- [ ] Waypoint dragging (custom mode)
- [ ] Cable filtering

### 🔵 Phase 5: Backend API (2 days)
- [ ] Cable controller (CRUD)
- [ ] Shape controller (CRUD)
- [ ] Validation (Zod schemas)
- [ ] Routes registration
- [ ] Tests (optional)

### 🟣 Phase 6: Polish (3 days)
- [ ] Undo/Redo system
- [ ] Multi-select
- [ ] Group/ungroup
- [ ] Alignment tools
- [ ] Properties panel
- [ ] Measurement tool
- [ ] PDF export enhancement
- [ ] Performance optimization
- [ ] Touch support
- [ ] Dark mode support

### 🧪 Testing
- [ ] Manual testing checklist
- [ ] Unit tests (optional)
- [ ] TypeScript check (npx tsc --noEmit)
- [ ] Production build test

### 📝 Documentation
- [ ] Update PLAN.md με new features
- [ ] Update MANUAL.md (user guide)
- [ ] API documentation
```

---

## 🎯 SUCCESS CRITERIA

✅ **Feature is considered DONE when:**

1. User μπορεί να σχεδιάσει shapes (rectangle, circle, line, text) στο floor/room plan
2. User μπορεί να δημιουργήσει cables μεταξύ assets με διαφορετικά routing modes
3. Cables και shapes αποθηκεύονται στη DB και persist μετά από reload
4. Layers panel λειτουργεί (show/hide, lock/unlock)
5. Undo/Redo λειτουργεί για όλες τις ενέργειες
6. PDF export περιλαμβάνει cables/shapes με legend
7. TypeScript check passes χωρίς errors
8. Performance: 100+ shapes/cables render smoothly

---

## ⚠️ RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance με πολλά cables/shapes | High | Virtualization, lazy rendering, Konva caching |
| Complex routing algorithms | Medium | Start με simple (straight/orthogonal), auto optional |
| UX complexity | Medium | Phased rollout, user testing, clear tutorials |
| Mobile/touch support | Low | Test early, adjust hit areas |
| PDF export quality | Low | Test με different scales, adjust rendering |

---

## 🤝 NOTES FROM CHAT

### Key Decisions:
1. **Priority:** Drawing tools first (foundation), then cables (specialized)
   - Reason: Cables είναι ένα είδος drawing tool, έτσι foundation πρώτα
2. **Routing:** User επιλέγει mode (straight, orthogonal, auto, custom)
   - Reason: Maximum flexibility, καλύπτει όλα τα use cases
3. **Scope:** Floor-level ΚΑΙ room-level
   - Reason: Consistency across both canvas types
4. **Export:** PDF με toggles για cables/shapes
   - Reason: User control over τι να συμπεριληφθεί
5. **Layers:** Full management (z-index, lock, hide)
   - Reason: Professional CAD-like experience

### User Preferences:
- "Δεν με ενδιαφέρει η σειρά, αρκεί σωστή υλοποίηση"
- "Να αποφασίζει ο χρήστης" (για routing mode)
- "Και τα δυο" (για features)

---

**Last Updated:** 2026-02-05
**Status:** V1 Planning Complete - V2 Features Added
**Estimated Duration:**
- V1 Core: 15 days (3 weeks)
- V2 Advanced: 20+ days (4+ weeks)

---
---

# 🔍 CRITICAL REVIEW & IMPROVEMENTS

## ⚠️ V1 ISSUES & FIXES

### Issue 1: Cable Model - Too Restrictive

**❌ Problem:**
```prisma
// Current: Cables ONLY Asset→Asset
sourceAssetId   String
targetAssetId   String
```

**✅ Solution:**
```prisma
// Flexible: Cables can connect Assets, Rooms, or Floors
model Cable {
  // ... existing fields
  sourceType      ConnectionType
  sourceId        String
  targetType      ConnectionType
  targetId        String

  // Keep backward compatibility
  sourceAssetId   String?
  targetAssetId   String?
  sourceRoomId    String?
  targetRoomId    String?
  sourceFloorId   String?
  targetFloorId   String?
}

enum ConnectionType {
  ASSET
  ROOM
  FLOOR
}
```

**Use Cases:**
- Room 101 → Room 102 (trunk cable)
- Floor 1 → Floor 2 (riser cable)
- Patch Panel (asset) → Room (all drops)

**Add to V1:**
- [ ] Update Cable model with flexible connections
- [ ] Update CableRenderer to handle room/floor connections

---

### Issue 2: Cable Bundling Missing

**❌ Problem:** 10 cables same route = visual clutter

**✅ Solution:**
```prisma
model CableBundle {
  id              String    @id @default(cuid())
  name            String    // "Trunk A"
  description     String?
  color           String?
  cables          Cable[]   @relation("BundleCables")

  // Visual rendering
  renderAsSingle  Boolean   @default(true)
  displayCount    Boolean   @default(true)
}

model Cable {
  // ... existing
  bundleId        String?
  bundle          CableBundle? @relation("BundleCables", fields: [bundleId], references: [id])
}
```

**Visual:**
```
Before:
[A] ─────── [B]
    ───────
    ───────
    ───────     (10 individual cables = messy)

After:
[A] ═══════ [B]
     "10x"      (bundled = clean)
```

**Add to V1 Phase 4:**
- [ ] CableBundle model
- [ ] Bundle creation UI
- [ ] Bundle rendering

---

### Issue 3: Routing Algorithms - Too Simple

**❌ Problem:**
```typescript
// Current orthogonal: Only one midpoint
const midX = (x1 + x2) / 2;
return [x1, y1, midX, y1, midX, y2, x2, y2];
```

**✅ Better Solution:**
```typescript
enum OrthogonalStrategy {
  HORIZONTAL_FIRST,  // Go horizontal first, then vertical
  VERTICAL_FIRST,    // Go vertical first, then horizontal
  SHORTEST,          // Choose based on distance
  AVOID_OBSTACLES,   // Smart avoidance (Phase 6)
}

function calculateOrthogonalPath(
  x1: number, y1: number,
  x2: number, y2: number,
  strategy: OrthogonalStrategy = 'SHORTEST',
  obstacles: Obstacle[] = []
): number[] {
  switch (strategy) {
    case 'HORIZONTAL_FIRST':
      return [x1, y1, x2, y1, x2, y2];

    case 'VERTICAL_FIRST':
      return [x1, y1, x1, y2, x2, y2];

    case 'SHORTEST':
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      return dx > dy
        ? [x1, y1, x2, y1, x2, y2]  // horizontal first
        : [x1, y1, x1, y2, x2, y2]; // vertical first

    case 'AVOID_OBSTACLES':
      return calculatePathWithAvoidance(x1, y1, x2, y2, obstacles);
  }
}
```

**Update V1 Phase 4:**
- [ ] Enhance orthogonal routing with strategies
- [ ] Add strategy selector in CableModal

---

### Issue 4: Scale/Measurement - Unclear Implementation

**❌ Problem:** How does user set scale for accurate measurements?

**✅ Solution: Calibration Tool**

```prisma
model Floor {
  // ... existing fields
  scale           Json?  // FloorPlanScale
}

// TypeScript
interface FloorPlanScale {
  pixelsPerMeter: number;
  unit: 'meters' | 'feet' | 'inches';
  calibrated: boolean;
  calibrationLine?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    knownDistance: number;
    knownUnit: string;
  };
}
```

**Calibration Workflow:**
```
┌────────────────────────────────────────┐
│ Floor Plan (uncalibrated)              │
│                                        │
│  [Tool: Set Scale]                     │
│                                        │
│  Step 1: Draw line on known distance  │
│          ──────────────────            │
│          (e.g., wall = 10m)            │
│                                        │
│  Step 2: Enter known distance:        │
│          [  10  ] [meters ▾]           │
│                                        │
│  Step 3: [✓ Apply Scale]               │
│                                        │
│  ✅ Scale set: 1 meter = 45.3 pixels   │
└────────────────────────────────────────┘
```

**Add to V1 Phase 6 (Measurement Tool):**
- [ ] Calibration tool in toolbar
- [ ] Store scale in Floor model
- [ ] Use scale for all measurements

---

### Issue 5: Export Formats - Only PDF

**❌ Problem:** Only PDF export

**✅ Solution: Multiple Formats**

```typescript
enum ExportFormat {
  PDF = 'PDF',
  SVG = 'SVG',     // 🆕 Vector (scalable, editable)
  PNG = 'PNG',     // 🆕 Raster (high resolution)
  JPEG = 'JPEG',   // 🆕 Compressed (smaller file)
  JSON = 'JSON',   // 🆕 Full state backup
}

interface ExportOptions {
  format: ExportFormat;
  includeLayers: string[];  // ['cables', 'shapes', 'assets']
  includeHidden: boolean;
  quality?: number;         // for JPEG (0-100)
  scale?: number;           // for PNG/JPEG (1x, 2x, 3x)
  background?: string;      // transparent or color
}
```

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ Export Floor Plan                   │
├─────────────────────────────────────┤
│                                     │
│ Format:  ◉ PDF   ○ SVG   ○ PNG     │
│          ○ JPEG  ○ JSON             │
│                                     │
│ Include:                            │
│  ☑ Cables                           │
│  ☑ Shapes                           │
│  ☑ Assets                           │
│  ☐ Hidden Layers                    │
│  ☑ Cable Legend                     │
│                                     │
│ Quality: ████████░░ 80%             │
│ Scale:   ◉ 1x  ○ 2x  ○ 3x           │
│                                     │
│         [Cancel]  [Export]          │
└─────────────────────────────────────┘
```

**Add to V1 Phase 6:**
- [ ] SVG export (using Konva toDataURL + SVG conversion)
- [ ] PNG export with quality options
- [ ] JSON export (full canvas state)

---

## 🎨 UI MOCKUPS - V1 CORE

### Main Canvas Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ Floor: Level 1 - Main Office                              [< Back]    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────┐   ┌────────────────────────────────────────┐  ┌───────┐ │
│  │ Drawing │   │                                        │  │ Zoom  │ │
│  │ Tools   │   │      Floor Plan Canvas                 │  │ & Pan │ │
│  │         │   │                                        │  │       │ │
│  │ ◎ V     │   │  ┌─────────────────┐                  │  │ 🔓    │ │
│  │ ─ C     │   │  │ Room 101        │                  │  │       │ │
│  │ ▭ R     │   │  │    [AP] ─────── [Switch]           │  │ ⊕     │ │
│  │ ● O     │   │  │    cable        │                  │  │ 85%   │ │
│  │ ╱ L     │   │  └─────────────────┘                  │  │ ⊖     │ │
│  │ → A     │   │                                        │  │       │ │
│  │ T T     │   │  ┌─────────────────┐                  │  │ ⟲     │ │
│  │ ✎ P     │   │  │ Room 102        │                  │  │       │ │
│  │ ⊕ M     │   │  │                 │                  │  │ ⛶     │ │
│  │         │   │  └─────────────────┘                  │  └───────┘ │
│  └─────────┘   │                                        │            │
│                │  [Shape annotation here]               │            │
│  ┌─────────┐   │                                        │            │
│  │ Layers  │   └────────────────────────────────────────┘            │
│  │         │                                                         │
│  │👁🔓 Ann. │   ┌─────────────────────────────────────┐              │
│  │👁🔓 Asst │   │ Legend                              │              │
│  │👁🔓 Shps │   │ ● Rooms   ▪ Assets   ─ Cables      │              │
│  │👁🔓 Cbls │   │ ─── Ethernet  ━━━ Power  ╌╌╌ Fiber │              │
│  │👁🔓 Bkg  │   └─────────────────────────────────────┘              │
│  └─────────┘                                                         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Legend:**
- `◎` Select tool
- `─` Cable tool
- `▭` Rectangle
- `●` Circle
- `╱` Line
- `→` Arrow
- `T` Text
- `✎` Freehand
- `⊕` Measurement
- `👁` Visibility toggle
- `🔓` Lock/unlock
- `⟲` Reset view
- `⛶` Fullscreen

---

### Drawing Toolbar - Expanded View

```
┌─────────────────────────────┐
│     Drawing Tools           │
├─────────────────────────────┤
│                             │
│  Selection & Navigation     │
│  ┌───┬───────────────────┐  │
│  │ ◎ │ Select        [V] │  │ ← Active (blue)
│  └───┴───────────────────┘  │
│  ┌───┬───────────────────┐  │
│  │ ✋ │ Pan          [H] │  │
│  └───┴───────────────────┘  │
│                             │
│  ─────────────────────────  │
│                             │
│  Connections                │
│  ┌───┬───────────────────┐  │
│  │ ─ │ Cable        [C] │  │
│  └───┴───────────────────┘  │
│                             │
│  ─────────────────────────  │
│                             │
│  Basic Shapes               │
│  ┌───┬───────────────────┐  │
│  │ ▭ │ Rectangle    [R] │  │
│  └───┴───────────────────┘  │
│  ┌───┬───────────────────┐  │
│  │ ● │ Circle       [O] │  │
│  └───┴───────────────────┘  │
│  ┌───┬───────────────────┐  │
│  │ ╱ │ Line         [L] │  │
│  └───┴───────────────────┘  │
│  ┌───┬───────────────────┐  │
│  │ → │ Arrow        [A] │  │
│  └───┴───────────────────┘  │
│  ┌───┬───────────────────┐  │
│  │ ▲ │ Polygon      [G] │  │
│  └───┴───────────────────┘  │
│                             │
│  ─────────────────────────  │
│                             │
│  Annotation                 │
│  ┌───┬───────────────────┐  │
│  │ T │ Text         [T] │  │
│  └───┴───────────────────┘  │
│  ┌───┬───────────────────┐  │
│  │ ✎ │ Freehand     [P] │  │
│  └───┴───────────────────┘  │
│                             │
│  ─────────────────────────  │
│                             │
│  Measurement                │
│  ┌───┬───────────────────┐  │
│  │ ⊕ │ Measure      [M] │  │
│  └───┴───────────────────┘  │
│  ┌───┬───────────────────┐  │
│  │ ⊞ │ Set Scale    [S] │  │
│  └───┴───────────────────┘  │
│                             │
└─────────────────────────────┘
```

---

### Layers Panel - Detailed

```
┌─────────────────────────────────────┐
│ Layers                    [+ New]   │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 👁 🔓  Annotations      [⋮]  │  │ ← zIndex: 4
│  │        5 items                │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 👁 🔓  Assets           [⋮]  │  │ ← zIndex: 3
│  │        12 items               │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 👁 🔓  Shapes           [⋮]  │  │ ← zIndex: 2 (Selected)
│  │        8 items                │  │
│  │   • Rectangle (4)             │  │ ← Expanded
│  │   • Circle (2)                │  │
│  │   • Line (2)                  │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 👁 🔓  Cables           [⋮]  │  │ ← zIndex: 1
│  │        15 items               │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 👁 🔓  Background       [⋮]  │  │ ← zIndex: 0 (Locked)
│  │        Floor plan image       │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘

Icons:
👁 = Visible (click to hide)
👁 = Hidden (click to show)
🔓 = Unlocked (click to lock)
🔒 = Locked (can't edit)
[⋮] = More options menu
```

**Layer Context Menu (click `[⋮]`):**
```
┌──────────────────────┐
│ Rename Layer         │
│ Duplicate Layer      │
│ Merge Down           │
│ ────────────────     │
│ Select All Items     │
│ Delete All Items     │
│ ────────────────     │
│ Lock All Items       │
│ Hide All Items       │
│ ────────────────     │
│ Delete Layer     [🗑] │
└──────────────────────┘
```

---

### Cable Creation Workflow - Step by Step

```
Step 1: Select Cable Tool
┌────────────────────────────────┐
│                                │
│  [C] Cable Tool Active         │
│                                │
│  Click source asset...         │
│                                │
│     [Router]                   │
│       ↑                        │
│     Click!                     │
│                                │
└────────────────────────────────┘

Step 2: Source Asset Selected
┌────────────────────────────────┐
│                                │
│  [Router]  ← Glowing blue      │
│    ⭘ ⭘ ⭘   Animated pulse     │
│                                │
│  Now click target asset...     │
│                                │
│     [Switch]                   │
│       ↑                        │
│     Click!                     │
│                                │
└────────────────────────────────┘

Step 3: Cable Properties Modal
┌─────────────────────────────────────┐
│ Cable Properties                [X] │
├─────────────────────────────────────┤
│                                     │
│ From: Router-01                     │
│ To:   Switch-02                     │
│                                     │
│ Cable Type: [Ethernet Cat6    ▾]   │
│                                     │
│ Routing:    [Orthogonal       ▾]   │
│             ○ Straight              │
│             ● Orthogonal            │
│             ○ Auto (Smart)          │
│             ○ Custom (Edit)         │
│                                     │
│ Label:      [Uplink Cable      ]   │
│                                     │
│ Ports:                              │
│   Source:   [Port 1           ]   │
│   Target:   [Port 8           ]   │
│                                     │
│ Length:     [15.2] meters           │
│             (auto-calculated)       │
│                                     │
│ Notes:      [                  ]   │
│             [                  ]   │
│                                     │
│ Preview:                            │
│  [Router] ═══════════> [Switch]    │
│            Blue, 3px                │
│                                     │
│        [Cancel]  [Create Cable]    │
└─────────────────────────────────────┘

Step 4: Cable Created
┌────────────────────────────────┐
│                                │
│  [Router] ═════════> [Switch]  │
│           "Uplink Cable"       │
│                                │
│  ✓ Cable created successfully  │
│                                │
└────────────────────────────────┘
```

---

### Shape Drawing - Rectangle Example

```
Step 1: Select Rectangle Tool
┌────────────────────────────────┐
│  [R] Rectangle Tool Active     │
│                                │
│  Click and drag to draw...     │
│                                │
│      ┌─ Crosshair cursor       │
│      +                         │
│                                │
└────────────────────────────────┘

Step 2: Drawing (Mouse Down + Drag)
┌────────────────────────────────┐
│                                │
│    Start                       │
│      ┏━━━━━━━━━┓               │
│      ┃         ┃  ← Ghost box  │
│      ┃         ┃  (dashed)     │
│      ┗━━━━━━━━━┛               │
│              End               │
│                                │
│  Width: 120px  Height: 80px    │
│                                │
└────────────────────────────────┘

Step 3: Released (Shape Created)
┌────────────────────────────────┐
│                                │
│      ┌─────────┐               │
│      │         │  ← Solid box  │
│      │  Room   │  (selected)   │
│      │   A1    │               │
│      └─────────┘               │
│      ○ ○ ○ ○ ○  ← Resize       │
│                   handles      │
│                                │
│  Double-click to edit text     │
│                                │
└────────────────────────────────┘

Step 4: Properties Panel (Right Side)
┌─────────────────────────────┐
│ Shape Properties            │
├─────────────────────────────┤
│                             │
│ Type: Rectangle             │
│                             │
│ Position:                   │
│   X: [120] Y: [80]          │
│                             │
│ Size:                       │
│   W: [200] H: [150]         │
│                             │
│ Rotation: [0°]              │
│                             │
│ ───────────────────────     │
│                             │
│ Fill:   [███] #3b82f6       │
│ Opacity: ████████░░ 80%     │
│                             │
│ Stroke: [███] #1e293b       │
│ Width:  ████░░░░░░ 2px      │
│                             │
│ ───────────────────────     │
│                             │
│ Corner Radius: [0] px       │
│                             │
│        [Delete Shape]       │
│                             │
└─────────────────────────────┘
```

---

### Measurement Tool Workflow

```
Step 1: Calibration (First Time)
┌─────────────────────────────────────┐
│ Set Floor Plan Scale            [X] │
├─────────────────────────────────────┤
│                                     │
│ This floor plan is not calibrated.  │
│ Let's set the scale for accurate    │
│ measurements.                       │
│                                     │
│ 1. Find a known distance on the     │
│    floor plan (e.g., a wall)        │
│                                     │
│ 2. Draw a line along that distance: │
│                                     │
│    ┌─────────────────────────┐     │
│    │ [Floor Plan Image]      │     │
│    │                         │     │
│    │  Wall                   │     │
│    │  ──────────────────     │     │
│    │  ← Draw line here       │     │
│    │                         │     │
│    └─────────────────────────┘     │
│                                     │
│ 3. Enter the actual distance:       │
│                                     │
│    Known Distance: [10] [meters ▾]  │
│                                     │
│ 4. [✓ Apply Scale]                  │
│                                     │
│ ℹ️  You can recalibrate anytime     │
│    from Tools → Set Scale           │
│                                     │
└─────────────────────────────────────┘

Step 2: Using Measurement Tool
┌────────────────────────────────┐
│  [M] Measurement Tool Active   │
│                                │
│  Click start point...          │
│      ⊕                         │
│                                │
│  Then click end point          │
│                  ⊕             │
│                                │
│      ⊕──────────────⊕          │
│         12.5 meters            │
│                                │
└────────────────────────────────┘

Measurement Line Visual:
      12.5 m
    ←───────→
    |       |
   [A]     [B]
    │       │
    ⊕       ⊕  ← Measurement anchors
```

---
