# Technician User Guide

Complete guide for field technicians using Synax.

---

## Overview

As a **Technician**, you are responsible for:

- Installing and configuring assets
- Completing installation checklists
- Taking documentation photos
- Reporting issues
- Tracking material usage

---

## Quick Reference

### What You Can Do

| Category | Actions |
|----------|---------|
| Rooms | View, update status |
| Assets | Create, edit, update status |
| Checklists | Complete items, upload photos |
| Issues | Create, comment, update |
| Inventory | Record usage |

### What You Cannot Do

| Action | Reason |
|--------|--------|
| Create projects | PM/Admin only |
| Create floors | PM/Admin only |
| Delete projects/floors | Admin only |
| View internal reports | PM/Admin only |
| Manage users | Admin only |

---

## Getting Started

### Logging In

1. Open Synax in your browser
2. Enter your email and password
3. Click **Login**

### Dashboard Overview

Your Dashboard shows:
- **Projects assigned to you**
- Overall statistics
- Recent activity
- Open issues

### Navigating to Work

1. Click project name on Dashboard, OR
2. Go to **Projects** and select yours
3. Click on a floor
4. Click on a room to start work

---

## Working with Rooms

### Viewing Room Details

1. Navigate to room detail page
2. You'll see:
   - Room information
   - Asset list
   - Floor plan (if uploaded)
   - Issues related to room

### Updating Room Status

1. Open room detail
2. Click on status dropdown
3. Select new status:
   - **IN_PROGRESS** - Work started
   - **COMPLETED** - All work done
   - **BLOCKED** - Cannot proceed

**Status Guide:**

| Status | When to Use |
|--------|-------------|
| NOT_STARTED | Haven't begun |
| IN_PROGRESS | Actively working |
| COMPLETED | Everything done |
| BLOCKED | Waiting on something |

---

## Working with Assets

### Adding a New Asset

1. Open room detail page
2. Click **Add Asset**
3. Fill in details:

| Field | Required | Example |
|-------|----------|---------|
| Name | Yes | AP-101 |
| Type | Yes | Access Point |
| Model | No | Ubiquiti UAP-AC-Pro |
| Serial Number | No | SN12345678 |
| MAC Address | No | 00:11:22:33:44:55 |

4. Click **Add Asset**

### Updating Asset Information

1. Click on asset in room
2. Edit fields as needed:
   - Serial number
   - MAC address
   - IP address
   - Model
3. Click **Save**

### Updating Asset Status

Progress through the lifecycle:

```
PLANNED → IN_STOCK → INSTALLED → CONFIGURED → VERIFIED
```

| Status | Meaning |
|--------|---------|
| PLANNED | Scheduled for install |
| IN_STOCK | Equipment received |
| INSTALLED | Physically mounted |
| CONFIGURED | Network settings done |
| VERIFIED | Tested and working |
| FAULTY | Has problems |

**To update status:**
1. Open asset detail
2. Change status dropdown
3. Status updates immediately

### Positioning Assets on Floor Plan

If the room has a floor plan:
1. Open room detail
2. Click on floor plan where asset is located
3. Select asset from dropdown
4. Pin appears at location
5. Drag to fine-tune position

---

## Completing Checklists

### Understanding Checklists

Each asset has 4 checklist types:

| Type | What to Check |
|------|---------------|
| **CABLING** | Cables routed, terminated, labeled, tested |
| **EQUIPMENT** | Mounted, powered, indicators normal |
| **CONFIG** | IP set, connectivity, VLAN, remote access |
| **DOCUMENTATION** | Labels, as-built, records |

### Generating Checklists

1. Open asset detail page
2. Click **Generate Checklists**
3. System creates all 4 types

### Completing Items

1. Open the checklist type you're working on
2. Read each item description
3. Perform the required action
4. Click checkbox to mark complete
5. System records your name and time

### Adding Photos

Many items require photo documentation.

**To add a photo:**
1. Click camera icon next to item
2. Select photo file
3. Add caption describing what's shown
4. Click **Upload**

**Photo Tips:**
- Take clear, well-lit photos
- Include context (wider shots)
- Show labels and serial numbers
- Document before AND after

### Checklist Progress

- Watch the progress bar fill
- Status changes automatically:
  - 0% = NOT_STARTED
  - 1-99% = IN_PROGRESS
  - 100% = COMPLETED

---

## Reporting Issues

### When to Create an Issue

Create an issue when you encounter:
- Damage to work area
- Missing materials
- Equipment defects
- Third-party interference
- Safety concerns
- Blocked access

### Creating an Issue

1. Go to **Issues** page
2. Click **New Issue**
3. Fill in:

| Field | What to Enter |
|-------|---------------|
| Title | Brief description |
| Description | Detailed explanation |
| Priority | LOW/MEDIUM/HIGH/CRITICAL |
| Project | Select project |
| Room | Select if applicable |
| Caused By | Third party name if applicable |

4. Click **Create**

### Adding Evidence

**Photos:**
1. Open issue detail
2. Click **Add Photo**
3. Upload photo
4. Add caption

**Comments:**
1. Scroll to comments section
2. Type your comment
3. Click **Add Comment**

### Issue Priority Guide

| Priority | Use When | Example |
|----------|----------|---------|
| LOW | Minor, not urgent | Cosmetic issue |
| MEDIUM | Standard issue | Equipment not working |
| HIGH | Impacts work | Can't access room |
| CRITICAL | Safety/emergency | Electrical hazard |

---

## Inventory Management

### Recording Material Usage

When you use materials:

1. Go to **Inventory**
2. Find the item
3. Click **Update Stock**
4. Select **Consume**
5. Enter quantity used
6. (Optional) Enter serial numbers
7. Add notes if needed
8. Click **Confirm**

### Receiving Materials

If you receive stock:

1. Click **Update Stock**
2. Select **Receive**
3. Enter quantity
4. Add serial numbers
5. Note supplier info
6. Click **Confirm**

### Returning Materials

For unused materials:

1. Click **Update Stock**
2. Select **Return**
3. Enter quantity
4. Note reason
5. Click **Confirm**

---

## Daily Workflow

### Start of Day

1. **Login to Synax**
2. **Check Dashboard**
   - See today's priorities
   - Check for new issues assigned
3. **Review your work**
   - Which rooms to complete
   - Materials needed

### At Each Room

4. **Update Room Status**
   - Set to IN_PROGRESS

5. **For Each Asset:**
   - Install equipment
   - Complete CABLING checklist
   - Complete EQUIPMENT checklist
   - Update status to INSTALLED

6. **Configure Equipment**
   - Set IP, VLAN, etc.
   - Complete CONFIG checklist
   - Update status to CONFIGURED

7. **Verify and Document**
   - Test functionality
   - Complete DOCUMENTATION checklist
   - Update status to VERIFIED
   - Take final photos

8. **Position on Floor Plan**
   - Click to place asset pin
   - Adjust position if needed

### End of Day

9. **Complete Documentation**
   - Finish pending checklists
   - Upload remaining photos

10. **Update Statuses**
    - Mark completed rooms COMPLETED
    - Update asset statuses

11. **Record Inventory**
    - Log materials used
    - Note any serial numbers

12. **Report Issues**
    - Create issues for problems
    - Add photos and details

---

## Using Floor Plans

### Viewing Floor Plans

1. Open floor or room detail
2. Floor plan shows in canvas
3. Use controls:
   - **Scroll** - Zoom in/out
   - **Drag** - Pan around
   - **+/-** - Zoom buttons
   - **Reset** - Fit to view

### Understanding Pin Colors

**Room Pins (Floor Plan):**
| Color | Status |
|-------|--------|
| Gray | NOT_STARTED |
| Blue | IN_PROGRESS |
| Green | COMPLETED |
| Red | BLOCKED |

**Asset Pins (Room Plan):**
| Color | Status |
|-------|--------|
| Gray | PLANNED |
| Purple | IN_STOCK |
| Blue | INSTALLED |
| Amber | CONFIGURED |
| Green | VERIFIED |
| Red | FAULTY |

### Navigating via Floor Plan

- Click any pin to see details
- Use legend to understand colors
- Identify problem areas quickly

---

## Mobile Tips

### Using on Tablet/Phone

- Synax works on mobile browsers
- Use landscape mode for floor plans
- Pinch to zoom on floor plans
- Take photos directly from camera

### Poor Connectivity

- Complete work offline (if supported)
- Sync when connectivity returns
- Save photos locally if upload fails

---

## Troubleshooting

### Can't See My Projects

- Check you're assigned to project
- Contact PM to be added

### Checklist Not Saving

- Check internet connection
- Refresh the page
- Try again

### Photo Upload Fails

- Check file size (max 10MB)
- Check internet connection
- Try smaller image

### Status Won't Update

- Refresh the page
- Check for error messages
- Report to PM if persists

---

## Best Practices

### Quality Work

1. **Follow checklists in order** - They're designed that way
2. **Don't skip items** - Each is important
3. **Take good photos** - Clear, informative
4. **Update status immediately** - Keep system current

### Documentation

1. **Photo everything** - More is better
2. **Write clear descriptions** - Others will read
3. **Report issues promptly** - Don't wait
4. **Log materials accurately** - Inventory matters

### Communication

1. **Ask questions** - If unsure, ask
2. **Report problems** - Don't hide issues
3. **Update regularly** - Keep status current
4. **Be thorough** - Details matter

---

## Quick Reference Card

### Asset Status Workflow
```
PLANNED → IN_STOCK → INSTALLED → CONFIGURED → VERIFIED
```

### Checklist Order
1. CABLING
2. EQUIPMENT
3. CONFIG
4. DOCUMENTATION

### Issue Priorities
- LOW = Minor (week)
- MEDIUM = Standard (2-3 days)
- HIGH = Urgent (24 hours)
- CRITICAL = Emergency (now)

### Inventory Actions
- RECEIVE = Stock in
- CONSUME = Stock out
- RETURN = Put back
- ADJUST = Correction

---

*For project management tasks, contact your [Project Manager](./PM.md)*
*For workflows, see [Workflows](../WORKFLOWS.md)*
