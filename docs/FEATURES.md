# Synax Features

Comprehensive documentation of all Synax features and capabilities.

---

## 1. Dashboard

The Dashboard provides a real-time overview of all projects and activities.

### Statistics Cards

| Metric | Description |
|--------|-------------|
| Total Projects | Number of active projects |
| Total Floors | Sum of all floors across projects |
| Total Rooms | Sum of all rooms |
| Total Assets | Equipment items tracked |
| Open Issues | Issues requiring attention |
| Checklist Completion | Overall completion percentage |

### Activity Feed

Shows recent actions across all projects:
- New issues created
- Checklists completed
- Assets installed
- Status changes

### Quick Actions

- Navigate to any project
- View open issues
- Access recent activity

---

## 2. Project Management

### Project Properties

| Field | Description |
|-------|-------------|
| Name | Project identifier |
| Description | Detailed project description |
| Client Name | Customer/client name |
| Location | Physical address |
| Status | PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, ARCHIVED |
| Start Date | Project start date |
| End Date | Expected completion date |

### Project Statuses

```
PLANNING → IN_PROGRESS → ON_HOLD (optional) → COMPLETED → ARCHIVED
```

| Status | Description |
|--------|-------------|
| PLANNING | Initial planning phase, no field work |
| IN_PROGRESS | Active installation work |
| ON_HOLD | Temporarily paused |
| COMPLETED | All work finished |
| ARCHIVED | Historical reference only |

### Team Management

- Add/remove team members
- Assign project-specific roles
- View member activity
- Control access based on membership

### Project Views

1. **Card View** - Grid of project cards with key metrics
2. **Detail View** - Full project information with floors and team

---

## 3. Floor Management

### Floor Properties

| Field | Description |
|-------|-------------|
| Name | Floor identifier (e.g., "Ground Floor") |
| Level | Numeric level (-1, 0, 1, 2, etc.) |
| Floor Plan | Uploaded floor plan image/PDF |

### Floor Plan Types

- **IMAGE** - PNG, JPG, GIF images
- **PDF** - PDF documents (opens in new tab)
- **SVG** - Scalable vector graphics
- **DWG** - AutoCAD files (requires viewer)

### Interactive Canvas

The floor plan viewer uses Konva.js for:

- **Zoom** - Mouse wheel or +/- buttons
- **Pan** - Click and drag to navigate
- **Room Pins** - Color-coded pins showing room locations
- **Click Actions** - Click pin to view room details

### Pin Colors (Room Status)

| Color | Status |
|-------|--------|
| Gray | NOT_STARTED |
| Blue | IN_PROGRESS |
| Green | COMPLETED |
| Red | BLOCKED |

---

## 4. Room Management

### Room Properties

| Field | Description |
|-------|-------------|
| Name | Room identifier (e.g., "Room 101") |
| Type | Room category (Guest Room, Corridor, etc.) |
| Status | Installation progress status |
| Notes | Additional information |
| Pin Position | X/Y coordinates on floor plan |
| Floor Plan | Room-level layout (optional) |

### Room Types

- Guest Room
- Corridor
- Lobby
- Conference Room
- Restaurant
- Kitchen
- Storage
- Technical Room
- Bathroom
- Office
- Reception

### Room Statuses

| Status | Description |
|--------|-------------|
| NOT_STARTED | No work begun |
| IN_PROGRESS | Work underway |
| COMPLETED | All work done |
| BLOCKED | Cannot proceed (issue/dependency) |

### Room Floor Plan

Each room can have its own floor plan showing:
- Asset positions
- Pin placement via click
- Drag-to-reposition pins
- Status-based pin colors

---

## 5. Asset Management

### Asset Properties

| Field | Description |
|-------|-------------|
| Name | Asset identifier |
| Type | Equipment category |
| Model | Model number |
| Serial Number | Manufacturer serial |
| MAC Address | Network address |
| IP Address | Assigned IP |
| Status | Installation status |
| Pin Position | Location on room floor plan |
| Installed By | Technician who installed |
| Installed At | Installation timestamp |

### Asset Types

| Type | Icon | Description |
|------|------|-------------|
| Access Point | wifi | WiFi access points |
| Network Switch | router | Network switches |
| Smart TV | tv | Smart TVs and displays |
| IP Camera | camera | Security cameras |
| VoIP Phone | phone | IP telephones |
| POS Terminal | credit-card | Point of sale systems |
| Digital Signage | monitor | Digital display systems |

### Asset Status Lifecycle

```
PLANNED → IN_STOCK → INSTALLED → CONFIGURED → VERIFIED
                                      ↓
                                   FAULTY
```

| Status | Description |
|--------|-------------|
| PLANNED | Scheduled for installation |
| IN_STOCK | Received, not yet installed |
| INSTALLED | Physically installed |
| CONFIGURED | Network configured |
| VERIFIED | Tested and working |
| FAULTY | Defective or broken |

### Asset Search & Filter

- Search by name, serial, MAC address
- Filter by project, room, status, type
- Global asset list across all projects

---

## 6. Checklists

### Checklist Types

| Type | Purpose |
|------|---------|
| CABLING | Cable installation verification |
| EQUIPMENT | Physical installation checks |
| CONFIG | Configuration verification |
| DOCUMENTATION | Documentation completion |

### CABLING Checklist Items

- Cable routed correctly
- Cable properly terminated
- Cable labeled at both ends
- Cable tested and passed
- Cable management neat

### EQUIPMENT Checklist Items

- Device mounted securely
- Power connected
- LED indicators normal
- Physical inspection passed
- Device accessible for maintenance

### CONFIG Checklist Items

- IP address configured
- Network connectivity tested
- VLAN configured correctly
- Device accessible remotely
- Configuration backed up

### DOCUMENTATION Checklist Items

- As-built drawing updated
- Device label attached
- Serial number recorded
- MAC address recorded
- Handover document prepared

### Checklist Status

| Status | Description |
|--------|-------------|
| NOT_STARTED | No items completed |
| IN_PROGRESS | Some items completed |
| COMPLETED | All items done |

### Photo Evidence

- Required for certain items (requiresPhoto flag)
- Multiple photos per item
- Captions for context
- Gallery view with lightbox

---

## 7. Issue Tracking

### Issue Properties

| Field | Description |
|-------|-------------|
| Title | Brief issue description |
| Description | Detailed explanation |
| Priority | Urgency level |
| Status | Current state |
| Caused By | Third-party responsible |
| Room | Associated location |
| Created By | Reporter |
| Resolved At | Resolution timestamp |

### Priority Levels

| Priority | Color | Description |
|----------|-------|-------------|
| LOW | Gray | Minor issue, low urgency |
| MEDIUM | Yellow | Standard priority |
| HIGH | Orange | Urgent attention needed |
| CRITICAL | Red | Immediate action required |

### Issue Workflow

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
  ↑         │           │
  └─────────┴───────────┘ (Reopen)
```

### Quick Actions

| Action | From Status | To Status |
|--------|-------------|-----------|
| Start | OPEN | IN_PROGRESS |
| Resolve | IN_PROGRESS | RESOLVED |
| Close | RESOLVED | CLOSED |
| Reopen | Any | OPEN |

### Comments

- Thread-based discussion
- User attribution
- Timestamp tracking
- Delete own comments

### Photos

- Upload evidence photos
- Captions for context
- Multiple photos per issue

---

## 8. Inventory Management

### Inventory Item Properties

| Field | Description |
|-------|-------------|
| Item Type | Item name/category |
| Description | Detailed description |
| Unit | Measurement unit (pcs, m, kg) |
| Quantity Received | Total received |
| Quantity Used | Total consumed |
| Project | Associated project |

### Stock Calculations

```
Current Stock = Quantity Received - Quantity Used
Low Stock = Current < max(5, Received × 10%)
Out of Stock = Current = 0
```

### Movement Types

| Action | Effect | Use Case |
|--------|--------|----------|
| RECEIVED | +received | New stock arrival |
| CONSUMED | +used | Material used |
| RETURNED | -used | Return to stock |
| ADJUSTED | varies | Inventory correction |

### Stock Logs

Each movement records:
- Action type
- Quantity
- Serial numbers (if applicable)
- Notes
- User who made change
- Timestamp

### Low Stock Alerts

Items with low stock are:
- Highlighted in the inventory list
- Counted in statistics
- Filterable via "Low Stock" filter

---

## 9. Reports

### Report Types

#### Summary Report

High-level overview including:
- Project information
- Overall progress percentage
- Room completion stats
- Asset installation stats
- Issue summary
- Team members

#### Client Report

Customer-facing report with:
- Executive summary
- Floor-by-floor progress
- Asset types and counts
- Issue summary (without internal details)
- Signature status

#### Internal Report

Technical report for team (ADMIN/PM only):
- Technician performance
- Detailed issue list
- Inventory usage
- Activity timeline
- Full measurements

### PDF Export

- Professional formatting
- Company branding
- Automatic generation
- Storage in MinIO
- Download functionality

### Report History

- Track all generated reports
- View/download past reports
- Delete old reports (ADMIN)

---

## 10. Settings

### Profile Settings

- Update name and email
- Change avatar/photo
- View role and status

### Password Settings

- Change password
- Requires current password
- Minimum 6 characters

### Notification Settings

| Setting | Description |
|---------|-------------|
| New Issue | Email on new issues |
| Assignment | Email on task assignment |
| Comments | Email on issue comments |
| Weekly Digest | Weekly summary email |

### Theme Settings

| Theme | Description |
|-------|-------------|
| Dark | Dark mode (default) |
| Light | Light mode |
| System | Follow OS preference |

### Company Settings (Admin Only)

- Company name
- Logo upload
- Contact information
- Address

### API Keys (Admin Only)

- Create API keys
- View key list
- Delete keys
- Copy key to clipboard

---

## 11. User Management (Admin Only)

### User Properties

| Field | Description |
|-------|-------------|
| Name | User display name |
| Email | Login email |
| Role | Access level |
| Status | Active/Inactive |

### User Actions

| Action | Description |
|--------|-------------|
| Create | Add new user |
| Edit | Update user details |
| Activate/Deactivate | Enable/disable access |
| Delete | Remove user |

### Role Assignment

- ADMIN - Full access
- PM - Project management
- TECHNICIAN - Field work
- CLIENT - Read-only access

---

## 12. Manual / Help

Built-in user manual with:
- Getting started guide
- Feature documentation
- Step-by-step instructions
- FAQ section
- Role-specific guides
- Search functionality

---

## Feature Matrix by Role

| Feature | ADMIN | PM | TECH | CLIENT |
|---------|-------|-----|------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create Project | ✅ | ✅ | ❌ | ❌ |
| Manage Floors | ✅ | ✅ | ❌ | ❌ |
| Manage Rooms | ✅ | ✅ | ✅ | ❌ |
| Manage Assets | ✅ | ✅ | ✅ | ❌ |
| Complete Checklists | ✅ | ✅ | ✅ | ❌ |
| Create Issues | ✅ | ✅ | ✅ | ✅ |
| Manage Inventory | ✅ | ✅ | ✅ | ❌ |
| View Internal Reports | ✅ | ✅ | ❌ | ❌ |
| View Client Reports | ✅ | ✅ | ❌ | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |

---

*For workflows, see [WORKFLOWS.md](./WORKFLOWS.md)*
*For API details, see [API.md](./API.md)*
