# Synax

**Project & Asset Management Platform for ICT Installations**

A comprehensive, offline-first PWA designed for field technicians to manage network, CCTV, and WiFi installations directly on-site.

---

## Features

- **Project Management** - Create and manage installation projects with team members
- **Interactive Floor Plans** - Upload and interact with floor plans using Konva.js
- **Asset Tracking** - Track equipment with QR codes and serial numbers
- **Installation Checklists** - 4 checklist types per asset (Cabling, Equipment, Config, Documentation)
- **Issue/Snag Tracking** - Report and track problems with photos and comments
- **Inventory Management** - Stock tracking with movement logs
- **Report Generation** - PDF reports (Summary, Client, Internal)
- **Digital Signatures** - Capture signatures for handovers
- **Offline Support** - Full offline functionality with background sync

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Konva.js, React Query, Zustand |
| **Backend** | Node.js, Fastify, Prisma, PostgreSQL |
| **Storage** | MinIO (S3-compatible object storage) |
| **Cache** | Redis |
| **Infrastructure** | Docker, Docker Compose |

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/i-nouchakis/synax-project-os.git
cd synax-project-os

# Install dependencies
npm install

# Start development environment
docker-compose -f docker-compose.dev.yml up -d
npm run dev
```

---

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [API Reference](./docs/API.md)
- [Features](./docs/FEATURES.md)
- [Deployment Guide](./docs/deployment/README.md)

---

## Author

**Designed & Developed by Ioannis Nouchakis**

- Website: [elecnet.gr](https://elecnet.gr)
- Email: info@elecnet.gr
- GitHub: [@i-nouchakis](https://github.com/i-nouchakis)

---

## License

Copyright (c) 2026 Ioannis Nouchakis. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

*Last Updated: February 2026*
