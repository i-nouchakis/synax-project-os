# Admin User Guide

Complete guide for system administrators using Synax.

---

## Overview

As an **Administrator**, you have full access to all Synax features including:

- User management
- System settings
- All project operations
- Report generation
- API key management

---

## Quick Reference

### What You Can Do

| Category | Actions |
|----------|---------|
| Users | Create, edit, delete, activate/deactivate |
| Projects | Full CRUD, delete projects |
| Floors | Create, edit, delete |
| Rooms | Create, edit, delete |
| Assets | Full management |
| Issues | Full management |
| Reports | All reports including Internal |
| Settings | Company info, API keys |

### Menu Access

| Menu Item | Description |
|-----------|-------------|
| Dashboard | System overview |
| Projects | All projects |
| Floors | All floors |
| Assets | Asset management |
| Checklists | All checklists |
| Issues | Issue tracking |
| Inventory | Stock management |
| Reports | Report generation |
| **Users** | User management |
| **Settings** | System settings |
| Manual | Help documentation |

---

## User Management

### Accessing User Management

1. Click **Users** in the sidebar (Admin section)
2. View list of all users
3. Search/filter as needed

### Creating a New User

1. Click **Add User** button
2. Fill in required fields:
   - **Name** - User's display name
   - **Email** - Login email (must be unique)
   - **Password** - Initial password (min 6 characters)
   - **Role** - Select appropriate role
3. Click **Create User**

### User Roles

| Role | Use For |
|------|---------|
| ADMIN | System administrators only |
| PM | Project managers |
| TECHNICIAN | Field technicians |
| CLIENT | Customer access (read-only) |

### Editing a User

1. Find user in the list
2. Click **Edit** button
3. Modify fields as needed:
   - Name
   - Email
   - Role
4. Click **Save**

### Activating/Deactivating Users

1. Find user in the list
2. Click the toggle switch
3. **Active** = Can login
4. **Inactive** = Cannot login (preserves data)

**Tip:** Deactivate instead of delete to preserve historical data.

### Deleting a User

1. Find user in the list
2. Click **Delete** button
3. Confirm deletion

**Warning:** This permanently removes the user. Their activity history (issues, comments) will show "Unknown User".

---

## System Settings

### Company Settings

1. Go to **Settings** > **Company**
2. Update company information:
   - Company Name
   - Logo (upload image)
   - Address
   - Phone
   - Email
   - Website
3. Click **Save**

### API Key Management

API keys allow external systems to access Synax data.

#### Creating an API Key

1. Go to **Settings** > **API Keys**
2. Click **Create Key**
3. Enter a descriptive name
4. Click **Create**
5. **IMPORTANT:** Copy the key immediately (shown only once)

#### Managing API Keys

- View list of all keys
- See last used date
- Delete keys that are no longer needed

#### Security Best Practices

- Create separate keys for each integration
- Delete unused keys
- Rotate keys periodically
- Never share keys in insecure channels

---

## Project Administration

### Deleting Projects

Only Admins can delete projects.

1. Open project detail page
2. Click **Delete Project**
3. Confirm deletion

**Warning:** This cascades to delete:
- All floors
- All rooms
- All assets
- All checklists
- All issues
- All inventory
- All reports

### Viewing All Projects

As Admin, you can see all projects regardless of membership.

---

## Report Management

### Accessing All Reports

1. Go to **Reports** page
2. Select any project
3. Generate any report type:
   - Summary
   - Client
   - Internal (Admin/PM only)

### Report History

1. Click **History** on Reports page
2. View all generated reports
3. Actions:
   - **View** - Open PDF
   - **Download** - Save to computer
   - **Delete** - Remove report (Admin only)

### Deleting Old Reports

1. Open Report History
2. Find report to delete
3. Click **Delete**
4. Confirm

---

## Monitoring & Oversight

### Dashboard Monitoring

The Dashboard shows real-time statistics:

| Metric | What to Watch |
|--------|---------------|
| Open Issues | Should be low |
| Checklist Completion | Should be increasing |
| Projects | Track active count |

### Reviewing Activity

1. Check Dashboard activity feed
2. Look for:
   - Stalled checklists
   - Escalating issues
   - Inactive projects

### User Activity

Monitor user engagement by:
- Checking issue creators
- Reviewing checklist completions
- Tracking login activity

---

## Troubleshooting

### Common Issues

#### User Can't Login

1. Check if user is Active
2. Verify email is correct
3. Reset password if needed
4. Check role permissions

#### Missing Data

1. Verify user has project access
2. Check role permissions
3. Review cascade deletes

#### Performance Issues

1. Check for large data sets
2. Review report generation
3. Monitor database size

### Support Escalation

For issues beyond this guide:
1. Document the problem
2. Capture screenshots
3. Note steps to reproduce
4. Contact system support

---

## Best Practices

### User Management

1. **Principle of Least Privilege** - Assign minimum necessary role
2. **Deactivate, Don't Delete** - Preserve audit trails
3. **Regular Review** - Periodically review user access
4. **Strong Passwords** - Enforce minimum requirements

### System Maintenance

1. **Regular Backups** - Ensure database backups
2. **Monitor Storage** - Watch file storage usage
3. **Update Software** - Keep system updated
4. **Review Logs** - Check for errors

### Security

1. **Rotate API Keys** - Change periodically
2. **Audit Access** - Review who has admin rights
3. **Monitor Activity** - Watch for unusual patterns
4. **Document Changes** - Track configuration changes

---

## Quick Actions Checklist

### New Project Setup
- [ ] Create project
- [ ] Add floors with plans
- [ ] Add rooms
- [ ] Add team members
- [ ] Verify access

### New User Onboarding
- [ ] Create user account
- [ ] Assign appropriate role
- [ ] Add to projects
- [ ] Verify login works
- [ ] Provide training

### Project Closure
- [ ] Verify completion
- [ ] Generate final reports
- [ ] Archive project
- [ ] Review lessons learned

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| / | Focus search |
| n | New (context-sensitive) |
| Esc | Close modal |

---

*For general workflows, see [Workflows](../WORKFLOWS.md)*
*For feature details, see [Features](../FEATURES.md)*
