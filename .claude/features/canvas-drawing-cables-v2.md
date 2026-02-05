# Canvas Drawing & Cables - VERSION 2 FEATURES

**Status:** Future Enhancements - Post V1
**Priority:** Medium to Low (after V1 stable)
**Estimated Duration:** 20-30 days (4-6 weeks)

---

## 📊 V2 FEATURE OVERVIEW

Total: **40+ new features** organized in 6 groups

| Group | Features | Priority | Duration |
|-------|----------|----------|----------|
| **A: Advanced Shapes** | 6 shapes | High | 3 days |
| **B: Drawing Tools** | 5 tools | Medium | 5 days |
| **C: Annotations** | 3 tools | Medium | 3 days |
| **D: Utilities** | 6 tools | High | 4 days |
| **E: Cable Advanced** | 5 features | Medium | 4 days |
| **F: Smart Features** | 6 features | Low | 3 days |
| **G: Performance** | 3 optimizations | High | 3 days |
| **H: Export** | 3 formats | Medium | 2 days |

---

## 🎨 GROUP A: ADVANCED SHAPES

### 1. Ellipse / Oval

**Data Model:**
```typescript
interface EllipseData {
  x: number;
  y: number;
  radiusX: number;  // horizontal radius
  radiusY: number;  // vertical radius
  rotation?: number;
}
```

**UI Mockup:**
```
┌────────────────────────────────┐
│  [E] Ellipse Tool Active       │
│                                │
│  Click center, drag to edge    │
│                                │
│      Center                    │
│        ●                       │
│       ╱ ╲                      │
│      │   │  ← Drag to shape    │
│       ╲ ╱                      │
│        ●                       │
│      Edge                      │
│                                │
│  Shift+Drag = Perfect circle   │
│  Alt+Drag = From corner        │
│                                │
└────────────────────────────────┘
```

**Use Case:** WiFi coverage zones, rounded areas

---

### 2. Rounded Rectangle

**Data Model:**
```typescript
interface RoundedRectData extends RectangleData {
  cornerRadius: number;  // 0-50 (pixels)
}
```

**UI Enhancement:**
```
Properties Panel:
┌─────────────────────────────┐
│ Shape: Rounded Rectangle    │
├─────────────────────────────┤
│ Corner Radius: ████░░░░ 12px│
│                             │
│ Preview:                    │
│  ╭─────────────╮            │
│  │             │            │
│  │    Room     │            │
│  │     A1      │            │
│  ╰─────────────╯            │
│                             │
└─────────────────────────────┘
```

---

### 3. Star

**Data Model:**
```typescript
interface StarData {
  x: number;
  y: number;
  numPoints: number;     // 5, 6, 8, etc.
  innerRadius: number;   // inner points distance
  outerRadius: number;   // outer points distance
  rotation?: number;
}
```

**Visual:**
```
     ★
   /   \
  ★  •  ★     • = center
   \ | /
    ★ ★       5-point star
```

**Use Case:** Important markers, ratings

---

### 4. Regular Polygon

**Data Model:**
```typescript
interface RegularPolygonData {
  x: number;
  y: number;
  sides: number;         // 3=triangle, 5=pentagon, 6=hexagon
  radius: number;
  rotation?: number;
}
```

**Toolbar Addition:**
```
│ ▲ │ Polygon    [G] │
     │
     ├── ▲ Triangle (3)
     ├── ◆ Pentagon (5)
     ├── ⬡ Hexagon (6)
     └── ⬢ Octagon (8)
```

**Use Case:** Coverage patterns, zones

---

### 5. Arc / Curve

**Data Model:**
```typescript
interface ArcData {
  x: number;
  y: number;
  radius: number;
  startAngle: number;    // 0-360 degrees
  endAngle: number;      // 0-360 degrees
  clockwise: boolean;
}
```

**Visual:**
```
     ╭─────
    ╱
   │
   │
    ╲
     ╰─────

Arc from 90° to 270°
```

**Use Case:** Signal range arcs, partial coverage

---

### 6. Bezier Curve

**Data Model:**
```typescript
interface BezierData {
  points: Point[];       // [start, control1, control2, end]
  closed: boolean;       // true = closed path
  tension?: number;      // curve smoothness
}
```

**UI Workflow:**
```
Step 1: Click start point
Step 2: Click end point
Step 3: Drag handles to curve
Step 4: Add more points (click path)

Visual:
    P1 ●────────● P2
       │        │
       ○        ○  ← Control handles (draggable)
```

**Use Case:** Custom curved paths, artistic annotations

---

## 🛠️ GROUP B: DRAWING TOOLS

### 1. Pan Tool (Hand)

**Purpose:** Navigate without locking/unlocking

**Toolbar:**
```
│ ✋ │ Pan        [H] │
```

**Workflow:**
```
1. Press H or click Pan tool
2. Cursor changes to hand ✋
3. Click-drag to move canvas
4. Release or press V to return to Select
```

**vs Lock/Unlock:**
- Lock/Unlock: Toggle mode (affects zoom too)
- Pan Tool: Temporary navigation (like Photoshop)

---

### 2. Eraser Tool

**Purpose:** Quick deletion by clicking

**Toolbar:**
```
│ 🗑 │ Eraser     [E] │
```

**Workflow:**
```
┌────────────────────────────────┐
│  [E] Eraser Active             │
│                                │
│  Click shapes to delete        │
│                                │
│   [Shape 1] ← Click!           │
│                   ✗ Deleted    │
│                                │
│   [Cable] ← Click!             │
│            ✗ Deleted           │
│                                │
│  Hold Shift = Delete selected  │
│                                │
└────────────────────────────────┘
```

**Options:**
```
Properties:
┌─────────────────────────────┐
│ Eraser Mode:                │
│  ○ Single (one at a time)   │
│  ● All (erase everything    │
│         under cursor)       │
│                             │
│ Confirmation:               │
│  ☑ Ask before deleting      │
│                             │
└─────────────────────────────┘
```

---

### 3. Eyedropper (Style Picker)

**Purpose:** Copy style from one shape to others

**Toolbar:**
```
│ 💧 │ Eyedropper [I] │
```

**Workflow:**
```
┌────────────────────────────────┐
│  1. Select target shape(s)     │
│     [Shape A] ← Selected       │
│                                │
│  2. Click Eyedropper [I]       │
│                                │
│  3. Click source shape         │
│     [Shape B] ← Click!         │
│       (blue fill)              │
│                                │
│  4. Style copied!              │
│     [Shape A] ← Now blue too   │
│                                │
└────────────────────────────────┘
```

**What's Copied:**
- Fill color
- Stroke color
- Stroke width
- Opacity
- Dash pattern
- Corner radius (if applicable)

---

### 4. Clone / Duplicate Tool

**Purpose:** Quick copy of shapes

**Keyboard:** `Ctrl+D` or `Cmd+D`

**Toolbar Context Menu:**
```
Right-click shape:
┌──────────────────────┐
│ ...                  │
│ Duplicate       [⌘D] │
│ Clone to Position... │
│ ...                  │
└──────────────────────┘
```

**Clone Dialog:**
```
┌─────────────────────────────────────┐
│ Clone Shape                     [X] │
├─────────────────────────────────────┤
│                                     │
│ Original: Rectangle "Room A1"       │
│                                     │
│ Number of Copies: [1]               │
│                                     │
│ Offset:                             │
│   X: [20] px   Y: [20] px           │
│                                     │
│ ☑ Maintain style                    │
│ ☑ Maintain size                     │
│ ☐ Create array (grid)               │
│                                     │
│ Array Options:                      │
│   Rows: [1]   Columns: [3]          │
│   Spacing X: [50] px                │
│   Spacing Y: [50] px                │
│                                     │
│ Preview:                            │
│   [Original] → [Copy 1] → [Copy 2]  │
│                                     │
│         [Cancel]  [Clone]           │
└─────────────────────────────────────┘
```

**Use Case:** Repeat patterns, multiple identical rooms

---

### 5. Path Tool (Pen Tool - Illustrator Style)

**Purpose:** Create complex custom shapes with bezier paths

**Toolbar:**
```
│ 🖊 │ Pen        [N] │
```

**Workflow:**
```
Step 1: Click to place anchor point
┌────────────────────────────────┐
│  [N] Pen Tool Active           │
│                                │
│     ●  ← Anchor 1              │
│                                │
│  Click next point...           │
│                                │
└────────────────────────────────┘

Step 2: Click-drag for curve
┌────────────────────────────────┐
│     ●────────●  ← Anchor 2     │
│      ╲      ╱                  │
│       ○────○  ← Handles        │
│                                │
│  Drag handles to adjust curve  │
│                                │
└────────────────────────────────┘

Step 3: Continue adding points
┌────────────────────────────────┐
│     ●────────●                 │
│      ╲      ╱                  │
│       ○────○                   │
│             ╲                  │
│              ╲                 │
│               ●  ← Anchor 3    │
│                                │
│  Double-click to finish        │
│  Click first point to close    │
│                                │
└────────────────────────────────┘

Final Shape:
┌────────────────────────────────┐
│     ●────────●                 │
│      ╲      ╱                  │
│       ╲    ╱                   │
│        ╲  ╱                    │
│         ●                      │
│                                │
│  Custom path created!          │
│  Edit points with Direct       │
│  Selection tool               │
│                                │
└────────────────────────────────┘
```

**Advanced:**
- Alt+Click = Create corner point (no handles)
- Shift+Click = Constrain to 45° angles
- Backspace = Delete last point
- Esc = Cancel path

---

## 📝 GROUP C: ANNOTATIONS

### 1. Callout / Speech Bubble

**Data Model:**
```typescript
interface CalloutData {
  x: number;              // bubble center
  y: number;
  text: string;
  targetX: number;        // arrow points here
  targetY: number;
  bubbleStyle: 'rounded' | 'rectangle' | 'cloud';
  arrowStyle: 'straight' | 'curved';
  padding?: number;
  fontSize?: number;
}
```

**Toolbar:**
```
│ 💬 │ Callout    [B] │
```

**Visual Styles:**
```
Rounded Bubble:
  ┌──────────────┐
  │ Important!   │
  └─────┬────────┘
        │ ← Straight arrow
        ▼
       [Pin]

Cloud Bubble:
   ☁──────────────☁
  ☁  Check this! ☁
   ☁──────┬──────☁
          ╰─╮
            ╰──> [Pin]  ← Curved arrow

Rectangle:
  ┏━━━━━━━━━━━━━┓
  ┃ Warning:    ┃
  ┃ Cable here! ┃
  ┗━━━━━┳━━━━━━━┛
        ┃
        ▼
       [Cable]
```

**UI Workflow:**
```
Step 1: Click Callout tool
Step 2: Click where you want to point
        (target)
Step 3: Drag to position bubble
Step 4: Type text in popup

┌─────────────────────────────────────┐
│ Callout Text                    [X] │
├─────────────────────────────────────┤
│                                     │
│ Text:  [                       ]   │
│        [                       ]   │
│                                     │
│ Style: ○ Rounded  ● Cloud          │
│        ○ Rectangle                  │
│                                     │
│ Arrow: ● Straight ○ Curved          │
│                                     │
│ Font Size: ████░░░░░░ 14px          │
│                                     │
│         [Cancel]  [Create]          │
└─────────────────────────────────────┘
```

**Use Case:** Important notes, warnings, instructions

---

### 2. Dimension Lines

**Data Model:**
```typescript
interface DimensionLineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offset: number;         // perpendicular distance from line
  showArrows: boolean;
  showMeasurement: boolean;
  unit: 'meters' | 'feet' | 'inches';
  label?: string;         // custom label (override measurement)
}
```

**Visual:**
```
Standard Dimension:
        12.5 m
    ←─────────→
    │         │
   [A]       [B]

Offset Dimension:
   [A]────────[B]   ← Original line
    │         │
    │         │     ← Offset distance
        8.2 m
    ←─────────→     ← Dimension line

Multiple Dimensions:
        5.0 m
    ←─────────→
    │         │        3.0 m
   [A]────────[B]  ←─────────→
    │                        │
    │                       [C]
             8.0 m
    ←────────────────────────→
```

**Toolbar:**
```
│ ⊟ │ Dimension  [D] │
```

**Properties:**
```
┌─────────────────────────────┐
│ Dimension Line Properties   │
├─────────────────────────────┤
│                             │
│ Length: 12.5 meters         │
│                             │
│ Offset: [10] px             │
│                             │
│ Display:                    │
│  ☑ Show arrows              │
│  ☑ Show measurement         │
│  ☐ Custom label:            │
│    [                  ]   │
│                             │
│ Text Size: [12] px          │
│                             │
│ Precision: [1] decimal      │
│                             │
└─────────────────────────────┘
```

**Use Case:** Architectural plans, spacing documentation

---

### 3. Symbol Library

**Purpose:** Drag-and-drop pre-made symbols

**Data Model:**
```typescript
interface SymbolData {
  x: number;
  y: number;
  symbolType: SymbolType;
  scale: number;
  rotation: number;
  customProperties?: Record<string, any>;
}

enum SymbolType {
  // Electrical
  OUTLET = 'OUTLET',
  SWITCH = 'SWITCH',
  LIGHT_FIXTURE = 'LIGHT_FIXTURE',
  LIGHT_SWITCH = 'LIGHT_SWITCH',
  CEILING_FAN = 'CEILING_FAN',
  PANEL = 'PANEL',

  // Network
  PATCH_PANEL = 'PATCH_PANEL',
  NETWORK_RACK = 'NETWORK_RACK',
  UPS = 'UPS',
  MODEM = 'MODEM',

  // Furniture
  DESK = 'DESK',
  CHAIR = 'CHAIR',
  TABLE = 'TABLE',
  CABINET = 'CABINET',

  // Safety
  FIRE_EXTINGUISHER = 'FIRE_EXTINGUISHER',
  EXIT_SIGN = 'EXIT_SIGN',
  SMOKE_DETECTOR = 'SMOKE_DETECTOR',
  FIRE_ALARM = 'FIRE_ALARM',

  // HVAC
  AIR_VENT = 'AIR_VENT',
  THERMOSTAT = 'THERMOSTAT',
}
```

**UI - Symbol Library Panel:**
```
┌─────────────────────────────────────┐
│ Symbol Library              [🔍][X] │
├─────────────────────────────────────┤
│                                     │
│ Category: [Electrical     ▾]        │
│                                     │
│ ┌───┬───┬───┬───┐                  │
│ │ ⚡ │ ◉ │ ○ │ ☼ │  Row 1          │
│ └───┴───┴───┴───┘                  │
│  Out  Sw  Lt  Fan                  │
│                                     │
│ ┌───┬───┬───┬───┐                  │
│ │ ▢ │   │   │   │  Row 2          │
│ └───┴───┴───┴───┘                  │
│  Pnl                               │
│                                     │
│ ──────────────────────────────     │
│                                     │
│ Category: [Network        ▾]        │
│                                     │
│ ┌───┬───┬───┬───┐                  │
│ │ ▣ │ ▦ │ ⚡ │ ☷ │                  │
│ └───┴───┴───┴───┘                  │
│  PP  Rck UPS Mod                   │
│                                     │
│ ──────────────────────────────     │
│                                     │
│ Category: [Safety         ▾]        │
│                                     │
│ ┌───┬───┬───┬───┐                  │
│ │ 🧯 │ 🚪 │ 🔔 │ 🚨 │                  │
│ └───┴───┴───┴───┘                  │
│  Ext Exit Smk Alm                  │
│                                     │
│ [+ Upload Custom Symbol]            │
│                                     │
└─────────────────────────────────────┘
```

**Workflow:**
```
1. Open Symbol Library panel
2. Select category
3. Drag symbol onto canvas
4. Drop at desired location
5. Adjust size/rotation if needed
```

**Symbol Visual Examples:**
```
Outlet:  ⚡  or  ◉
Switch:  ◉
Light:   ○  or  ☼
Exit:    🚪  with "EXIT" text
Fire:    🧯  or  ▲ with red fill
```

**Use Case:** Standard floor plan symbols, consistent icons

---

## 🔧 GROUP D: UTILITIES

### 1. Grid & Snap Settings

**Purpose:** Precise alignment and consistent spacing

**Data Model:**
```typescript
interface GridSettings {
  enabled: boolean;
  visible: boolean;        // show/hide grid lines
  snapToGrid: boolean;
  gridSize: number;        // pixels between grid lines
  gridColor: string;
  gridOpacity: number;
  showRulers: boolean;
  snapToAngles: boolean;   // snap rotations to increments
  angleIncrements: number[];  // [15, 30, 45, 90]
}
```

**UI Panel:**
```
┌─────────────────────────────────────┐
│ Grid & Snap Settings            [X] │
├─────────────────────────────────────┤
│                                     │
│ Grid:                               │
│  ☑ Enable Grid                      │
│  ☑ Show Grid Lines                  │
│  ☑ Snap to Grid                     │
│                                     │
│ Grid Size: [20] px                  │
│                                     │
│ Grid Color: [███] #e5e7eb           │
│ Opacity:    ████░░░░░░ 30%          │
│                                     │
│ ──────────────────────────────     │
│                                     │
│ Rulers:                             │
│  ☑ Show Rulers                      │
│  Unit: ● Pixels  ○ Meters           │
│                                     │
│ ──────────────────────────────     │
│                                     │
│ Snap Settings:                      │
│  ☑ Snap to Objects                  │
│  ☑ Snap to Angles                   │
│  Angle Increments:                  │
│    ☑ 15°  ☑ 30°  ☑ 45°  ☑ 90°      │
│                                     │
│ Snap Distance: [10] px              │
│                                     │
│        [Reset to Defaults]          │
│                                     │
└─────────────────────────────────────┘
```

**Visual with Grid:**
```
┌─────────────────────────────────────┐
│ 0   10  20  30  40  50 ... ← Ruler │
│ ·   ·   ·   ·   ·   ·              │
│ ·   ·   ·   ·   ·   ·              │
│ ·   ·  ┌───────┐   ·              │
│ ·   ·  │ Shape │   ·   ← Snaps    │
│ ·   ·  └───────┘   ·      to grid │
│ ·   ·   ·   ·   ·   ·              │
│ ·   ·   ·   ·   ·   ·              │
└─────────────────────────────────────┘
```

---

### 2. Context Menu (Right-Click)

**Purpose:** Quick actions for selected items

**Mockup:**
```
Right-click shape:
┌──────────────────────────────┐
│ Cut                    [⌘X]  │
│ Copy                   [⌘C]  │
│ Paste                  [⌘V]  │
│ Duplicate              [⌘D]  │
│ ──────────────────────────   │
│ Edit Properties...           │
│ Change Style...              │
│ ──────────────────────────   │
│ Bring to Front         [⌘⇧]  │
│ Bring Forward          [⌘]   │
│ Send Backward          [⌘]   │
│ Send to Back           [⌘⇧]  │
│ ──────────────────────────   │
│ Flip Horizontal              │
│ Flip Vertical                │
│ Rotate 90° CW                │
│ Rotate 90° CCW               │
│ ──────────────────────────   │
│ Group Selected         [⌘G]  │
│ Ungroup                [⌘⇧G] │
│ ──────────────────────────   │
│ Lock                         │
│ Hide                         │
│ ──────────────────────────   │
│ Delete                 [⌫]   │
└──────────────────────────────┘

Right-click cable:
┌──────────────────────────────┐
│ Edit Cable Properties...     │
│ Change Routing Mode     ►    │ → Submenu
│ ──────────────────────────   │
│ Add to Bundle...             │
│ Remove from Bundle           │
│ ──────────────────────────   │
│ Trace Connection             │
│ Show Connected Assets        │
│ ──────────────────────────   │
│ Delete Cable           [⌫]   │
└──────────────────────────────┘

Right-click empty canvas:
┌──────────────────────────────┐
│ Paste                  [⌘V]  │
│ ──────────────────────────   │
│ Select All             [⌘A]  │
│ Deselect All                 │
│ ──────────────────────────   │
│ Grid Settings...             │
│ Canvas Properties...         │
│ ──────────────────────────   │
│ Export...              [⌘E]  │
└──────────────────────────────┘
```

---

### 3. Mini-map (Navigator)

**Purpose:** Overview and quick navigation for large floor plans

**Mockup:**
```
Main Canvas with Mini-map:
┌──────────────────────────────────────┐
│ Floor Plan (zoomed in)               │
│                                      │
│  ┌──────────┐                        │
│  │ Room 101 │                        │
│  │  [AP]    │                        │
│  │          │                        │
│  └──────────┘            ┌────────┐ │
│                          │ ▭ ▫ ▫  │ │
│                          │ ▫ ■ ▫  │ │ ← Mini-map
│                          │ ▫ ▫ ▫  │ │   (corner)
│                          └────────┘ │
│                            ↑         │
│                       Current view   │
└──────────────────────────────────────┘

Mini-map Details:
┌────────────────────────┐
│ Navigator          [X] │
├────────────────────────┤
│                        │
│  ▭ ▭ ▫ ▫              │
│  ▫ ▫ ▫ ▫              │ ← Entire floor
│  ▫ ■ ▫ ▫              │   (miniature)
│  ▫ ▫ ▫ ▫              │
│                        │
│  ┌──────┐             │
│  │ View │  ← Viewport │ ← Click/drag
│  └──────┘    rectangle│   to pan
│                        │
│  Zoom: [85%]           │
│                        │
└────────────────────────┘

Legend:
▭ = Rooms
▫ = Assets
■ = Current viewport (highlighted)
```

**Features:**
- Click mini-map → Jump to location
- Drag viewport box → Pan canvas
- Hover → Show tooltip with area name
- Toggle on/off: `Cmd+M`

---

### 4. Paint Bucket (Quick Fill)

**Purpose:** Rapid color changes without opening properties

**Toolbar:**
```
│ 🪣 │ Paint      [K] │
```

**Workflow:**
```
┌────────────────────────────────┐
│  [K] Paint Bucket Active       │
│                                │
│  Current Color: [███] Blue     │
│   (click to change)            │
│                                │
│  Click any shape to fill:      │
│                                │
│    ┌────────┐                 │
│    │ Shape  │ ← Click!         │
│    └────────┘                 │
│        ↓                       │
│    ┌────────┐                 │
│    │ Shape  │ ← Now blue!      │
│    └────────┘                 │
│                                │
│  Hold Alt = Change stroke      │
│                                │
└────────────────────────────────┘
```

**Color Picker:**
```
┌──────────────────────────┐
│ Quick Color Picker   [X] │
├──────────────────────────┤
│                          │
│  Recent Colors:          │
│  ███ ███ ███ ███ ███    │
│                          │
│  Palette:                │
│  ███ ███ ███ ███ ███    │
│  ███ ███ ███ ███ ███    │
│  ███ ███ ███ ███ ███    │
│                          │
│  Custom: [███] #3b82f6   │
│                          │
│  [OK]                    │
│                          │
└──────────────────────────┘
```

---

### 5. Crop Tool

**Purpose:** Crop shapes and images

**Toolbar:**
```
│ ✂ │ Crop       [X] │
```

**Workflow:**
```
Step 1: Select shape to crop
┌────────────────────────────────┐
│  ┌─────────────────┐           │
│  │                 │           │
│  │    Image or     │           │
│  │    Large Shape  │           │
│  │                 │           │
│  └─────────────────┘           │
│                                │
└────────────────────────────────┘

Step 2: Click Crop tool
┌────────────────────────────────┐
│  ┌─────────────────┐           │
│  │ ┏━━━━━━━━━━━┓   │ ← Crop    │
│  │ ┃           ┃   │   handles │
│  │ ┃  Keep     ┃   │           │
│  │ ┃  Area     ┃   │           │
│  │ ┗━━━━━━━━━━━┛   │           │
│  └─────────────────┘           │
│                                │
│  [Cancel]  [Apply Crop]        │
│                                │
└────────────────────────────────┘

Step 3: Cropped result
┌────────────────────────────────┐
│  ┌──────────┐                  │
│  │          │                  │
│  │  Keep    │                  │
│  │  Area    │                  │
│  └──────────┘                  │
│                                │
└────────────────────────────────┘
```

---

### 6. History Panel (Undo/Redo List)

**Purpose:** Visual history of all actions

**Mockup:**
```
┌─────────────────────────────────────┐
│ History                   [Clear]   │
├─────────────────────────────────────┤
│                                     │
│  ● Created Rectangle "Room A"   ←   │
│    12:34 PM                         │
│                                     │
│  ○ Changed fill color to blue       │
│    12:35 PM                         │
│                                     │
│  ○ Moved Rectangle 10px right       │
│    12:36 PM                         │
│                                     │
│  ○ Created Cable (Router→Switch)    │
│    12:37 PM                         │
│                                     │
│  ○ [Future] (can redo)              │
│    Changed routing to orthogonal    │
│                                     │
│  [Undo Last]  [Redo Next]           │
│                                     │
└─────────────────────────────────────┘

● = Current state
○ = Past action (click to jump)
[Future] = Undone actions (can redo)
```

**Features:**
- Click any history item → Jump to that state
- Right-click → Delete history from that point
- Max 50 states (configurable)

---

## 🔌 GROUP E: CABLE ADVANCED

### 1. Cable Bundles

Already covered in V1 fixes section, but here's the **UI workflow:**

**Bundle Creation:**
```
Method 1: Select multiple cables
┌────────────────────────────────┐
│  Select cables:                │
│                                │
│  [A] ─────── [B]  ← Selected   │
│  [A] ─────── [B]  ← Selected   │
│  [A] ─────── [B]  ← Selected   │
│                                │
│  Right-click → "Create Bundle" │
│                                │
└────────────────────────────────┘

Bundle Dialog:
┌─────────────────────────────────────┐
│ Create Cable Bundle             [X] │
├─────────────────────────────────────┤
│                                     │
│ Bundle Name: [Trunk A         ]   │
│                                     │
│ Cables in Bundle: 3                 │
│  • Cable 1: Ethernet Cat6           │
│  • Cable 2: Ethernet Cat6           │
│  • Cable 3: Fiber Optic             │
│                                     │
│ Rendering:                          │
│  ● Render as single thick cable     │
│  ○ Render individually with label   │
│                                     │
│ Display Cable Count: ☑ Show "3x"    │
│                                     │
│ Bundle Color: [███] Blue            │
│                                     │
│ Preview:                            │
│  [A] ═══════════════ [B]            │
│         "3x Trunk A"                │
│                                     │
│         [Cancel]  [Create Bundle]   │
└─────────────────────────────────────┘

Result:
┌────────────────────────────────┐
│  [A] ═══════════════ [B]       │
│         "3x Trunk A"           │
│    (replaces 3 individual)     │
│                                │
│  Click bundle → Edit           │
│  Right-click → "Unbundle"      │
│                                │
└────────────────────────────────┘
```

---

### 2. Port Diagrams

**Purpose:** Visual representation of device ports and connections

**Data Model:**
```typescript
interface AssetWithPorts extends Asset {
  ports: Port[];
  portLayout?: PortLayoutType;  // 'linear' | 'grid' | 'custom'
}

interface Port {
  number: number;
  label: string;
  type: 'RJ45' | 'SFP' | 'SFP+' | 'USB' | 'HDMI' | 'POWER';
  status: 'connected' | 'available' | 'disabled' | 'faulty';
  connectedCableId?: string;
  speed?: string;  // e.g., "1Gbps", "10Gbps"
  vlan?: number;
}

enum PortLayoutType {
  LINEAR = 'LINEAR',      // Single row
  GRID = 'GRID',          // Multiple rows
  CUSTOM = 'CUSTOM',      // Custom positioning
}
```

**UI - Port Diagram Modal:**
```
Click asset with ports:
┌─────────────────────────────────────────────────┐
│ Switch-01 - Port Diagram                   [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Front Panel                               │ │
│  ├───────────────────────────────────────────┤ │
│  │                                           │ │
│  │  [1] [2] [3] [4] [5] [6] [7] [8]         │ │
│  │   ●   ●   ○   ●   ○   ○   ●   ●          │ │
│  │                                           │ │
│  │  [9][10][11][12][13][14][15][16]         │ │
│  │   ○   ○   ●   ○   ○   ○   ○   ●          │ │
│  │                                           │ │
│  │  [SFP+1] [SFP+2] [SFP+3] [SFP+4]         │ │
│  │     ●       ○       ○       ○            │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ● = Connected  ○ = Available  ✗ = Faulty      │
│                                                 │
│  Port Details: (Hover over port)                │
│  ┌─────────────────────────────────────────┐   │
│  │ Port 1                                  │   │
│  │ Status: Connected                       │   │
│  │ Type: RJ45 (1Gbps)                      │   │
│  │ Connected to: AP-03 (Port A)            │   │
│  │ Cable: Ethernet Cat6                    │   │
│  │ VLAN: 10                                │   │
│  │                                         │   │
│  │ [Edit Connection]  [Disconnect]         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Edit Port Layout]  [Close]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Compact View on Canvas:**
```
Hover over asset with ports:
┌────────────────────┐
│  [Switch-01]       │
│  ─────────────     │ ← Port indicator
│  ●●○●○○●● (8/16)   │   (connected/total)
│                    │
│  Click for details │
└────────────────────┘
```

---

### 3. Cable Schedule / Report

**Purpose:** Auto-generated table of all cables

**UI - Cable Schedule Table:**
```
┌───────────────────────────────────────────────────────────────────────┐
│ Cable Schedule - Floor 1                            [Export CSV] [🖨] │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  # │ From          │ To            │ Type      │ Length │ Ports       │
│ ───┼───────────────┼───────────────┼───────────┼────────┼────────── │
│  1 │ Router-01     │ Switch-02     │ Fiber     │ 15.2m  │ 1 → 8      │
│  2 │ Switch-02     │ AP-03         │ Cat6      │ 22.5m  │ 2 → A      │
│  3 │ Switch-02     │ AP-04         │ Cat6      │ 18.7m  │ 3 → A      │
│  4 │ Switch-02     │ Camera-05     │ Cat6 PoE  │ 12.0m  │ 4 → 1      │
│  5 │ Patch Panel   │ Room 101      │ Cat6      │ 35.0m  │ 12 → Jack  │
│  6 │ Patch Panel   │ Room 102      │ Cat6      │ 40.0m  │ 13 → Jack  │
│ ...│ ...           │ ...           │ ...       │ ...    │ ...        │
│                                                                        │
│  Total Cables: 25                                                      │
│  Total Length: 523.5 meters                                            │
│                                                                        │
│  By Type:                                                              │
│   • Ethernet Cat6: 18 cables (420m)                                    │
│   • Fiber Optic: 5 cables (85m)                                        │
│   • Power: 2 cables (18.5m)                                            │
│                                                                        │
│  [Filter by Type]  [Sort by Length]  [Generate Report]                │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

**Export Options:**
- CSV (Excel-compatible)
- PDF (formatted table)
- JSON (data export)

---

### 4. Wire Color Coding (Multi-conductor Cables)

**Purpose:** Document internal wire colors for complex cables

**Data Model:**
```typescript
interface Cable {
  // ... existing fields
  wireCount?: number;          // e.g., 4 for Cat6 (4 pairs)
  wireColors?: WireColor[];    // ['blue', 'orange', 'green', 'brown']
  wirePairs?: boolean;         // true for twisted pairs
}

interface WireColor {
  color: string;
  label?: string;     // e.g., "Pair 1", "Ground"
  function?: string;  // e.g., "Data +", "Data -"
}
```

**Visual on Canvas:**
```
Multi-conductor cable:
[A] ═══════════════ [B]
    ║║║║ ← Multiple stripes
    ↑
    Wire colors (hover to see)

Hover tooltip:
┌───────────────────────┐
│ Cable: Ethernet Cat6  │
│ 4 Twisted Pairs:      │
│  █ Blue/White         │
│  █ Orange/White       │
│  █ Green/White        │
│  █ Brown/White        │
└───────────────────────┘
```

**Edit Dialog:**
```
┌─────────────────────────────────────┐
│ Cable Wire Configuration        [X] │
├─────────────────────────────────────┤
│                                     │
│ Cable: Ethernet Cat6                │
│                                     │
│ Wire Count: [4] pairs               │
│                                     │
│ Wire Colors:                        │
│  1. [███] Blue/White   - Pair 1     │
│  2. [███] Orange/White - Pair 2     │
│  3. [███] Green/White  - Pair 3     │
│  4. [███] Brown/White  - Pair 4     │
│                                     │
│ [+ Add Wire]                        │
│                                     │
│ ☑ Show on canvas                    │
│ ☑ Include in export                 │
│                                     │
│         [Cancel]  [Save]            │
└─────────────────────────────────────┘
```

---

### 5. Cable Trace & Highlight

**Purpose:** Visually trace cable paths and connections

**Toolbar Action:**
```
Right-click cable or asset:
┌──────────────────────────────┐
│ ...                          │
│ Trace Connection        [🔍] │
│ Highlight Connected Cables   │
│ Show Connected Assets        │
│ ...                          │
└──────────────────────────────┘
```

**Visual Effect:**
```
Before:
[Router] ─────── [Switch] ─────── [AP1]
         ─────── [AP2]
         ─────── [Camera]

Click "Trace from Router":
[Router] ═══════ [Switch] ═══════ [AP1]  ← Highlighted
         ═══════ [AP2]                   ← Highlighted
         ═══════ [Camera]                ← Highlighted
    ↑
  All connected cables/assets glow

Side Panel:
┌─────────────────────────────────────┐
│ Connection Trace - Router-01        │
├─────────────────────────────────────┤
│                                     │
│ Direct Connections: 1               │
│  → Switch-02 (Fiber, 15m)           │
│                                     │
│ Secondary Connections: 3            │
│  → AP-03 (via Switch-02)            │
│  → AP-04 (via Switch-02)            │
│  → Camera-05 (via Switch-02)        │
│                                     │
│ Total Devices: 5                    │
│ Total Cable Length: 68.4m           │
│                                     │
│ [Export Trace]  [Close]             │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 GROUP F: SMART FEATURES

### 1. Auto-Distribute

**Purpose:** Evenly space multiple selected shapes

**Toolbar:**
```
Select multiple shapes → Toolbar shows:
┌────────────────────────────────┐
│ Distribute:                    │
│  [⟷] Horizontal  [⟺] Vertical │
└────────────────────────────────┘
```

**Visual:**
```
Before:
[A]  [B]      [C][D]    [E]
     (uneven spacing)

After (Horizontal Distribute):
[A]   [B]   [C]   [D]   [E]
      (equal spacing)

Before:
[A]
[B]


[C]
(uneven vertical)

After (Vertical Distribute):
[A]

[B]

[C]
(equal vertical spacing)
```

---

### 2. Mirror / Flip

**Purpose:** Flip shapes horizontally or vertically

**Keyboard:** `H` (horizontal), `V` (vertical)

**Context Menu:**
```
Right-click shape:
┌──────────────────────────────┐
│ ...                          │
│ Flip Horizontal         [H]  │
│ Flip Vertical           [V]  │
│ ...                          │
└──────────────────────────────┘
```

**Visual:**
```
Original Arrow:     →

Flip Horizontal:    ←

Flip Vertical:      → (rotated 180°)

Original Text:    Text

Flip Horizontal:  txeT (mirrored)
```

---

### 3. Rotate by Exact Degrees

**Purpose:** Precise rotation control

**Properties Panel:**
```
┌─────────────────────────────┐
│ Transform                   │
├─────────────────────────────┤
│                             │
│ Rotation: [45] °            │
│                             │
│ Quick Rotate:               │
│  [90°]  [180°]  [270°]      │
│  [-90°] [-45°]  [45°]       │
│                             │
│ Reset Rotation: [0°]        │
│                             │
└─────────────────────────────┘
```

**Rotate Handle (on shape):**
```
    ○ ← Rotate handle
    │
┌───┴───┐
│ Shape │
└───────┘

Drag while holding Shift:
→ Snap to 15° increments
```

---

### 4. Snap to Angles

**Purpose:** Constrain lines/arrows to specific angles

**Settings:**
```
┌─────────────────────────────┐
│ Snap Settings               │
├─────────────────────────────┤
│                             │
│ ☑ Snap to Angles            │
│                             │
│ Angle Increments:           │
│  ☑ 15°                      │
│  ☑ 30°                      │
│  ☑ 45°                      │
│  ☑ 90°                      │
│                             │
│ ☑ Show angle indicator      │
│                             │
└─────────────────────────────┘
```

**Visual Indicator:**
```
Drawing line with snap:
    Start
      ●
       ╲
        ╲ 45° ← Angle indicator
         ╲
          ●
         End

Snaps to nearest increment
```

---

### 5. Constraints

**Purpose:** Maintain relationships between shapes

**Types:**
```typescript
enum ConstraintType {
  EQUAL_SPACING = 'EQUAL_SPACING',     // Maintain equal gaps
  SAME_WIDTH = 'SAME_WIDTH',           // All same width
  SAME_HEIGHT = 'SAME_HEIGHT',         // All same height
  ALIGNED_LEFT = 'ALIGNED_LEFT',       // Left edges aligned
  ALIGNED_RIGHT = 'ALIGNED_RIGHT',     // Right edges aligned
  ALIGNED_TOP = 'ALIGNED_TOP',         // Top edges aligned
  ALIGNED_BOTTOM = 'ALIGNED_BOTTOM',   // Bottom edges aligned
  HORIZONTAL_CENTER = 'HORIZONTAL_CENTER',
  VERTICAL_CENTER = 'VERTICAL_CENTER',
}

interface Constraint {
  id: string;
  type: ConstraintType;
  shapeIds: string[];
  locked: boolean;  // If true, can't be broken
}
```

**UI:**
```
Select shapes → Right-click:
┌──────────────────────────────┐
│ Apply Constraint         ►   │
│   → Equal Spacing            │
│   → Same Width               │
│   → Same Height              │
│   → Align Left               │
│   → Align Right              │
│   → Align Top                │
│   → Align Bottom             │
│   → Center Horizontally      │
│   → Center Vertically        │
└──────────────────────────────┘

Constraint Applied:
┌──────────────────────────────┐
│ [A]  [B]  [C]  [D]           │
│  └────┴────┴────┘            │
│   Equal spacing constraint   │
│                              │
│ Move one → Others adjust     │
│ automatically                │
│                              │
│ Right-click → "Remove        │
│ Constraint" to unlock        │
└──────────────────────────────┘
```

---

### 6. Smart Guides (Alignment Helpers)

**Purpose:** Real-time alignment suggestions while dragging

**Visual:**
```
Dragging shape:
┌────────────────────────────────┐
│  [A]                           │
│                                │
│         [B] ← Dragging         │
│         ┆                      │  ← Guide line
│         ┆                      │    (appears when
│  [C]    ┆                      │     edges align)
│                                │
│  Aligned with left edge of A   │
│                                │
└────────────────────────────────┘

Multiple Guides:
┌────────────────────────────────┐
│  [A]                           │
│   │                            │
│   │  [B] ← Dragging            │
│   │   │                        │
│   │   │                        │
│  [C] [D]                       │
│                                │
│  ├─ Vertical alignment         │
│  └─ Horizontal spacing match   │
│                                │
└────────────────────────────────┘
```

**Settings:**
```
┌─────────────────────────────┐
│ Smart Guides                │
├─────────────────────────────┤
│                             │
│ ☑ Enable Smart Guides       │
│                             │
│ Show guides for:            │
│  ☑ Edge alignment           │
│  ☑ Center alignment         │
│  ☑ Spacing match            │
│  ☑ Size match               │
│                             │
│ Guide Color: [███] #ff00ff  │
│                             │
│ Snap Distance: [5] px       │
│                             │
└─────────────────────────────┘
```

---

## ⚡ GROUP G: PERFORMANCE OPTIMIZATIONS

### 1. Spatial Indexing (R-tree)

**Purpose:** Fast hit detection and collision queries

**Implementation:**
```typescript
import RBush from 'rbush';

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  shape: DrawingShape;
}

class CanvasPerformance {
  private spatialIndex: RBush<SpatialItem>;

  constructor() {
    this.spatialIndex = new RBush();
  }

  // Index all shapes
  indexShapes(shapes: DrawingShape[]) {
    const items: SpatialItem[] = shapes.map(shape => ({
      minX: shape.data.x,
      minY: shape.data.y,
      maxX: shape.data.x + (shape.data.width || 0),
      maxY: shape.data.y + (shape.data.height || 0),
      shape,
    }));

    this.spatialIndex.load(items);
  }

  // Fast click detection
  findShapeAtPoint(x: number, y: number): DrawingShape | null {
    const candidates = this.spatialIndex.search({
      minX: x - 5,
      minY: y - 5,
      maxX: x + 5,
      maxY: y + 5,
    });

    // Only check precise hit on candidates
    for (const item of candidates) {
      if (this.preciseHitTest(item.shape, x, y)) {
        return item.shape;
      }
    }

    return null;
  }

  // Collision detection
  findOverlappingShapes(bounds: Bounds): DrawingShape[] {
    const items = this.spatialIndex.search(bounds);
    return items.map(item => item.shape);
  }
}
```

**Performance Gain:**
- Without: O(n) - check all shapes
- With: O(log n) - only check nearby shapes
- 100x faster for 1000+ shapes

---

### 2. Canvas Virtualization

**Purpose:** Only render shapes visible in viewport

**Implementation:**
```typescript
function useCanvasVirtualization(
  shapes: DrawingShape[],
  viewport: Viewport,
  padding: number = 100  // Extra padding for smooth scroll
) {
  const visibleShapes = useMemo(() => {
    return shapes.filter(shape => {
      const bounds = getShapeBounds(shape);
      return boundsIntersect(bounds, viewport, padding);
    });
  }, [shapes, viewport, padding]);

  return visibleShapes;
}

// Usage in Canvas component
function FloorPlanCanvas({ shapes, ... }) {
  const [viewport, setViewport] = useState(calculateViewport());
  const visibleShapes = useCanvasVirtualization(shapes, viewport);

  return (
    <Stage onWheel={handleViewportChange}>
      <Layer>
        {visibleShapes.map(shape => (
          <ShapeRenderer key={shape.id} shape={shape} />
        ))}
      </Layer>
    </Stage>
  );
}
```

**Visual:**
```
Full floor plan (1000 shapes):
┌─────────────────────────────────┐
│ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ │  ← All shapes
│ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ │     (huge!)
│ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ │
│ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ ▫ │
└─────────────────────────────────┘

Viewport (only renders these):
┌───────────────┐
│ ▫ ▫ ▫ ▫ ▫ ▫ ▫ │ ← Only 20 shapes
│ ▫ ▫ ▫ ▫ ▫ ▫ ▫ │    rendered
│ ▫ ▫ ▫ ▫ ▫ ▫ ▫ │    (visible area)
└───────────────┘

Performance: 50x faster rendering
```

---

### 3. Shape Simplification

**Purpose:** Reduce complexity for distant/small shapes

**Implementation:**
```typescript
function simplifyShape(
  shape: DrawingShape,
  zoom: number
): DrawingShape {
  if (zoom < 0.5) {
    // Very zoomed out → simple bounding box
    return {
      ...shape,
      simplified: true,
      renderAs: 'bbox',  // Bounding box only
    };
  } else if (zoom < 1.0) {
    // Moderately zoomed → reduce detail
    if (shape.type === 'FREEHAND' || shape.type === 'BEZIER') {
      return {
        ...shape,
        data: {
          ...shape.data,
          points: decimatePoints(shape.data.points, 0.5),  // Reduce points
        },
      };
    }
  }

  // Fully zoomed in → full detail
  return shape;
}

// Decimate points (Douglas-Peucker algorithm)
function decimatePoints(points: Point[], tolerance: number): Point[] {
  // Reduce number of points while maintaining shape
  // ...implementation
}
```

**Visual:**
```
Zoom 100% (full detail):
╭────────────╮
│  Complex   │
│   shape    │
│  with all  │
│  details   │
╰────────────╯

Zoom 50% (simplified):
┌───────────┐
│  Simpler  │
│   shape   │
└───────────┘

Zoom 25% (bounding box):
▭ ← Just a box
```

---

## 📤 GROUP H: EXPORT ENHANCEMENTS

### 1. SVG Export

**Purpose:** Vector format for scalability

**Implementation:**
```typescript
async function exportToSVG(
  stage: Konva.Stage,
  options: ExportOptions
): Promise<string> {
  // Konva → SVG conversion
  const svg = stage.toDataURL({
    pixelRatio: 1,
    mimeType: 'image/svg+xml',
  });

  // Add metadata
  const svgWithMetadata = addSVGMetadata(svg, {
    title: options.title,
    description: options.description,
    cables: options.cables,
    shapes: options.shapes,
  });

  return svgWithMetadata;
}
```

**SVG Output:**
```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="1000" height="800"
     viewBox="0 0 1000 800">
  <title>Floor 1 - Main Office</title>
  <desc>Cable and shape diagram</desc>

  <g id="cables">
    <line x1="100" y1="100" x2="300" y2="100"
          stroke="#3b82f6" stroke-width="3"/>
    <!-- More cables -->
  </g>

  <g id="shapes">
    <rect x="50" y="50" width="200" height="150"
          fill="#3b82f6" stroke="#1e293b"/>
    <!-- More shapes -->
  </g>

  <g id="assets">
    <!-- Assets -->
  </g>
</svg>
```

**Benefits:**
- Infinite scalability
- Editable in Illustrator/Inkscape
- Small file size
- Web-friendly

---

### 2. DXF Export (AutoCAD Format)

**Purpose:** Import into CAD software

**Implementation:**
```typescript
import dxf from 'dxf-writer';

async function exportToDXF(
  shapes: DrawingShape[],
  cables: Cable[],
  options: ExportOptions
): Promise<string> {
  const d = new dxf.Drawing();

  // Add layers
  d.addLayer('CABLES', dxf.ACI.BLUE, 'CONTINUOUS');
  d.addLayer('SHAPES', dxf.ACI.RED, 'CONTINUOUS');
  d.addLayer('ASSETS', dxf.ACI.GREEN, 'CONTINUOUS');

  // Add cables as lines
  cables.forEach(cable => {
    d.drawLine(
      cable.startX, cable.startY,
      cable.endX, cable.endY,
      'CABLES'
    );
  });

  // Add shapes
  shapes.forEach(shape => {
    if (shape.type === 'RECTANGLE') {
      d.drawRect(
        shape.data.x, shape.data.y,
        shape.data.width, shape.data.height,
        'SHAPES'
      );
    }
    // ... more shape types
  });

  return d.toDxfString();
}
```

**Use Case:**
- Import into AutoCAD
- Professional architectural plans
- Engineering documentation

---

### 3. JSON Export / Import (Backup & Restore)

**Purpose:** Full state backup and restore

**Data Structure:**
```typescript
interface CanvasBackup {
  version: string;
  exportDate: string;
  floor: {
    id: string;
    name: string;
    imageUrl: string;
    scale: FloorPlanScale;
  };
  cables: Cable[];
  shapes: DrawingShape[];
  layers: Layer[];
  metadata: {
    totalCables: number;
    totalShapes: number;
    totalCableLength: number;
  };
}
```

**Export:**
```typescript
function exportToJSON(): string {
  const backup: CanvasBackup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    floor: currentFloor,
    cables: allCables,
    shapes: allShapes,
    layers: allLayers,
    metadata: calculateMetadata(),
  };

  return JSON.stringify(backup, null, 2);
}
```

**Import:**
```typescript
async function importFromJSON(jsonString: string) {
  const backup: CanvasBackup = JSON.parse(jsonString);

  // Validate version
  if (backup.version !== '1.0') {
    throw new Error('Unsupported backup version');
  }

  // Restore cables
  for (const cable of backup.cables) {
    await cableService.create(cable);
  }

  // Restore shapes
  for (const shape of backup.shapes) {
    await shapeService.create(shape);
  }

  // Restore layers
  // ...

  showToast('Canvas restored successfully');
}
```

**Use Cases:**
- Backup before major changes
- Template sharing between floors
- Version control
- Collaboration (send JSON file)

---

## 📋 V2 IMPLEMENTATION PRIORITY

### **PHASE 7: Essential V2 (5 days)**
High priority features that directly improve core workflow

- [ ] **Grid & Snap** (1 day)
  - Grid visualization
  - Snap to grid
  - Snap to angles

- [ ] **Context Menu** (1 day)
  - Right-click menus
  - Quick actions

- [ ] **Rounded Rectangle & Ellipse** (1 day)
  - Two most-requested shapes

- [ ] **Calibration Tool** (1 day)
  - Scale setting for measurements

- [ ] **SVG Export** (1 day)
  - Vector export

**Deliverable:** Core workflow significantly improved

---

### **PHASE 8: Professional Tools (7 days)**
Features for professional use cases

- [ ] **Symbol Library** (2 days)
  - Pre-made symbols
  - Drag & drop

- [ ] **Callout & Dimension Tools** (2 days)
  - Annotations
  - Professional documentation

- [ ] **Cable Bundles** (1 day)
  - Already planned in V1, implement here

- [ ] **Port Diagrams** (2 days)
  - Asset port visualization
  - Connection tracking

**Deliverable:** Professional-grade documentation tools

---

### **PHASE 9: Advanced Features (8 days)**
Nice-to-have features for power users

- [ ] **Path Tool (Pen)** (2 days)
  - Bezier path creation

- [ ] **Eyedropper & Paint Bucket** (1 day)
  - Quick styling

- [ ] **Clone/Duplicate** (1 day)
  - Array creation

- [ ] **Smart Guides** (1 day)
  - Alignment helpers

- [ ] **Mini-map** (1 day)
  - Navigation overview

- [ ] **Performance Optimizations** (2 days)
  - Spatial indexing
  - Virtualization

**Deliverable:** Power user features complete

---

### **PHASE 10: Polish (5 days)**
Final touches and optimization

- [ ] **History Panel** (1 day)
  - Visual undo/redo

- [ ] **Cable Schedule** (1 day)
  - Auto-generated reports

- [ ] **DXF Export** (1 day)
  - CAD integration

- [ ] **Smart Features** (2 days)
  - Auto-distribute
  - Constraints
  - Mirror/Flip

**Deliverable:** Production-ready V2

---

## 🎯 RECOMMENDED ROLLOUT STRATEGY

### **V1.0: Core** (15 days)
✅ Basic shapes, cables, layers, export
→ Release to beta users

### **V1.5: Essential V2** (5 days)
✅ Grid, context menu, calibration, SVG
→ Release to all users

### **V2.0: Professional** (7 days)
✅ Symbols, callouts, bundles, ports
→ Announce as major update

### **V2.5: Advanced** (8 days)
✅ Path tool, performance, smart guides
→ Power user release

### **V3.0: Polish** (5 days)
✅ History, reports, DXF, constraints
→ Complete feature set

---

**Total V2 Duration: 25 days (5 weeks)**
**Total V1+V2: 40 days (8 weeks)**

---

## 📚 ADDITIONAL RESOURCES

### Libraries for V2

```json
{
  "dependencies": {
    "rbush": "^3.0.1",              // Spatial indexing
    "simplify-js": "^1.2.4",        // Path simplification
    "dxf-writer": "^1.2.1",         // DXF export
    "clipper-lib": "^1.0.0",        // Boolean operations
    "chroma-js": "^2.4.2"           // Color manipulation
  }
}
```

### Algorithms

- **Douglas-Peucker:** Path simplification
- **R-tree:** Spatial indexing
- **Weiler-Atherton:** Boolean ops on polygons
- **Constraint solving:** Cassowary algorithm

---

**Last Updated:** 2026-02-05
**Status:** V2 Spec Complete
**Ready for:** Implementation planning
