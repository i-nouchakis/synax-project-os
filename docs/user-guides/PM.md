# Project Manager (PM) User Guide

Complete guide for Project Managers using Synax.

---

## Overview

As a **Project Manager**, you are responsible for:

- Creating and managing projects
- Setting up floors and rooms
- Managing project teams
- Tracking progress
- Generating reports
- Resolving issues

---

## Quick Reference

### What You Can Do

| Category | Actions |
|----------|---------|
| Projects | Create, edit, manage team |
| Floors | Create, edit, delete |
| Rooms | Create, edit, delete, manage status |
| Assets | Full management |
| Checklists | View all, assign, complete |
| Issues | Full management |
| Reports | Summary, Client, Internal |
| Inventory | Full management |

### What You Cannot Do

| Action | Reason |
|--------|--------|
| Manage users | Admin only |
| System settings | Admin only |
| Delete projects | Admin only |

---

## Project Setup

### Creating a New Project

1. Navigate to **Projects** page
2. Click **New Project**
3. Fill in details:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Project identifier |
| Client Name | Yes | Customer name |
| Description | No | Detailed description |
| Location | No | Physical address |
| Start Date | No | Project start |
| End Date | No | Expected completion |

4. Click **Create Project**

### Setting Up Floors

1. Open project detail page
2. In Floors section, click **Add Floor**
3. Enter:
   - **Name** - e.g., "Ground Floor", "Level 1"
   - **Level** - Numeric (-1, 0, 1, 2)
4. Click **Create**

### Uploading Floor Plans

1. Open floor detail page
2. Click **Upload Floor Plan**
3. Select image (PNG, JPG) or PDF
4. Wait for upload to complete
5. Floor plan appears in canvas

### Adding Rooms

1. Open floor detail page
2. Click **Add Room**
3. Enter room details:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Room identifier (e.g., "101") |
| Type | No | Guest Room, Corridor, etc. |
| Notes | No | Additional information |

4. Click **Create Room**
5. If floor plan exists, click to position room pin

### Managing Team Members

1. On project detail, find **Team** section
2. Click **Add Member**
3. Select user from dropdown
4. (Optional) Enter project role
5. Click **Add**

**To remove a member:**
1. Find member in team list
2. Click remove button
3. Confirm removal

---

## Progress Tracking

### Dashboard Overview

Your Dashboard shows:
- Projects you're managing
- Overall statistics
- Recent activity
- Open issues requiring attention

### Project Progress

Monitor each project's progress via:

1. **Room Status**
   - NOT_STARTED (gray)
   - IN_PROGRESS (blue)
   - COMPLETED (green)
   - BLOCKED (red)

2. **Checklist Completion**
   - View percentage in reports
   - Track by technician

3. **Asset Status**
   - PLANNED → VERIFIED progression
   - Watch for FAULTY items

### Floor Plan Visualization

Use interactive floor plans to:
- See room status at a glance
- Click pins for details
- Identify problem areas
- Track completion patterns

---

## Issue Management

### Reviewing Issues

1. Go to **Issues** page
2. Use filters:
   - By project
   - By status
   - By priority
3. Review issue list

### Priority Assessment

| Priority | When to Use | Response |
|----------|-------------|----------|
| LOW | Minor issues | Within week |
| MEDIUM | Standard fixes | 2-3 days |
| HIGH | Functionality impacted | 24 hours |
| CRITICAL | Safety/major block | Immediate |

### Issue Workflow Management

**Starting an Issue:**
1. Open issue detail
2. Click **Start**
3. Assign to technician if needed
4. Add comments with instructions

**Reviewing Resolution:**
1. Review resolved issues
2. Check fix documentation
3. Verify with photos
4. Click **Close** if satisfied

**Reopening Issues:**
- If problem recurs, click **Reopen**
- Add comment explaining why
- Re-assign as needed

---

## Reporting

### Available Reports

| Report | Purpose | Audience |
|--------|---------|----------|
| Summary | Quick overview | Internal |
| Client | Professional presentation | Customer |
| Internal | Technical details | Team |

### Generating Reports

1. Go to **Reports** page
2. Select project
3. Choose report type tab
4. Review on-screen preview
5. Click **Export PDF**

### Report Contents

**Summary Report:**
- Project info and dates
- Overall completion %
- Room statistics
- Asset breakdown
- Issue summary
- Team list

**Client Report:**
- Executive summary
- Floor-by-floor progress
- Asset types and counts
- Clean issue summary
- Milestone tracking

**Internal Report:**
- Technician performance
- Detailed issue list
- Material usage
- Activity timeline
- Technical metrics

### Sharing Reports

1. Generate and download PDF
2. Share via email or portal
3. Store in report history
4. Track distribution

---

## Inventory Oversight

### Monitoring Stock

1. Go to **Inventory** page
2. Filter by project
3. Check for:
   - Low stock items
   - Out of stock
   - Usage patterns

### Stock Alerts

Items are flagged as low stock when:
- Less than 5 units remaining, OR
- Less than 10% of received quantity

### Material Planning

1. Review consumption rates
2. Forecast needs
3. Order replenishment
4. Track deliveries

---

## Daily PM Workflow

### Morning Review

1. **Check Dashboard**
   - New issues?
   - Blocked items?
   - Progress changes?

2. **Review Issues**
   - Any critical issues?
   - Updates needed?
   - Escalations?

3. **Check Inventory**
   - Low stock alerts?
   - Orders needed?

### During the Day

4. **Communicate with Team**
   - Assign priorities
   - Answer questions
   - Remove blockers

5. **Update Stakeholders**
   - Client communication
   - Progress reports
   - Issue updates

### End of Day

6. **Progress Review**
   - Check completions
   - Update project status
   - Plan next day

7. **Documentation**
   - Update notes
   - Generate reports if needed
   - Log important events

---

## Working with Technicians

### Assigning Work

1. Review room status
2. Identify priorities
3. Communicate assignments
4. Set expectations

### Tracking Technician Progress

Monitor via:
- Checklist completions
- Asset status changes
- Issue resolutions
- Activity feed

### Providing Support

- Answer questions quickly
- Remove blockers
- Provide resources
- Escalate when needed

---

## Client Communication

### Progress Updates

Recommended frequency:
- Weekly summary reports
- Major milestone notifications
- Issue escalations as needed

### Client Reports

Generate Client reports for:
- Scheduled updates
- Milestone reviews
- Stakeholder meetings
- Project closeout

### Managing Expectations

- Share realistic timelines
- Communicate delays early
- Document all decisions
- Get sign-offs

---

## Project Closeout

### Verification Checklist

- [ ] All rooms COMPLETED
- [ ] All assets VERIFIED
- [ ] All checklists 100%
- [ ] All issues CLOSED
- [ ] Inventory reconciled
- [ ] Documentation complete

### Final Reports

1. Generate Summary Report
2. Generate Client Report
3. Generate Asset Inventory
4. Archive all PDFs

### Handover

1. Schedule client walkthrough
2. Address final concerns
3. Collect signatures
4. Complete documentation

### Project Archive

1. Update status to COMPLETED
2. Final review
3. Request Admin to archive
4. Document lessons learned

---

## Tips for Success

### Organization

1. **Use consistent naming** - Room numbers, asset names
2. **Keep notes updated** - Document everything
3. **Regular check-ins** - Daily progress review

### Communication

1. **Be responsive** - Answer team questions quickly
2. **Document decisions** - Use issue comments
3. **Keep clients informed** - Regular updates

### Quality

1. **Review checklists** - Spot-check completions
2. **Verify photos** - Ensure quality documentation
3. **Test before verify** - Confirm before marking done

---

## Common Challenges

### Delayed Projects

1. Identify root cause
2. Reassess priorities
3. Add resources if possible
4. Communicate with stakeholders

### Team Issues

1. Document problems
2. Address directly
3. Escalate to Admin if needed
4. Adjust assignments

### Scope Changes

1. Document change requests
2. Assess impact
3. Get approval
4. Update project scope

---

*For admin tasks, contact your [Administrator](./ADMIN.md)*
*For general workflows, see [Workflows](../WORKFLOWS.md)*
