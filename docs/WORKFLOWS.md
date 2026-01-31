# Synax Workflows

Common workflows and processes for using Synax effectively.

---

## 1. Project Setup Workflow

### Overview

Setting up a new project from scratch.

```
Create Project → Add Floors → Add Rooms → Assign Team → Ready for Work
```

### Step-by-Step

#### 1.1 Create Project

1. Navigate to **Projects** page
2. Click **New Project** button
3. Fill in project details:
   - Name (required)
   - Client Name (required)
   - Description
   - Location
   - Start/End dates
4. Click **Create**

#### 1.2 Add Floors

1. Open the project detail page
2. In **Floors** section, click **Add Floor**
3. Enter floor name and level number
4. (Optional) Upload floor plan image/PDF
5. Repeat for each floor

#### 1.3 Add Rooms

1. Open a floor detail page
2. Click **Add Room**
3. Enter room details:
   - Name (e.g., "Room 101")
   - Type (Guest Room, Corridor, etc.)
   - Notes
4. If floor plan exists, click on the canvas to position the room pin
5. Repeat for all rooms

#### 1.4 Assign Team Members

1. On project detail page, find **Team** section
2. Click **Add Member**
3. Select user from dropdown
4. (Optional) Assign project-specific role
5. Click **Add**

### Result

Project is ready for technicians to:
- Add assets
- Complete checklists
- Track issues

---

## 2. Asset Installation Workflow

### Overview

Complete process for installing and verifying an asset.

```
Create Asset → Install → Configure → Test → Verify → Complete Checklists
```

### Step-by-Step

#### 2.1 Add Asset to Room

1. Navigate to room detail page
2. Click **Add Asset**
3. Select asset type
4. Enter asset details:
   - Name
   - Model
   - Serial Number
   - MAC Address
5. Click **Add Asset**

#### 2.2 Generate Checklists

1. Open asset detail page
2. Click **Generate Checklists**
3. System creates 4 checklists:
   - CABLING
   - EQUIPMENT
   - CONFIG
   - DOCUMENTATION

#### 2.3 Physical Installation

1. Mount equipment in location
2. Open **EQUIPMENT** checklist
3. Complete each item:
   - Device mounted securely ✓
   - Power connected ✓
   - LED indicators normal ✓
4. Upload required photos
5. Update asset status to **INSTALLED**

#### 2.4 Cable Installation

1. Route and terminate cables
2. Open **CABLING** checklist
3. Complete items:
   - Cable routed correctly ✓
   - Cable terminated ✓
   - Cable labeled ✓
   - Cable tested ✓
4. Upload cable photos

#### 2.5 Configuration

1. Configure device network settings
2. Open **CONFIG** checklist
3. Complete items:
   - IP address configured ✓
   - Network connectivity tested ✓
   - VLAN configured ✓
4. Update asset status to **CONFIGURED**

#### 2.6 Verification

1. Test device functionality
2. Complete any remaining checklist items
3. Update asset status to **VERIFIED**
4. Complete **DOCUMENTATION** checklist

#### 2.7 Position on Floor Plan

1. If room has floor plan, open room detail
2. Click on floor plan to place asset pin
3. Or drag existing pin to correct position

### Result

- Asset fully installed and verified
- All checklists completed
- Photo evidence captured
- Asset visible on room floor plan

---

## 3. Issue Management Workflow

### Overview

Tracking and resolving issues/snags.

```
Report Issue → Assign → Investigate → Resolve → Close
```

### Step-by-Step

#### 3.1 Create Issue

1. Navigate to **Issues** page
2. Click **New Issue**
3. Fill in details:
   - Title (brief description)
   - Description (detailed)
   - Priority (LOW/MEDIUM/HIGH/CRITICAL)
   - Project (select)
   - Room (optional)
   - Caused By (third party if applicable)
4. Click **Create**

#### 3.2 Add Evidence

1. Open issue detail
2. Click **Add Photo**
3. Upload photos showing the problem
4. Add captions for context

#### 3.3 Discuss Issue

1. In issue detail, scroll to comments
2. Add comments to discuss
3. Tag relevant team members
4. Document investigation

#### 3.4 Start Working

1. Click **Start** button
2. Status changes to **IN_PROGRESS**
3. Begin fixing the issue

#### 3.5 Document Fix

1. Add photos of the fix
2. Comment on what was done
3. Update any related assets

#### 3.6 Resolve

1. Click **Resolve** button
2. System records resolution timestamp
3. Status changes to **RESOLVED**

#### 3.7 Close

1. PM/Admin reviews resolution
2. Click **Close** button
3. Issue is closed

#### Reopen (if needed)

1. If issue recurs, click **Reopen**
2. Status returns to **OPEN**
3. Repeat resolution process

### Priority Guidelines

| Priority | Response Time | Examples |
|----------|---------------|----------|
| LOW | Within week | Minor cosmetic issues |
| MEDIUM | Within 2-3 days | Standard fixes needed |
| HIGH | Within 24 hours | Impacts functionality |
| CRITICAL | Immediate | Safety or major blockage |

---

## 4. Inventory Management Workflow

### Overview

Managing stock throughout a project.

```
Receive Stock → Track Usage → Adjust → Report
```

### Step-by-Step

#### 4.1 Add Inventory Items

1. Navigate to **Inventory** page
2. Click **Add Item**
3. Enter details:
   - Item Type (e.g., "CAT6 Cable")
   - Description
   - Unit (m, pcs, kg)
   - Project
4. Click **Add**

#### 4.2 Receive Stock

1. Open inventory item
2. Click **Update Stock**
3. Select **Receive** action
4. Enter quantity received
5. (Optional) Enter serial numbers
6. Add notes (supplier, PO number)
7. Click **Confirm**

#### 4.3 Record Consumption

1. When using materials, click **Update Stock**
2. Select **Consume** action
3. Enter quantity used
4. (Optional) Enter serial numbers
5. Add notes (what was it used for)
6. Click **Confirm**

#### 4.4 Handle Returns

1. If materials returned to stock
2. Click **Update Stock**
3. Select **Return** action
4. Enter quantity returned
5. Add notes (reason for return)
6. Click **Confirm**

#### 4.5 Inventory Adjustment

1. After physical count
2. Click **Update Stock**
3. Select **Adjust** action
4. Enter correct quantity
5. Add notes explaining discrepancy
6. Click **Confirm**

#### 4.6 Monitor Stock Levels

1. Check dashboard for low stock alerts
2. Use "Low Stock" filter on Inventory page
3. Review items below threshold
4. Order replenishment as needed

### Stock Movement Log

All movements are logged with:
- Action type
- Quantity
- Serial numbers (if tracked)
- User who made change
- Timestamp
- Notes

---

## 5. Report Generation Workflow

### Overview

Creating reports for internal review or client presentation.

```
Select Project → Choose Type → Preview → Export PDF → Share
```

### Step-by-Step

#### 5.1 Access Reports

1. Navigate to **Reports** page
2. Select project from dropdown
3. Wait for data to load

#### 5.2 Choose Report Type

| Type | Audience | Content |
|------|----------|---------|
| Summary | Internal | High-level overview |
| Client | Customer | Executive dashboard |
| Internal | Team | Technical details |

#### 5.3 Preview Report

1. Click on report type tab
2. Review report content on screen
3. Verify data accuracy
4. Check for missing information

#### 5.4 Export to PDF

1. Click **Export PDF** button
2. Wait for generation (may take a few seconds)
3. PDF preview opens in modal
4. Click **Download** to save file

#### 5.5 View Report History

1. Click **History** button
2. View all generated reports
3. Download previous versions
4. Delete old reports if needed

### Report Contents

#### Summary Report
- Project overview
- Progress statistics
- Room completion chart
- Asset status breakdown
- Issue summary
- Team members

#### Client Report
- Executive summary
- Floor-by-floor progress
- Asset types and quantities
- Issue summary (sanitized)
- Milestone status
- Signature status

#### Internal Report
- Detailed statistics
- Technician performance
- Issue details with comments
- Inventory usage
- Activity timeline
- Technical measurements

---

## 6. Floor Plan Workflow

### Overview

Using interactive floor plans effectively.

```
Upload Plan → Add Rooms → Position Pins → Navigate
```

### Step-by-Step

#### 6.1 Upload Floor Plan

1. Open floor detail page
2. Click **Upload Floor Plan**
3. Select image file (PNG, JPG) or PDF
4. Wait for upload
5. Floor plan appears in viewer

#### 6.2 Position Room Pins

1. Click on floor plan where room is located
2. Select room from dropdown (or create new)
3. Pin appears at clicked location
4. Drag pin to fine-tune position

#### 6.3 Navigate via Floor Plan

1. Use zoom controls (+/-) or mouse wheel
2. Click and drag to pan
3. Click any pin to view room details
4. Use legend to understand pin colors

#### 6.4 Room-Level Floor Plans

1. Open room detail page
2. Click **Upload Floor Plan**
3. Upload room layout image
4. Click to position asset pins
5. Drag pins to correct locations

### Canvas Controls

| Control | Action |
|---------|--------|
| Mouse wheel | Zoom in/out |
| Click + drag | Pan view |
| +/- buttons | Zoom in/out |
| Reset button | Reset to fit |
| Click pin | View details |
| Drag pin | Reposition |

---

## 7. Checklist Completion Workflow

### Overview

Efficiently completing installation checklists.

```
Open Checklist → Complete Items → Upload Photos → Submit
```

### Step-by-Step

#### 7.1 Access Checklists

**Option A: From Asset**
1. Open asset detail page
2. Scroll to checklists section
3. Expand checklist to work on

**Option B: From Checklists Page**
1. Navigate to **Checklists** page
2. Use filters to find assigned checklists
3. Click to open

#### 7.2 Complete Items

1. Read item description
2. Perform the required action
3. Click checkbox to mark complete
4. System records your name and time

#### 7.3 Add Photos

1. For items requiring photos:
   - Click camera icon
   - Select photo file
   - Add caption
   - Upload

2. For additional documentation:
   - Click "Add Photo"
   - Upload evidence
   - Add descriptive caption

#### 7.4 View Progress

- Progress bar shows completion %
- Status auto-updates:
  - 0% = NOT_STARTED
  - 1-99% = IN_PROGRESS
  - 100% = COMPLETED

#### 7.5 Review and Submit

1. Verify all items complete
2. Ensure required photos uploaded
3. Checklist status shows COMPLETED
4. Asset status can be updated

### Best Practices

1. **Complete in order** - Follow checklist sequence
2. **Photo everything** - Even if not required
3. **Be descriptive** - Clear captions help later
4. **Update asset status** - Keep status current
5. **Report issues** - Create issues for problems

---

## 8. Daily Technician Workflow

### Morning

1. **Check Dashboard**
   - View assigned work
   - Check for new issues
   - Review priorities

2. **Plan the Day**
   - Identify rooms to work on
   - Gather required materials
   - Check inventory levels

### During Work

3. **At Each Room**
   - Update room status to IN_PROGRESS
   - Install/configure assets
   - Complete checklists
   - Take photos
   - Report any issues

4. **Material Tracking**
   - Record material consumption
   - Note serial numbers
   - Update inventory logs

### End of Day

5. **Complete Documentation**
   - Finish all checklist items
   - Upload remaining photos
   - Update asset statuses

6. **Update Progress**
   - Mark completed rooms as COMPLETED
   - Add notes for next day
   - Review open issues

7. **Sync Data**
   - Ensure all changes saved
   - Check for sync errors
   - Report any problems

---

## 9. Project Handover Workflow

### Overview

Completing and handing over a project.

```
Verify Completion → Generate Reports → Client Review → Sign-off → Archive
```

### Step-by-Step

#### 9.1 Verify Completion

1. Check all rooms marked COMPLETED
2. Verify all assets VERIFIED
3. Confirm all checklists 100%
4. Review open issues (should be 0)
5. Check inventory reconciliation

#### 9.2 Generate Final Reports

1. Generate Summary Report
2. Generate Client Report
3. Generate Internal Report
4. Generate Asset Inventory Report
5. Download all PDFs

#### 9.3 Client Review

1. Share Client Report
2. Schedule walkthrough
3. Address any concerns
4. Document feedback

#### 9.4 Digital Sign-off

1. Collect room handover signatures
2. Collect stage completion signatures
3. Obtain final acceptance signature
4. Store in system

#### 9.5 Archive Project

1. Update project status to COMPLETED
2. Ensure all documentation complete
3. Change status to ARCHIVED
4. Project becomes read-only

---

## 10. Emergency Issue Workflow

### For CRITICAL Issues

1. **Immediate Notification**
   - Create issue with CRITICAL priority
   - Add clear title and description
   - Upload evidence photos

2. **Escalation**
   - System notifies project PM
   - Consider direct communication
   - Document everything

3. **Rapid Response**
   - Assign to available technician
   - Start work immediately
   - Provide regular updates via comments

4. **Resolution**
   - Fix the issue
   - Document solution
   - Upload after photos
   - Resolve and close quickly

5. **Post-Mortem**
   - Review what happened
   - Update processes if needed
   - Document lessons learned

---

*For role-specific guides, see [User Guides](./user-guides/)*
*For feature details, see [FEATURES.md](./FEATURES.md)*
