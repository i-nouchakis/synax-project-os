# Synax API Reference

**Base URL:** `http://localhost:3002/api`

**Authentication:** Bearer token in `Authorization` header

```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@synax.app",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@synax.app",
    "name": "Admin User",
    "role": "ADMIN",
    "avatar": null,
    "isActive": true
  }
}
```

**Errors:**
- `400` - Invalid email or password format
- `401` - Invalid credentials

---

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "new@user.com",
  "password": "password123",
  "name": "New User"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "new@user.com",
    "name": "New User",
    "role": "TECHNICIAN"
  }
}
```

**Note:** New users default to TECHNICIAN role.

---

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@synax.app",
    "name": "Admin User",
    "role": "ADMIN",
    "avatar": null,
    "isActive": true
  }
}
```

---

## Users (Admin Only)

### List Users
```http
GET /api/users
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "admin@synax.app",
      "name": "Admin User",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

### Create User
```http
POST /api/users
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "TECHNICIAN"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "TECHNICIAN"
  }
}
```

---

### Get User
```http
GET /api/users/:id
Authorization: Bearer <token>
```

---

### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "PM",
  "isActive": true
}
```

---

### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

## Projects

### List Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status |
| search | string | Search by name/client |

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Hotel Santorini",
      "clientName": "Acme Hotels",
      "status": "IN_PROGRESS",
      "location": "Santorini, Greece",
      "startDate": "2026-01-15",
      "endDate": "2026-03-15",
      "_count": {
        "floors": 5,
        "members": 3
      }
    }
  ]
}
```

**Access Control:**
- ADMIN/PM see all projects
- TECHNICIAN/CLIENT see only assigned projects

---

### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "clientName": "Client Name",
  "location": "Address",
  "startDate": "2026-02-01",
  "endDate": "2026-04-01"
}
```

---

### Get Project
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "project": {
    "id": "uuid",
    "name": "Hotel Santorini",
    "description": "Full ICT installation",
    "clientName": "Acme Hotels",
    "status": "IN_PROGRESS",
    "floors": [
      {
        "id": "uuid",
        "name": "Ground Floor",
        "level": 0,
        "_count": { "rooms": 15 }
      }
    ],
    "members": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "name": "John PM",
          "email": "john@example.com",
          "role": "PM"
        },
        "joinedAt": "2026-01-15T10:00:00Z"
      }
    ],
    "_count": {
      "floors": 5,
      "issues": 3
    }
  }
}
```

---

### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

---

### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

**Required Role:** ADMIN

**Warning:** Cascades to delete all floors, rooms, assets, etc.

---

### Add Project Member
```http
POST /api/projects/:id/members
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

**Request Body:**
```json
{
  "userId": "user-uuid",
  "role": "Technician"
}
```

---

### Remove Project Member
```http
DELETE /api/projects/:id/members/:userId
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

---

## Floors

### List All Floors
```http
GET /api/floors
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "floors": [
    {
      "id": "uuid",
      "name": "Ground Floor",
      "level": 0,
      "floorplanUrl": "https://minio.../floor.png",
      "project": {
        "id": "uuid",
        "name": "Hotel Santorini"
      },
      "_count": {
        "rooms": 15
      }
    }
  ]
}
```

---

### Get Floor
```http
GET /api/floors/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "floor": {
    "id": "uuid",
    "name": "Ground Floor",
    "level": 0,
    "floorplanUrl": "https://...",
    "project": {
      "id": "uuid",
      "name": "Hotel Santorini"
    },
    "rooms": [
      {
        "id": "uuid",
        "name": "Room 101",
        "type": "Guest Room",
        "status": "IN_PROGRESS",
        "pinX": 150,
        "pinY": 200,
        "_count": {
          "assets": 5,
          "issues": 1
        }
      }
    ]
  }
}
```

---

### Create Floor
```http
POST /api/floors
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "name": "First Floor",
  "level": 1
}
```

---

### Update Floor
```http
PUT /api/floors/:id
Authorization: Bearer <token>
```

---

### Delete Floor
```http
DELETE /api/floors/:id
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

---

### List Rooms in Floor
```http
GET /api/floors/:id/rooms
Authorization: Bearer <token>
```

---

### Create Room in Floor
```http
POST /api/floors/:id/rooms
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Room 101",
  "type": "Guest Room",
  "pinX": 150,
  "pinY": 200,
  "notes": "Corner room"
}
```

---

### Update Room
```http
PUT /api/floors/:floorId/rooms/:roomId
Authorization: Bearer <token>
```

---

### Delete Room
```http
DELETE /api/floors/:floorId/rooms/:roomId
Authorization: Bearer <token>
```

---

## Rooms

### Get Room
```http
GET /api/rooms/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "room": {
    "id": "uuid",
    "name": "Room 101",
    "type": "Guest Room",
    "status": "IN_PROGRESS",
    "floorplanUrl": "https://...",
    "floor": {
      "id": "uuid",
      "name": "Ground Floor",
      "project": {
        "id": "uuid",
        "name": "Hotel Santorini"
      }
    },
    "assets": [
      {
        "id": "uuid",
        "name": "AP-101",
        "status": "INSTALLED",
        "pinX": 100,
        "pinY": 150,
        "assetType": {
          "name": "Access Point"
        }
      }
    ],
    "_count": {
      "assets": 5,
      "issues": 1
    }
  }
}
```

---

### Update Room
```http
PUT /api/rooms/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Room 101 - VIP",
  "status": "COMPLETED",
  "notes": "Updated notes"
}
```

---

## Assets

### List Assets
```http
GET /api/assets
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| projectId | string | Filter by project |
| roomId | string | Filter by room |
| status | string | Filter by status |
| search | string | Search name/serial/MAC |
| typeId | string | Filter by asset type |

---

### Get Asset Types
```http
GET /api/assets/types
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "types": [
    {
      "id": "uuid",
      "name": "Access Point",
      "icon": "wifi",
      "_count": { "assets": 25 }
    }
  ]
}
```

---

### Get Asset
```http
GET /api/assets/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "asset": {
    "id": "uuid",
    "name": "AP-101",
    "model": "Ubiquiti UAP-AC-Pro",
    "serialNumber": "SN12345",
    "macAddress": "00:11:22:33:44:55",
    "ipAddress": "192.168.1.101",
    "status": "CONFIGURED",
    "pinX": 100,
    "pinY": 150,
    "assetType": {
      "id": "uuid",
      "name": "Access Point"
    },
    "room": {
      "id": "uuid",
      "name": "Room 101"
    },
    "checklists": [
      {
        "id": "uuid",
        "type": "CABLING",
        "status": "COMPLETED"
      }
    ],
    "installedBy": {
      "name": "Tech User"
    },
    "installedAt": "2026-01-20T14:30:00Z"
  }
}
```

---

### Create Asset
```http
POST /api/assets/rooms/:roomId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "AP-102",
  "assetTypeId": "type-uuid",
  "model": "Ubiquiti UAP-AC-Pro",
  "serialNumber": "SN12346",
  "macAddress": "00:11:22:33:44:56"
}
```

---

### Update Asset
```http
PUT /api/assets/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "VERIFIED",
  "ipAddress": "192.168.1.102"
}
```

---

### Update Asset Position
```http
PUT /api/assets/:id/position
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "pinX": 200,
  "pinY": 300
}
```

---

### Delete Asset
```http
DELETE /api/assets/:id
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

---

## Checklists

### List All Checklists
```http
GET /api/checklists
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| projectId | string | Filter by project |
| status | string | Filter by status |
| type | string | Filter by type |

---

### Get Checklists for Asset
```http
GET /api/checklists/asset/:assetId
Authorization: Bearer <token>
```

---

### Get Checklist Detail
```http
GET /api/checklists/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "checklist": {
    "id": "uuid",
    "type": "CABLING",
    "status": "IN_PROGRESS",
    "assignedTo": {
      "id": "uuid",
      "name": "Tech User"
    },
    "items": [
      {
        "id": "uuid",
        "name": "Cable routed correctly",
        "description": "Verify cable path",
        "isRequired": true,
        "requiresPhoto": true,
        "completed": true,
        "completedBy": {
          "name": "Tech User"
        },
        "completedAt": "2026-01-20T14:30:00Z",
        "photos": [
          {
            "id": "uuid",
            "photoUrl": "https://...",
            "caption": "Cable routing"
          }
        ]
      }
    ]
  }
}
```

---

### Generate All Checklists
```http
POST /api/checklists/asset/:assetId/generate-all
Authorization: Bearer <token>
```

Creates all 4 checklist types (CABLING, EQUIPMENT, CONFIG, DOCUMENTATION) for an asset.

---

### Toggle Checklist Item
```http
PUT /api/checklists/items/:itemId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "completed": true
}
```

---

### Add Photo to Item
```http
POST /api/checklists/items/:itemId/photos
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Image file
- `caption`: Optional caption

---

### Delete Photo
```http
DELETE /api/checklists/photos/:photoId
Authorization: Bearer <token>
```

---

## Issues

### List Issues
```http
GET /api/issues
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| projectId | string | Filter by project |
| roomId | string | Filter by room |
| status | string | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| priority | string | LOW, MEDIUM, HIGH, CRITICAL |

---

### Get Issue
```http
GET /api/issues/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "issue": {
    "id": "uuid",
    "title": "Cable damage",
    "description": "Cable damaged during construction",
    "causedBy": "Construction crew",
    "priority": "HIGH",
    "status": "OPEN",
    "createdBy": {
      "name": "Tech User"
    },
    "room": {
      "id": "uuid",
      "name": "Room 101"
    },
    "photos": [
      {
        "id": "uuid",
        "photoUrl": "https://...",
        "caption": "Damage photo"
      }
    ],
    "comments": [
      {
        "id": "uuid",
        "comment": "Need replacement cable",
        "user": {
          "name": "PM User"
        },
        "createdAt": "2026-01-20T15:00:00Z"
      }
    ],
    "createdAt": "2026-01-20T14:00:00Z"
  }
}
```

---

### Create Issue
```http
POST /api/issues
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "roomId": "room-uuid",
  "title": "Issue title",
  "description": "Issue description",
  "causedBy": "Third party",
  "priority": "HIGH"
}
```

---

### Update Issue
```http
PUT /api/issues/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "CRITICAL"
}
```

**Note:** Setting status to RESOLVED automatically sets `resolvedAt`.

---

### Add Comment
```http
POST /api/issues/:id/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comment": "Comment text"
}
```

---

### Delete Comment
```http
DELETE /api/issues/comments/:commentId
Authorization: Bearer <token>
```

---

### Add Issue Photo
```http
POST /api/issues/:id/photos
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Delete Issue Photo
```http
DELETE /api/issues/photos/:photoId
Authorization: Bearer <token>
```

---

## Inventory

### List Inventory
```http
GET /api/inventory
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| projectId | string | Filter by project |
| lowStock | boolean | Only low stock items |

---

### Get Inventory Stats
```http
GET /api/inventory/stats/summary
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "stats": {
    "totalItems": 25,
    "inStock": 20,
    "lowStock": 3,
    "outOfStock": 2
  }
}
```

---

### Get Inventory Item
```http
GET /api/inventory/:id
Authorization: Bearer <token>
```

---

### Create Inventory Item
```http
POST /api/inventory
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "itemType": "CAT6 Cable",
  "description": "Category 6 UTP Cable",
  "unit": "m"
}
```

---

### Update Inventory Item
```http
PUT /api/inventory/:id
Authorization: Bearer <token>
```

---

### Delete Inventory Item
```http
DELETE /api/inventory/:id
Authorization: Bearer <token>
```

---

### Add Stock Movement
```http
POST /api/inventory/:id/logs
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "action": "RECEIVED",
  "quantity": 100,
  "serialNumbers": ["SN001", "SN002"],
  "notes": "Received from supplier"
}
```

**Actions:**
- `RECEIVED` - Add to stock
- `CONSUMED` - Remove from stock
- `RETURNED` - Return to stock
- `ADJUSTED` - Manual adjustment

---

### Get Item Logs
```http
GET /api/inventory/:id/logs
Authorization: Bearer <token>
```

---

## Reports

### Get Project Summary
```http
GET /api/reports/project/:projectId/summary
Authorization: Bearer <token>
```

---

### Get Internal Report
```http
GET /api/reports/project/:projectId/internal
Authorization: Bearer <token>
```

**Required Role:** ADMIN, PM

---

### Get Client Report
```http
GET /api/reports/project/:projectId/client
Authorization: Bearer <token>
```

---

### Export PDF
```http
POST /api/reports/project/:projectId/export/:type
Authorization: Bearer <token>
```

**Types:** `summary`, `client`, `internal`

**Response (200):**
```json
{
  "report": {
    "id": "uuid",
    "type": "CLIENT",
    "title": "Hotel Santorini - Client Report",
    "fileUrl": "https://minio.../report.pdf",
    "createdAt": "2026-01-30T10:00:00Z"
  }
}
```

---

### Get Report History
```http
GET /api/reports/project/:projectId/history
Authorization: Bearer <token>
```

---

### Delete Report
```http
DELETE /api/reports/generated/:reportId
Authorization: Bearer <token>
```

**Required Role:** ADMIN

---

## Dashboard

### Get Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "stats": {
    "projects": 7,
    "floors": 27,
    "rooms": 173,
    "assets": 78,
    "openIssues": 5,
    "checklistCompletion": 74
  }
}
```

---

### Get Activity
```http
GET /api/dashboard/activity
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "activities": [
    {
      "type": "ISSUE",
      "action": "created",
      "title": "Cable damage in Room 101",
      "project": "Hotel Santorini",
      "timestamp": "2026-01-30T10:00:00Z"
    }
  ]
}
```

---

## Upload

### Upload File
```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload

**Response (200):**
```json
{
  "url": "https://minio.../image.jpg"
}
```

---

### Upload Floor Plan
```http
POST /api/upload/floorplan/:floorId
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Upload Room Floor Plan
```http
POST /api/upload/room-floorplan/:roomId
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 2,
      "path": ["name"],
      "message": "String must contain at least 2 character(s)"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "error": "Forbidden"
}
```

### Not Found (404)
```json
{
  "error": "Project not found"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error"
}
```

---

*For database schema, see [DATABASE.md](./DATABASE.md)*
*For feature details, see [FEATURES.md](./FEATURES.md)*
