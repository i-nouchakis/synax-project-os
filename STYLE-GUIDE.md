# Synax UI/UX Style Guide

**Version:** 1.0
**Based on:** Katalyst Admin Template
**Theme:** Dark Mode (Primary)
**Framework:** React + Tailwind CSS

---

## 1. Design Philosophy

### Principles
- **Dark-First**: Optimized for dark environments (field work, low-light conditions)
- **Information Dense**: Maximum data visibility without clutter
- **Touch-Friendly**: Large tap targets for mobile/tablet use
- **Offline-Aware**: Visual indicators for sync status
- **Status-Driven**: Color-coded states throughout

### Target Devices
| Device | Priority | Considerations |
|--------|----------|----------------|
| Tablet | Primary | Main field device, touch-optimized |
| Mobile | Secondary | Quick access, camera, QR scanning |
| Desktop | Tertiary | Admin tasks, reporting, planning |

---

## 2. Color System

### Core Palette

```javascript
// tailwind.config.js - colors
colors: {
  // Backgrounds
  background: {
    DEFAULT: '#0d1117',    // Main background
    secondary: '#161b22',  // Cards, elevated surfaces
    tertiary: '#1c2128',   // Hover states, nested elements
  },

  // Surfaces
  surface: {
    DEFAULT: '#161b22',
    hover: '#1c2128',
    active: '#262c36',
    border: '#30363d',
  },

  // Brand / Primary
  primary: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',   // Main primary
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    DEFAULT: '#22d3ee',
  },

  // Semantic Colors
  success: {
    light: '#4ade80',
    DEFAULT: '#22c55e',
    dark: '#16a34a',
    bg: 'rgba(34, 197, 94, 0.1)',
  },

  warning: {
    light: '#fbbf24',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
    bg: 'rgba(245, 158, 11, 0.1)',
  },

  error: {
    light: '#f87171',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
    bg: 'rgba(239, 68, 68, 0.1)',
  },

  info: {
    light: '#60a5fa',
    DEFAULT: '#3b82f6',
    dark: '#2563eb',
    bg: 'rgba(59, 130, 246, 0.1)',
  },

  // Accent Colors (for charts, categories)
  accent: {
    purple: '#a855f7',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
    orange: '#f97316',
  },

  // Text Colors
  text: {
    primary: '#f1f5f9',    // White-ish
    secondary: '#94a3b8',  // Gray
    tertiary: '#64748b',   // Darker gray
    disabled: '#475569',   // Very dark gray
    inverse: '#0f172a',    // For light backgrounds
  },
}
```

### Semantic Color Usage

| Status | Color | Use Case |
|--------|-------|----------|
| **Completed** | `success` | Finished tasks, synced items, online |
| **In Progress** | `primary` | Active work, current selection |
| **Pending** | `warning` | Awaiting action, needs attention |
| **Error/Blocked** | `error` | Failed sync, issues, problems |
| **Info** | `info` | Notifications, hints, neutral info |

### Synax-Specific Status Colors

```javascript
// Installation Status
installationStatus: {
  notStarted: '#64748b',   // Gray
  cabling: '#f59e0b',      // Warning/Orange
  equipment: '#3b82f6',    // Info/Blue
  config: '#a855f7',       // Purple
  documentation: '#22d3ee', // Primary/Cyan
  completed: '#22c55e',    // Success/Green
}

// Sync Status
syncStatus: {
  synced: '#22c55e',       // Green
  pending: '#f59e0b',      // Orange
  syncing: '#22d3ee',      // Cyan (animated)
  error: '#ef4444',        // Red
  offline: '#64748b',      // Gray
}

// Issue Priority
issuePriority: {
  critical: '#ef4444',     // Red
  high: '#f97316',         // Orange
  medium: '#f59e0b',       // Yellow
  low: '#22c55e',          // Green
}
```

---

## 3. Typography

### Font Stack

```javascript
// tailwind.config.js - fontFamily
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
}
```

### Type Scale

| Name | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| `display` | 36px | 700 | 1.2 | Page titles |
| `h1` | 30px | 600 | 1.3 | Section headers |
| `h2` | 24px | 600 | 1.35 | Card titles |
| `h3` | 20px | 600 | 1.4 | Subsection titles |
| `h4` | 16px | 600 | 1.5 | List headers |
| `body-lg` | 16px | 400 | 1.6 | Large body text |
| `body` | 14px | 400 | 1.6 | Default body |
| `body-sm` | 13px | 400 | 1.5 | Secondary info |
| `caption` | 12px | 400 | 1.4 | Labels, hints |
| `tiny` | 11px | 500 | 1.3 | Badges, tags |

### Tailwind Config

```javascript
fontSize: {
  'display': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
  'h1': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
  'h2': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],
  'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
  'h4': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
  'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
  'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
  'tiny': ['0.6875rem', { lineHeight: '1.3', fontWeight: '500' }],
}
```

---

## 4. Spacing System

### Base Unit: 4px

```javascript
// tailwind.config.js - spacing (extends default)
spacing: {
  '0': '0',
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '2.5': '10px',
  '3': '12px',
  '3.5': '14px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '9': '36px',
  '10': '40px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
}
```

### Common Patterns

| Element | Padding | Gap |
|---------|---------|-----|
| Page | `p-6` (24px) | - |
| Card | `p-4` (16px) | - |
| Card Header | `px-4 py-3` | - |
| Button | `px-4 py-2` | - |
| Input | `px-3 py-2` | - |
| List Items | `py-2` | `gap-1` |
| Grid Cards | - | `gap-4` |
| Sections | - | `gap-6` |

---

## 5. Border & Radius

### Border Radius Scale

```javascript
borderRadius: {
  'none': '0',
  'sm': '4px',
  'DEFAULT': '6px',
  'md': '8px',
  'lg': '12px',
  'xl': '16px',
  '2xl': '20px',
  'full': '9999px',
}
```

### Usage

| Element | Radius |
|---------|--------|
| Buttons | `rounded` (6px) |
| Cards | `rounded-lg` (12px) |
| Inputs | `rounded-md` (8px) |
| Badges | `rounded-full` |
| Avatars | `rounded-full` |
| Modals | `rounded-xl` (16px) |
| Tooltips | `rounded-md` (8px) |

### Border Colors

```javascript
borderColor: {
  DEFAULT: '#30363d',
  light: '#3d444d',
  focus: '#22d3ee',
  error: '#ef4444',
}
```

---

## 6. Shadows

```javascript
boxShadow: {
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  'glow-primary': '0 0 20px rgba(34, 211, 238, 0.3)',
  'glow-success': '0 0 20px rgba(34, 197, 94, 0.3)',
  'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
}
```

---

## 7. Component Specifications

### 7.1 Sidebar

```
Width (expanded): 256px
Width (collapsed): 64px
Background: background.DEFAULT (#0d1117)
Border Right: 1px solid surface.border

Logo Area:
  Height: 64px
  Padding: px-4

Nav Items:
  Height: 40px
  Padding: px-3
  Border Radius: rounded-md
  Active: bg-surface.hover, text-primary, left border 2px primary
  Hover: bg-surface.hover

Section Headers:
  Font: caption, text-tertiary, uppercase
  Padding: px-3 py-2

Icons: 20x20px, stroke-width 1.5
Badge: rounded-full, bg-primary, text-tiny
```

### 7.2 Cards

```
Background: surface.DEFAULT (#161b22)
Border: 1px solid surface.border (#30363d)
Border Radius: rounded-lg (12px)
Padding: p-4 (16px)

Card Header:
  Border Bottom: 1px solid surface.border
  Padding: px-4 py-3
  Title: text-h4, text-primary

Card with Stats:
  Icon: 40x40px, bg-{color}.bg, rounded-lg
  Number: text-h1 or text-display
  Label: text-caption, text-secondary
  Trend Badge: text-tiny, colored
```

### 7.3 Buttons

```
Primary:
  Background: primary.DEFAULT (#22d3ee)
  Text: text.inverse (#0f172a)
  Hover: primary.500
  Padding: px-4 py-2
  Border Radius: rounded (6px)
  Font: body, font-medium

Secondary:
  Background: transparent
  Border: 1px solid surface.border
  Text: text.primary
  Hover: bg-surface.hover

Ghost:
  Background: transparent
  Text: text.secondary
  Hover: bg-surface.hover, text-primary

Danger:
  Background: error.DEFAULT
  Text: white
  Hover: error.dark

Sizes:
  sm: px-3 py-1.5, text-body-sm
  md: px-4 py-2, text-body (default)
  lg: px-5 py-2.5, text-body-lg

Icon Button:
  Size: 36x36px (md), 32x32px (sm), 40x40px (lg)
  Border Radius: rounded-md
```

### 7.4 Inputs

```
Background: background.DEFAULT (#0d1117)
Border: 1px solid surface.border
Border Radius: rounded-md (8px)
Padding: px-3 py-2
Text: text.primary
Placeholder: text.tertiary

Focus:
  Border: primary.DEFAULT
  Ring: ring-2 ring-primary/20

Error:
  Border: error.DEFAULT
  Ring: ring-2 ring-error/20

Disabled:
  Background: surface.DEFAULT
  Text: text.disabled
  Cursor: not-allowed

Label:
  Font: caption, font-medium
  Color: text.secondary
  Margin Bottom: mb-1.5

Helper Text:
  Font: caption
  Color: text.tertiary (normal), error (error state)
  Margin Top: mt-1
```

### 7.5 Tables

```
Background: surface.DEFAULT
Border: 1px solid surface.border
Border Radius: rounded-lg (wrapper)

Header:
  Background: background.secondary (#1c2128)
  Text: text.secondary, caption, uppercase
  Padding: px-4 py-3
  Border Bottom: 1px solid surface.border

Row:
  Padding: px-4 py-3
  Border Bottom: 1px solid surface.border (except last)
  Hover: bg-surface.hover

Cell:
  Text: text.primary (default), text.secondary (secondary data)

Pagination:
  Gap: gap-2
  Button: ghost style, 32x32px
  Current: bg-primary, text-inverse
```

### 7.6 Badges / Tags

```
Sizes:
  sm: px-1.5 py-0.5, text-tiny
  md: px-2 py-1, text-caption
  lg: px-2.5 py-1, text-body-sm

Variants:
  Filled: bg-{color}, text-white/inverse
  Soft: bg-{color}.bg (10% opacity), text-{color}
  Outline: border-{color}, text-{color}

Border Radius: rounded-full (pill) or rounded (square)

Status Badge Examples:
  Completed: bg-success.bg, text-success
  In Progress: bg-primary.bg, text-primary
  Pending: bg-warning.bg, text-warning
  Error: bg-error.bg, text-error
```

### 7.7 Modals / Dialogs

```
┌─────────────────────────────────────────┐
│ HEADER (sticky)                         │
│ [Icon] Title                    [X]     │
├─────────────────────────────────────────┤
│ BODY (scrollable, max-h-[85vh])         │
│                                         │
│ ┌─ ModalSection ──────────────────────┐ │
│ │ SECTION TITLE (uppercase, icon)     │ │
│ │ Content / ModalInfoRow components   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ ModalSection ──────────────────────┐ │
│ │ SECTION TITLE                       │ │
│ │ Content...                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ FOOTER (sticky)                         │
│              [Secondary] [Primary]      │
└─────────────────────────────────────────┘

Overlay: bg-black/60, backdrop-blur-sm, p-4
Container:
  Background: surface.DEFAULT
  Border: 1px solid surface.border
  Border Radius: rounded-xl (16px)
  Shadow: shadow-xl
  Max Height: 85vh (scrollable body)
  Max Width: sm (384px), md (448px), lg (672px), xl (896px), full (1152px)
  Display: flex flex-col

Header:
  Padding: px-6 py-4
  Border Bottom: 1px solid surface.border
  Icon: 32x32px, bg-primary/10, rounded-lg, text-primary
  Title: text-lg font-semibold
  Close Button: p-2 rounded-lg, hover:bg-surface-hover

Body:
  Padding: px-6 py-5
  Overflow: overflow-y-auto
  Flex: flex-1

Footer:
  Padding: px-6 py-4
  Border Top: 1px solid surface.border
  Background: bg-surface (sticky effect)
  Buttons: justify-end, gap-3 (via ModalActions)
```

#### Modal Helper Components

```typescript
// ModalSection - Groups related content
<ModalSection title="Section Title" icon={<IconComponent />}>
  {children}
</ModalSection>

Styling:
  Container: rounded-lg bg-background border border-surface-border
  Header: px-4 py-3, border-b, flex items-center gap-2
  Title: text-sm font-medium text-text-secondary uppercase tracking-wide
  Content: p-4 (or noPadding prop for custom layouts)

// ModalInfoRow - Label/value display with icon
<ModalInfoRow label="Label" value={value} icon={<Icon />} />

Styling:
  Container: flex items-start gap-3 py-2
  Icon: text-text-tertiary, mt-0.5
  Label: text-xs text-text-tertiary uppercase tracking-wide
  Value: text-sm text-text-primary

// ModalActions - Footer button alignment
<ModalActions>
  <Button variant="secondary">Cancel</Button>
  <Button>Primary Action</Button>
</ModalActions>

Styling:
  Container: flex items-center justify-end gap-3
```

#### Modal Types & Guidelines

| Modal Type | Size | Footer | Sections |
|------------|------|--------|----------|
| Confirm Dialog | sm | Yes (Cancel + Action) | None |
| Create Form | md | Yes (Cancel + Create) | Group fields by category |
| Edit Form | md/lg | Yes (Cancel + Save) | Group fields by category |
| Detail View | lg | Optional (Actions) | Multiple sections |
| Gallery/Preview | xl/full | Close only | None |

#### Form Modal Guidelines
- Group related fields in ModalSections (e.g., "Basic Info", "Details")
- Use form id + type="submit" for footer button
- Labels above inputs, consistent spacing (space-y-4 inside sections)
- Required fields marked, validation feedback inline

#### Detail Modal Guidelines
- Status badges at top (outside sections)
- ModalSection for each content group
- ModalInfoRow for key-value data in grid layout
- Actions in footer (status changes, etc.)
- Scrollable content area for long content

### 7.8 Tooltips

```
Background: #1e293b (lighter than surface)
Text: text.primary
Padding: px-2 py-1
Border Radius: rounded-md
Font: caption
Shadow: shadow-lg
Arrow: 6px
Max Width: 200px
```

### 7.9 Progress Bars

```
Track:
  Background: surface.hover
  Height: 8px (md), 4px (sm), 12px (lg)
  Border Radius: rounded-full

Fill:
  Background: primary (default) or semantic color
  Border Radius: rounded-full
  Transition: width 300ms ease

With Label:
  Label Position: above or inline-end
  Percentage: text-caption, text-secondary
```

### 7.10 Avatars

```
Sizes:
  xs: 24x24px
  sm: 32x32px
  md: 40x40px
  lg: 48x48px
  xl: 64x64px

Border Radius: rounded-full
Border: 2px solid surface.border (optional)
Fallback: bg-primary, text-inverse, initials

Status Indicator:
  Size: 25% of avatar
  Position: bottom-right
  Border: 2px solid background
  Colors: success (online), warning (away), error (busy), gray (offline)
```

---

## 8. Icons

### Icon Library
Primary: **Lucide React** (recommended)
Alternative: Heroicons, Phosphor

### Sizes
| Name | Size | Stroke | Use |
|------|------|--------|-----|
| xs | 14px | 1.5 | Inline text, badges |
| sm | 16px | 1.5 | Buttons, inputs |
| md | 20px | 1.5 | Navigation, default |
| lg | 24px | 2 | Headers, emphasis |
| xl | 32px | 2 | Empty states |
| 2xl | 48px | 2 | Large illustrations |

### Colors
- Default: `text.secondary`
- Active/Hover: `text.primary`
- Primary: `primary.DEFAULT`
- Semantic: Match status colors

---

## 9. Layout Patterns

### 9.1 Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (256px)  │  Main Content                        │
│                  │  ┌─────────────────────────────────┐ │
│  Logo            │  │ Header (64px)                   │ │
│  ──────────      │  │ Search | Actions | User         │ │
│  Navigation      │  ├─────────────────────────────────┤ │
│                  │  │                                 │ │
│                  │  │ Page Content                    │ │
│                  │  │ (scrollable)                    │ │
│                  │  │                                 │ │
│                  │  │                                 │ │
│                  │  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Dashboard Grid

```
Stats Row: 4 columns (responsive: 2 on tablet, 1 on mobile)
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Stat   │ │  Stat   │ │  Stat   │ │  Stat   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

Main Content: 2/3 + 1/3 split (or full width)
┌─────────────────────┐ ┌─────────────┐
│                     │ │             │
│   Main Chart/       │ │  Secondary  │
│   Content           │ │  Widget     │
│                     │ │             │
└─────────────────────┘ └─────────────┘

Grid gap: gap-4 (16px) or gap-6 (24px)
```

### 9.3 List/Detail Pattern (for Assets, Issues, etc.)

```
┌────────────────┬─────────────────────────────────┐
│ List Panel     │ Detail Panel                    │
│ (320-400px)    │ (flex-1)                        │
│                │                                 │
│ Search         │ Header + Actions                │
│ Filters        │ ─────────────────────           │
│ ─────────      │                                 │
│ Item 1         │ Content Tabs                    │
│ Item 2 (sel)   │ ┌───┬───┬───┐                   │
│ Item 3         │ │Tab│Tab│Tab│                   │
│ ...            │ └───┴───┴───┘                   │
│                │                                 │
│                │ Tab Content                     │
│                │                                 │
└────────────────┴─────────────────────────────────┘
```

### 9.4 Floor Plan Viewer

```
┌──────────────────────────────────────────────────────────┐
│ Toolbar: Zoom | Pan | Select | Layers | Search          │
├────────────────┬─────────────────────────────────────────┤
│ Layers Panel   │                                         │
│ (collapsible)  │     Floor Plan Canvas                   │
│                │     (Pan & Zoom)                        │
│ □ Cabling      │                                         │
│ □ Equipment    │        [Pin] [Pin]                      │
│ □ Issues       │              [Pin]                      │
│                │                    [Pin]                │
├────────────────┤                                         │
│ Room Details   │                                         │
│ (on pin click) │                                         │
│                │                                         │
└────────────────┴─────────────────────────────────────────┘
```

---

## 10. Synax-Specific Components

### 10.1 Installation Status Card

```
┌──────────────────────────────────────┐
│ 📍 Room 101 - Server Room            │
│ ──────────────────────────────────── │
│                                      │
│ Progress: ████████░░░░░░░░ 65%       │
│                                      │
│ ○ Cabling      ✓ Complete            │
│ ○ Equipment    ◐ In Progress         │
│ ○ Config       ○ Pending             │
│ ○ Photos       ○ Pending             │
│                                      │
│ Assigned: John Doe                   │
│ Last Updated: 2 hours ago            │
│                                      │
│ [View Details]  [Open Checklist]     │
└──────────────────────────────────────┘
```

### 10.2 Sync Status Indicator

```
Global (Header):
┌────────────────────────┐
│ ● Synced  |  ↻ 2 min   │  (green dot, text-caption)
│ ◐ Syncing |  3 items   │  (cyan animated, text-caption)
│ ● Offline |  5 pending │  (gray dot, warning text)
│ ● Error   |  Retry     │  (red dot, error text, action)
└────────────────────────┘

Per Item (Badge):
  [✓ Synced]  [↻ Pending]  [⚠ Error]
```

### 10.3 Floor Plan Pin

```
States:
  Default:    32x32px circle, bg-surface, border-2
  Hover:      scale-110, shadow-glow
  Selected:   ring-2 ring-primary

Colors by Status:
  Not Started: border-gray-500
  In Progress: border-primary, pulse animation
  Completed:   border-success, checkmark icon
  Has Issues:  border-error, warning icon

Tooltip on Hover:
  Room Name
  Status Badge
  X of Y items complete
```

### 10.4 Checklist Item

```
┌──────────────────────────────────────────────────────────┐
│ ☐  Cable termination - Rack A01                         │
│    Required: Photo evidence                              │
│                                                          │
│    [📷 Add Photo]  [✓ Mark Complete]                    │
├──────────────────────────────────────────────────────────┤
│ ☑  Cable termination - Rack A02           ✓ Completed   │
│    Completed by: John Doe - 2h ago                       │
│    📷 2 photos attached                                  │
└──────────────────────────────────────────────────────────┘

Checkbox: 20x20px, rounded-sm, border-2
Completed: bg-success, checkmark icon
```

### 10.5 Issue Card

```
┌──────────────────────────────────────────────────────────┐
│ 🔴 HIGH  │  No power in Room 203                        │
│ ─────────────────────────────────────────────────────── │
│ Location: Floor 2 > Room 203                            │
│ Caused by: Electrical contractor                         │
│ Created: Jan 15, 2026 by John Doe                       │
│                                                          │
│ Status: [● Open ▼]                                      │
│                                                          │
│ 📷 3 photos  💬 5 comments                              │
│                                                          │
│ [View Details]                                          │
└──────────────────────────────────────────────────────────┘

Priority Indicator:
  Critical: bg-error, pulsing
  High: bg-error.bg, text-error
  Medium: bg-warning.bg, text-warning
  Low: bg-success.bg, text-success
```

### 10.6 QR Scanner Overlay

```
┌──────────────────────────────────────┐
│                                      │
│      ┌────────────────────┐          │
│      │                    │          │
│      │    Scanning...     │          │
│      │    ┌──────────┐    │          │
│      │    │  QR BOX  │    │          │
│      │    └──────────┘    │          │
│      │                    │          │
│      └────────────────────┘          │
│                                      │
│      Point camera at QR code         │
│                                      │
│           [Cancel]                   │
│                                      │
└──────────────────────────────────────┘

Scanner Box: border-2 border-primary, rounded-lg
Corners: thicker border, animated
Background: semi-transparent black
```

### 10.7 Digital Signature Pad

```
┌──────────────────────────────────────────────────────────┐
│  Sign here                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │              (signature canvas)                    │ │
│  │                                                    │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Signer Name: ________________________                   │
│                                                          │
│  [Clear]                    [Cancel]  [Confirm]         │
└──────────────────────────────────────────────────────────┘

Canvas: bg-white, border, rounded-lg
Stroke: #000, 2px width
```

---

## 11. Animation & Transitions

### Timing Functions

```javascript
transitionTimingFunction: {
  'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}
```

### Durations

| Type | Duration | Use |
|------|----------|-----|
| Instant | 0ms | Disable |
| Fast | 100ms | Micro-interactions |
| Normal | 200ms | Most transitions |
| Slow | 300ms | Complex animations |
| Slower | 500ms | Page transitions |

### Common Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Pulse (for syncing, live indicators) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spin (for loading) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 12. Responsive Breakpoints

```javascript
screens: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet portrait
  'lg': '1024px',  // Tablet landscape / Small desktop
  'xl': '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
}
```

### Responsive Patterns

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Sidebar | Hidden (drawer) | Collapsed | Expanded |
| Stats Grid | 1 col | 2 col | 4 col |
| Main/Sidebar | Stacked | Stacked | Side by side |
| Table | Card view | Scrollable | Full |
| Floor Plan | Full screen | With mini panel | With side panel |

---

## 13. Accessibility

### Color Contrast
- Text on background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Clear focus states

### Focus States
```css
/* Default focus ring */
.focus-visible:focus {
  outline: none;
  ring: 2px;
  ring-color: primary;
  ring-offset: 2px;
  ring-offset-color: background;
}
```

### Touch Targets
- Minimum size: 44x44px for touch
- Adequate spacing between interactive elements

### Screen Reader Support
- Semantic HTML elements
- ARIA labels where needed
- Proper heading hierarchy
- Alt text for images

---

## 14. Dark/Light Mode

### Current: Dark Mode Only (v1)

### Future Light Mode Variables (v2)

```javascript
// Light mode overrides
light: {
  background: {
    DEFAULT: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },
  surface: {
    DEFAULT: '#ffffff',
    hover: '#f8fafc',
    border: '#e2e8f0',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
  },
}
```

---

## 15. File Organization

```
src/
├── styles/
│   ├── globals.css          # Tailwind imports, base styles
│   ├── themes/
│   │   ├── dark.css         # Dark theme variables
│   │   └── light.css        # Light theme (future)
│   └── components/          # Component-specific styles (if needed)
│
├── components/
│   └── ui/                  # Reusable UI components (shadcn style)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── table.tsx
│       ├── modal.tsx
│       ├── sidebar.tsx
│       └── ...
│
└── tailwind.config.js       # Full theme configuration
```

---

## 16. Implementation Notes

### Recommended Libraries

| Purpose | Library |
|---------|---------|
| UI Components | shadcn/ui (customized) |
| Icons | Lucide React |
| Charts | Recharts or Tremor |
| Forms | React Hook Form + Zod |
| Date Picker | date-fns + custom |
| Toast/Notifications | Sonner |
| Canvas/Floor Plan | Konva.js |
| Signature | signature_pad |

### CSS Strategy

1. **Tailwind First**: Use utility classes for everything possible
2. **CSS Variables**: For theme tokens (enables future theming)
3. **Component Classes**: Only for complex, repeated patterns
4. **No CSS-in-JS**: Keep styling in Tailwind/CSS

---

*Document Version: 1.0*
*Created: 2026-01-30*
*Based on: Katalyst Admin Template Analysis*
