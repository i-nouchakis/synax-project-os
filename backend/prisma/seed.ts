import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // ============================================
  // STEP 1: Clean existing data
  // ============================================
  console.log('🗑️  Cleaning existing data...');

  // Delete in order of dependencies (children first)
  await prisma.checklistPhoto.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.issueComment.deleteMany();
  await prisma.issuePhoto.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.assetType.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Data cleaned\n');

  // ============================================
  // STEP 2: Create Users
  // ============================================
  console.log('👤 Creating users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const pmPassword = await bcrypt.hash('pm123456', 10);
  const techPassword = await bcrypt.hash('tech123456', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@synax.app',
      passwordHash: adminPassword,
      name: 'Γιώργος Παπαδόπουλος',
      role: 'ADMIN',
    },
  });

  const pm = await prisma.user.create({
    data: {
      email: 'pm@synax.app',
      passwordHash: pmPassword,
      name: 'Μαρία Κωνσταντίνου',
      role: 'PM',
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      email: 'tech@synax.app',
      passwordHash: techPassword,
      name: 'Νίκος Αλεξίου',
      role: 'TECHNICIAN',
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      email: 'tech2@synax.app',
      passwordHash: techPassword,
      name: 'Δημήτρης Γεωργίου',
      role: 'TECHNICIAN',
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'client@hotel.gr',
      passwordHash: clientPassword,
      name: 'Αλέξανδρος Νικολάου',
      role: 'CLIENT',
    },
  });

  console.log(`✅ Created 5 users: admin, pm, 2 technicians, client\n`);

  // ============================================
  // STEP 3: Create Asset Types
  // ============================================
  console.log('📦 Creating asset types...');

  const assetTypes = await Promise.all([
    prisma.assetType.create({
      data: {
        name: 'Access Point',
        icon: 'wifi',
        checklistTemplate: {
          cabling: [
            { name: 'Καλωδίωση από patch panel', requiresPhoto: false },
            { name: 'Τερματισμός καλωδίου σε AP', requiresPhoto: true },
            { name: 'Έλεγχος PoE', requiresPhoto: false },
          ],
          equipment: [
            { name: 'Τοποθέτηση bracket στήριξης', requiresPhoto: true },
            { name: 'Μοντάρισμα AP', requiresPhoto: true },
            { name: 'Σύνδεση καλωδίου', requiresPhoto: false },
          ],
          config: [
            { name: 'Provisioning στο controller', requiresPhoto: false },
            { name: 'Ρύθμιση SSID', requiresPhoto: false },
            { name: 'Έλεγχος σήματος', requiresPhoto: true },
          ],
          documentation: [
            { name: 'Καταγραφή MAC address', requiresPhoto: false },
            { name: 'Φωτογραφία τελικής εγκατάστασης', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Network Switch',
        icon: 'network',
        checklistTemplate: {
          cabling: [
            { name: 'Uplink από core switch', requiresPhoto: false },
            { name: 'Τερματισμοί patch panel', requiresPhoto: true },
          ],
          equipment: [
            { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
            { name: 'Σύνδεση τροφοδοσίας', requiresPhoto: false },
            { name: 'Ετικέτες portων', requiresPhoto: true },
          ],
          config: [
            { name: 'Ρύθμιση VLANs', requiresPhoto: false },
            { name: 'Ρύθμιση management IP', requiresPhoto: false },
            { name: 'Έλεγχος connectivity', requiresPhoto: false },
          ],
          documentation: [
            { name: 'Port mapping document', requiresPhoto: false },
            { name: 'Φωτογραφία front/rear', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'CCTV Camera',
        icon: 'camera',
        checklistTemplate: {
          cabling: [
            { name: 'Καλωδίωση από NVR/Switch', requiresPhoto: false },
            { name: 'Τερματισμός RJ45', requiresPhoto: true },
          ],
          equipment: [
            { name: 'Τοποθέτηση βάσης κάμερας', requiresPhoto: true },
            { name: 'Μοντάρισμα κάμερας', requiresPhoto: true },
            { name: 'Ρύθμιση γωνίας λήψης', requiresPhoto: true },
          ],
          config: [
            { name: 'Προσθήκη στο NVR', requiresPhoto: false },
            { name: 'Ρύθμιση ανάλυσης/fps', requiresPhoto: false },
            { name: 'Ρύθμιση motion detection', requiresPhoto: false },
          ],
          documentation: [
            { name: 'Screenshot εικόνας κάμερας', requiresPhoto: true },
            { name: 'Καταγραφή θέσης στην κάτοψη', requiresPhoto: false },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Router',
        icon: 'router',
        checklistTemplate: {
          cabling: [
            { name: 'WAN connection', requiresPhoto: false },
            { name: 'LAN connections', requiresPhoto: false },
          ],
          equipment: [
            { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
            { name: 'Σύνδεση τροφοδοσίας', requiresPhoto: false },
          ],
          config: [
            { name: 'Ρύθμιση WAN interface', requiresPhoto: false },
            { name: 'Ρύθμιση routing', requiresPhoto: false },
            { name: 'Ρύθμιση firewall', requiresPhoto: false },
            { name: 'NAT/Port forwarding', requiresPhoto: false },
          ],
          documentation: [
            { name: 'Network diagram update', requiresPhoto: false },
            { name: 'Φωτογραφία εγκατάστασης', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Patch Panel',
        icon: 'server',
        checklistTemplate: {
          cabling: [
            { name: 'Punch down καλωδίων', requiresPhoto: true },
            { name: 'Έλεγχος τερματισμών', requiresPhoto: false },
          ],
          equipment: [
            { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
            { name: 'Ετικέτες portων', requiresPhoto: true },
          ],
          config: [],
          documentation: [
            { name: 'Port mapping document', requiresPhoto: false },
            { name: 'Φωτογραφία με ετικέτες', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'UPS',
        icon: 'battery',
        checklistTemplate: {
          cabling: [
            { name: 'Σύνδεση εισόδου ρεύματος', requiresPhoto: false },
            { name: 'Σύνδεση εξόδων σε εξοπλισμό', requiresPhoto: false },
          ],
          equipment: [
            { name: 'Τοποθέτηση UPS', requiresPhoto: true },
            { name: 'Εγκατάσταση μπαταριών', requiresPhoto: true },
          ],
          config: [
            { name: 'Ρύθμιση network card', requiresPhoto: false },
            { name: 'Ρύθμιση alerts', requiresPhoto: false },
          ],
          documentation: [
            { name: 'Test αυτονομίας', requiresPhoto: false },
            { name: 'Φωτογραφία εγκατάστασης', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'TV Display',
        icon: 'tv',
        checklistTemplate: {
          cabling: [
            { name: 'HDMI/Ethernet καλωδίωση', requiresPhoto: false },
          ],
          equipment: [
            { name: 'Τοποθέτηση βάσης', requiresPhoto: true },
            { name: 'Μοντάρισμα TV', requiresPhoto: true },
          ],
          config: [
            { name: 'Ρύθμιση IPTV', requiresPhoto: false },
            { name: 'Ρύθμιση digital signage', requiresPhoto: false },
          ],
          documentation: [
            { name: 'Φωτογραφία τελικής θέσης', requiresPhoto: true },
          ],
        },
      },
    }),
  ]);

  const apType = assetTypes.find(t => t.name === 'Access Point')!;
  const switchType = assetTypes.find(t => t.name === 'Network Switch')!;
  const cameraType = assetTypes.find(t => t.name === 'CCTV Camera')!;
  const routerType = assetTypes.find(t => t.name === 'Router')!;
  const patchPanelType = assetTypes.find(t => t.name === 'Patch Panel')!;
  const upsType = assetTypes.find(t => t.name === 'UPS')!;
  const tvType = assetTypes.find(t => t.name === 'TV Display')!;

  console.log(`✅ Created ${assetTypes.length} asset types\n`);

  // ============================================
  // STEP 4: Create Project
  // ============================================
  console.log('🏗️  Creating project...');

  const project = await prisma.project.create({
    data: {
      name: 'Hotel Alexandros - ICT Installation',
      description: 'Πλήρης εγκατάσταση ICT υποδομής για το νέο ξενοδοχείο Hotel Alexandros. Περιλαμβάνει δομημένη καλωδίωση, WiFi, CCTV, IPTV και data center.',
      clientName: 'Alexandros Hotels S.A.',
      location: 'Χαλκιδική, Ελλάδα',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-03-31'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: pm.id, role: 'PM' },
          { userId: tech1.id, role: 'TECHNICIAN' },
          { userId: tech2.id, role: 'TECHNICIAN' },
          { userId: client.id, role: 'CLIENT' },
        ],
      },
    },
  });

  console.log(`✅ Created project: ${project.name}\n`);

  // ============================================
  // STEP 5: Create Floors
  // ============================================
  console.log('🏢 Creating floors...');

  const floors = await Promise.all([
    prisma.floor.create({
      data: {
        projectId: project.id,
        name: 'Υπόγειο (Τεχνικός Χώρος)',
        level: -1,
      },
    }),
    prisma.floor.create({
      data: {
        projectId: project.id,
        name: 'Ισόγειο (Lobby & Reception)',
        level: 0,
      },
    }),
    prisma.floor.create({
      data: {
        projectId: project.id,
        name: '1ος Όροφος (Δωμάτια 101-120)',
        level: 1,
      },
    }),
    prisma.floor.create({
      data: {
        projectId: project.id,
        name: '2ος Όροφος (Δωμάτια 201-220)',
        level: 2,
      },
    }),
    prisma.floor.create({
      data: {
        projectId: project.id,
        name: '3ος Όροφος (Δωμάτια 301-320)',
        level: 3,
      },
    }),
    prisma.floor.create({
      data: {
        projectId: project.id,
        name: 'Rooftop (Bar & Pool)',
        level: 4,
      },
    }),
  ]);

  const basementFloor = floors.find(f => f.level === -1)!;
  const groundFloor = floors.find(f => f.level === 0)!;
  const floor1 = floors.find(f => f.level === 1)!;
  const floor2 = floors.find(f => f.level === 2)!;
  const floor3 = floors.find(f => f.level === 3)!;
  const rooftopFloor = floors.find(f => f.level === 4)!;

  console.log(`✅ Created ${floors.length} floors\n`);

  // ============================================
  // STEP 6: Create Rooms
  // ============================================
  console.log('🚪 Creating rooms...');

  // Basement Rooms
  const serverRoom = await prisma.room.create({
    data: {
      floorId: basementFloor.id,
      name: 'Server Room (MDF)',
      type: 'server_room',
      status: 'IN_PROGRESS',
      pinX: 200,
      pinY: 150,
    },
  });

  const idfRoom1 = await prisma.room.create({
    data: {
      floorId: basementFloor.id,
      name: 'IDF-01 (Comms Room)',
      type: 'comms_room',
      status: 'COMPLETED',
      pinX: 400,
      pinY: 150,
    },
  });

  const securityRoom = await prisma.room.create({
    data: {
      floorId: basementFloor.id,
      name: 'Security Room',
      type: 'security_room',
      status: 'IN_PROGRESS',
      pinX: 300,
      pinY: 300,
    },
  });

  // Ground Floor Rooms
  const lobby = await prisma.room.create({
    data: {
      floorId: groundFloor.id,
      name: 'Lobby',
      type: 'common_area',
      status: 'COMPLETED',
      pinX: 250,
      pinY: 200,
    },
  });

  const reception = await prisma.room.create({
    data: {
      floorId: groundFloor.id,
      name: 'Reception',
      type: 'office',
      status: 'COMPLETED',
      pinX: 400,
      pinY: 150,
    },
  });

  const restaurant = await prisma.room.create({
    data: {
      floorId: groundFloor.id,
      name: 'Restaurant',
      type: 'common_area',
      status: 'IN_PROGRESS',
      pinX: 150,
      pinY: 350,
    },
  });

  const conferenceRoom = await prisma.room.create({
    data: {
      floorId: groundFloor.id,
      name: 'Conference Room',
      type: 'meeting_room',
      status: 'NOT_STARTED',
      pinX: 450,
      pinY: 350,
    },
  });

  // Floor 1 Rooms (Hotel Rooms)
  const floor1Rooms = await Promise.all([
    prisma.room.create({
      data: { floorId: floor1.id, name: 'Room 101', type: 'guest_room', status: 'COMPLETED', pinX: 100, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor1.id, name: 'Room 102', type: 'guest_room', status: 'COMPLETED', pinX: 200, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor1.id, name: 'Room 103', type: 'guest_room', status: 'IN_PROGRESS', pinX: 300, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor1.id, name: 'Room 104', type: 'guest_room', status: 'IN_PROGRESS', pinX: 400, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor1.id, name: 'Room 105', type: 'guest_room', status: 'NOT_STARTED', pinX: 500, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor1.id, name: 'IDF-1A', type: 'comms_room', status: 'COMPLETED', pinX: 300, pinY: 250 },
    }),
    prisma.room.create({
      data: { floorId: floor1.id, name: 'Corridor 1', type: 'corridor', status: 'COMPLETED', pinX: 300, pinY: 180 },
    }),
  ]);

  // Floor 2 Rooms
  const floor2Rooms = await Promise.all([
    prisma.room.create({
      data: { floorId: floor2.id, name: 'Room 201', type: 'guest_room', status: 'COMPLETED', pinX: 100, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor2.id, name: 'Room 202', type: 'guest_room', status: 'IN_PROGRESS', pinX: 200, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor2.id, name: 'Room 203', type: 'guest_room', status: 'NOT_STARTED', pinX: 300, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor2.id, name: 'Suite 210', type: 'suite', status: 'BLOCKED', pinX: 450, pinY: 150, notes: 'Αναμονή για ηλεκτρολογικές εργασίες' },
    }),
    prisma.room.create({
      data: { floorId: floor2.id, name: 'IDF-2A', type: 'comms_room', status: 'IN_PROGRESS', pinX: 300, pinY: 250 },
    }),
  ]);

  // Floor 3 Rooms
  const floor3Rooms = await Promise.all([
    prisma.room.create({
      data: { floorId: floor3.id, name: 'Room 301', type: 'guest_room', status: 'NOT_STARTED', pinX: 100, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor3.id, name: 'Room 302', type: 'guest_room', status: 'NOT_STARTED', pinX: 200, pinY: 100 },
    }),
    prisma.room.create({
      data: { floorId: floor3.id, name: 'Presidential Suite', type: 'suite', status: 'NOT_STARTED', pinX: 400, pinY: 150 },
    }),
  ]);

  // Rooftop Rooms
  const rooftopBar = await prisma.room.create({
    data: {
      floorId: rooftopFloor.id,
      name: 'Rooftop Bar',
      type: 'common_area',
      status: 'NOT_STARTED',
      pinX: 200,
      pinY: 200,
    },
  });

  const poolArea = await prisma.room.create({
    data: {
      floorId: rooftopFloor.id,
      name: 'Pool Area',
      type: 'outdoor',
      status: 'NOT_STARTED',
      pinX: 400,
      pinY: 200,
    },
  });

  const allRooms = [
    serverRoom, idfRoom1, securityRoom,
    lobby, reception, restaurant, conferenceRoom,
    ...floor1Rooms,
    ...floor2Rooms,
    ...floor3Rooms,
    rooftopBar, poolArea
  ];

  console.log(`✅ Created ${allRooms.length} rooms\n`);

  // ============================================
  // STEP 7: Create Assets
  // ============================================
  console.log('📡 Creating assets...');

  const assets: any[] = [];

  // Server Room Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: serverRoom.id,
        assetTypeId: routerType.id,
        name: 'Core Router',
        model: 'Cisco ISR 4451',
        serialNumber: 'FJC2412L0HV',
        macAddress: '00:1A:2B:3C:4D:01',
        ipAddress: '192.168.1.1',
        status: 'CONFIGURED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-15'),
        pinX: 100,
        pinY: 100,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: serverRoom.id,
        assetTypeId: switchType.id,
        name: 'Core Switch 01',
        model: 'Cisco Catalyst 9300-48P',
        serialNumber: 'FCW2345L0AB',
        macAddress: '00:1A:2B:3C:4D:02',
        ipAddress: '192.168.1.2',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-10'),
        pinX: 100,
        pinY: 200,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: serverRoom.id,
        assetTypeId: switchType.id,
        name: 'Core Switch 02',
        model: 'Cisco Catalyst 9300-48P',
        serialNumber: 'FCW2345L0AC',
        macAddress: '00:1A:2B:3C:4D:03',
        ipAddress: '192.168.1.3',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-10'),
        pinX: 100,
        pinY: 250,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: serverRoom.id,
        assetTypeId: upsType.id,
        name: 'UPS Main',
        model: 'APC Smart-UPS 3000VA',
        serialNumber: 'AS2401234567',
        status: 'INSTALLED',
        installedById: tech2.id,
        installedAt: new Date('2025-12-08'),
        pinX: 200,
        pinY: 150,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: serverRoom.id,
        assetTypeId: patchPanelType.id,
        name: 'Patch Panel MDF-01',
        model: 'Panduit CP48BLY',
        serialNumber: 'PP-MDF-001',
        status: 'VERIFIED',
        installedById: tech2.id,
        installedAt: new Date('2025-12-05'),
        pinX: 150,
        pinY: 300,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: serverRoom.id,
        assetTypeId: patchPanelType.id,
        name: 'Patch Panel MDF-02',
        model: 'Panduit CP48BLY',
        serialNumber: 'PP-MDF-002',
        status: 'INSTALLED',
        pinX: 200,
        pinY: 300,
      },
    })
  );

  // IDF-01 Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: idfRoom1.id,
        assetTypeId: switchType.id,
        name: 'Access Switch IDF-01',
        model: 'Cisco Catalyst 9200-24P',
        serialNumber: 'FCW2456L0CD',
        macAddress: '00:1A:2B:3C:4D:10',
        ipAddress: '192.168.1.10',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-12'),
        pinX: 150,
        pinY: 100,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: idfRoom1.id,
        assetTypeId: patchPanelType.id,
        name: 'Patch Panel IDF-01',
        model: 'Panduit CP24BLY',
        serialNumber: 'PP-IDF01-001',
        status: 'VERIFIED',
        installedById: tech2.id,
        installedAt: new Date('2025-12-11'),
        pinX: 150,
        pinY: 200,
      },
    })
  );

  // Security Room Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: securityRoom.id,
        assetTypeId: switchType.id,
        name: 'NVR Switch',
        model: 'Cisco CBS350-8P',
        serialNumber: 'CBS350-SEC001',
        macAddress: '00:1A:2B:3C:4D:20',
        ipAddress: '192.168.10.1',
        status: 'CONFIGURED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-18'),
        pinX: 100,
        pinY: 100,
      },
    })
  );

  // Lobby Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: lobby.id,
        assetTypeId: apType.id,
        name: 'AP-LOBBY-01',
        model: 'Cisco Meraki MR46',
        serialNumber: 'Q2QN-XXXX-1001',
        macAddress: '00:18:0A:01:01:01',
        ipAddress: '192.168.100.101',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-20'),
        pinX: 200,
        pinY: 150,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: lobby.id,
        assetTypeId: apType.id,
        name: 'AP-LOBBY-02',
        model: 'Cisco Meraki MR46',
        serialNumber: 'Q2QN-XXXX-1002',
        macAddress: '00:18:0A:01:01:02',
        ipAddress: '192.168.100.102',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-20'),
        pinX: 350,
        pinY: 150,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: lobby.id,
        assetTypeId: cameraType.id,
        name: 'CAM-LOBBY-ENTRANCE',
        model: 'Hikvision DS-2CD2386G2',
        serialNumber: 'HKV20241201001',
        macAddress: '00:18:0A:02:01:01',
        ipAddress: '192.168.10.101',
        status: 'VERIFIED',
        installedById: tech2.id,
        installedAt: new Date('2025-12-22'),
        pinX: 100,
        pinY: 80,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: lobby.id,
        assetTypeId: cameraType.id,
        name: 'CAM-LOBBY-RECEPTION',
        model: 'Hikvision DS-2CD2386G2',
        serialNumber: 'HKV20241201002',
        macAddress: '00:18:0A:02:01:02',
        ipAddress: '192.168.10.102',
        status: 'CONFIGURED',
        installedById: tech2.id,
        installedAt: new Date('2025-12-22'),
        pinX: 350,
        pinY: 80,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: lobby.id,
        assetTypeId: tvType.id,
        name: 'TV-LOBBY-INFO',
        model: 'Samsung QM55R',
        serialNumber: 'SAM55R20240001',
        status: 'INSTALLED',
        pinX: 250,
        pinY: 300,
      },
    })
  );

  // Reception Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: reception.id,
        assetTypeId: apType.id,
        name: 'AP-RECEPTION',
        model: 'Cisco Meraki MR46',
        serialNumber: 'Q2QN-XXXX-1003',
        macAddress: '00:18:0A:01:02:01',
        ipAddress: '192.168.100.103',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2025-12-21'),
        pinX: 200,
        pinY: 100,
      },
    })
  );

  // Restaurant Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: restaurant.id,
        assetTypeId: apType.id,
        name: 'AP-REST-01',
        model: 'Cisco Meraki MR46',
        serialNumber: 'Q2QN-XXXX-1004',
        macAddress: '00:18:0A:01:03:01',
        ipAddress: '192.168.100.104',
        status: 'INSTALLED',
        installedById: tech1.id,
        installedAt: new Date('2026-01-05'),
        pinX: 150,
        pinY: 200,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: restaurant.id,
        assetTypeId: apType.id,
        name: 'AP-REST-02',
        model: 'Cisco Meraki MR46',
        serialNumber: 'Q2QN-XXXX-1005',
        macAddress: '00:18:0A:01:03:02',
        status: 'PLANNED',
        pinX: 350,
        pinY: 200,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: restaurant.id,
        assetTypeId: cameraType.id,
        name: 'CAM-REST-01',
        model: 'Hikvision DS-2CD2386G2',
        serialNumber: 'HKV20241201003',
        status: 'IN_STOCK',
        pinX: 100,
        pinY: 100,
      },
    })
  );

  // Conference Room Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: conferenceRoom.id,
        assetTypeId: apType.id,
        name: 'AP-CONF',
        model: 'Cisco Meraki MR46',
        serialNumber: 'Q2QN-XXXX-1006',
        status: 'PLANNED',
        pinX: 200,
        pinY: 150,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: conferenceRoom.id,
        assetTypeId: tvType.id,
        name: 'TV-CONF-MAIN',
        model: 'Samsung QM85R',
        status: 'PLANNED',
        pinX: 200,
        pinY: 50,
      },
    })
  );

  // Floor 1 Room Assets (example rooms)
  const room101 = floor1Rooms[0];
  const room103 = floor1Rooms[2];
  const idf1a = floor1Rooms[5];
  const corridor1 = floor1Rooms[6];

  assets.push(
    await prisma.asset.create({
      data: {
        roomId: room101.id,
        assetTypeId: apType.id,
        name: 'AP-101',
        model: 'Cisco Meraki MR36',
        serialNumber: 'Q2QN-XXXX-2101',
        macAddress: '00:18:0A:01:10:01',
        ipAddress: '192.168.101.101',
        status: 'VERIFIED',
        installedById: tech2.id,
        installedAt: new Date('2026-01-10'),
        pinX: 150,
        pinY: 100,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: room101.id,
        assetTypeId: tvType.id,
        name: 'TV-101',
        model: 'LG 55UN73006LA',
        serialNumber: 'LG55UN2024001',
        status: 'VERIFIED',
        installedById: tech2.id,
        installedAt: new Date('2026-01-12'),
        pinX: 100,
        pinY: 200,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: room103.id,
        assetTypeId: apType.id,
        name: 'AP-103',
        model: 'Cisco Meraki MR36',
        serialNumber: 'Q2QN-XXXX-2103',
        macAddress: '00:18:0A:01:10:03',
        status: 'INSTALLED',
        installedById: tech2.id,
        installedAt: new Date('2026-01-20'),
        pinX: 150,
        pinY: 100,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: idf1a.id,
        assetTypeId: switchType.id,
        name: 'Access Switch 1A',
        model: 'Cisco Catalyst 9200-24P',
        serialNumber: 'FCW2456L0EF',
        macAddress: '00:1A:2B:3C:4D:1A',
        ipAddress: '192.168.1.11',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2026-01-08'),
        pinX: 100,
        pinY: 100,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: corridor1.id,
        assetTypeId: apType.id,
        name: 'AP-CORR-1',
        model: 'Cisco Meraki MR36',
        serialNumber: 'Q2QN-XXXX-2199',
        macAddress: '00:18:0A:01:10:99',
        ipAddress: '192.168.101.199',
        status: 'VERIFIED',
        installedById: tech1.id,
        installedAt: new Date('2026-01-15'),
        pinX: 200,
        pinY: 100,
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: corridor1.id,
        assetTypeId: cameraType.id,
        name: 'CAM-CORR-1',
        model: 'Hikvision DS-2CD2386G2',
        serialNumber: 'HKV20241201010',
        macAddress: '00:18:0A:02:10:01',
        ipAddress: '192.168.10.110',
        status: 'VERIFIED',
        installedById: tech2.id,
        installedAt: new Date('2026-01-16'),
        pinX: 350,
        pinY: 100,
      },
    })
  );

  console.log(`✅ Created ${assets.length} assets\n`);

  // ============================================
  // STEP 8: Create Checklists with Items
  // ============================================
  console.log('📋 Creating checklists...');

  let checklistCount = 0;
  let itemCount = 0;

  // Create checklists for completed/verified assets
  for (const asset of assets) {
    const assetData = asset as any;

    // Create all 4 checklist types for each asset
    const checklistTypes: ('CABLING' | 'EQUIPMENT' | 'CONFIG' | 'DOCUMENTATION')[] =
      ['CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION'];

    for (const type of checklistTypes) {
      const isCompleted = ['VERIFIED', 'CONFIGURED'].includes(assetData.status);
      const isInProgress = ['INSTALLED'].includes(assetData.status);

      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (isCompleted) status = 'COMPLETED';
      else if (isInProgress && (type === 'CABLING' || type === 'EQUIPMENT')) status = 'COMPLETED';
      else if (isInProgress && type === 'CONFIG') status = 'IN_PROGRESS';

      const checklist = await prisma.checklist.create({
        data: {
          assetId: assetData.id,
          type,
          status,
          assignedToId: assetData.installedById || tech1.id,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
      });
      checklistCount++;

      // Create checklist items based on type
      const items = getChecklistItems(type);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const completed = status === 'COMPLETED' || (status === 'IN_PROGRESS' && i < items.length / 2);

        await prisma.checklistItem.create({
          data: {
            checklistId: checklist.id,
            name: item.name,
            description: item.description,
            isRequired: item.isRequired ?? true,
            requiresPhoto: item.requiresPhoto ?? false,
            completed,
            completedById: completed ? (assetData.installedById || tech1.id) : null,
            completedAt: completed ? new Date() : null,
            order: i,
          },
        });
        itemCount++;
      }
    }
  }

  console.log(`✅ Created ${checklistCount} checklists with ${itemCount} items\n`);

  // ============================================
  // STEP 9: Create Issues
  // ============================================
  console.log('⚠️  Creating issues...');

  const issues = await Promise.all([
    // Critical - Open
    prisma.issue.create({
      data: {
        projectId: project.id,
        roomId: serverRoom.id,
        title: 'Κλιματιστικό Server Room εκτός λειτουργίας',
        description: 'Το κλιματιστικό του server room δεν λειτουργεί σωστά. Η θερμοκρασία φτάνει τους 30°C. Χρειάζεται άμεση επέμβαση από HVAC συνεργείο.',
        causedBy: 'CoolAir HVAC Services',
        priority: 'CRITICAL',
        status: 'OPEN',
        createdById: tech1.id,
      },
    }),
    // Critical - In Progress
    prisma.issue.create({
      data: {
        projectId: project.id,
        roomId: floor2Rooms[3].id, // Suite 210
        title: 'Ελλιπής ηλεκτρολογική εγκατάσταση Suite 210',
        description: 'Δεν έχουν τοποθετηθεί οι ηλεκτρολογικές παροχές για τα data points. Δεν μπορούμε να προχωρήσουμε με την καλωδίωση.',
        causedBy: 'Electra Electric Co.',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        createdById: pm.id,
      },
    }),
    // High - Open
    prisma.issue.create({
      data: {
        projectId: project.id,
        roomId: restaurant.id,
        title: 'Καθυστέρηση ψευδοροφής εστιατορίου',
        description: 'Ο εργολάβος δεν έχει ολοκληρώσει την ψευδοροφή στο εστιατόριο. Αδυνατούμε να τοποθετήσουμε τα APs και τις κάμερες.',
        causedBy: 'BuildRight Construction',
        priority: 'HIGH',
        status: 'OPEN',
        createdById: tech2.id,
      },
    }),
    // High - Resolved
    prisma.issue.create({
      data: {
        projectId: project.id,
        roomId: lobby.id,
        title: 'Λάθος mounting brackets για Lobby APs',
        description: 'Παραλάβαμε wall-mount brackets αντί για ceiling-mount για τα APs του lobby.',
        causedBy: 'NetEquip Supplies',
        priority: 'HIGH',
        status: 'RESOLVED',
        createdById: tech1.id,
        resolvedAt: new Date('2026-01-15'),
      },
    }),
    // Medium - Open
    prisma.issue.create({
      data: {
        projectId: project.id,
        roomId: conferenceRoom.id,
        title: 'Αναμονή για τελικές διαστάσεις Conference Room',
        description: 'Ο αρχιτέκτονας δεν έχει οριστικοποιήσει τη διάταξη του conference room. Δεν μπορούμε να σχεδιάσουμε την τελική θέση του εξοπλισμού.',
        causedBy: 'Architekton Design',
        priority: 'MEDIUM',
        status: 'OPEN',
        createdById: pm.id,
      },
    }),
    // Medium - Closed
    prisma.issue.create({
      data: {
        projectId: project.id,
        title: 'Ενημέρωση κατόψεων με νέες θέσεις',
        description: 'Χρειαζόμαστε ενημερωμένες κατόψεις με τις σωστές διαστάσεις των δωματίων.',
        causedBy: 'Architekton Design',
        priority: 'MEDIUM',
        status: 'CLOSED',
        createdById: admin.id,
        resolvedAt: new Date('2025-12-20'),
      },
    }),
    // Low - Open
    prisma.issue.create({
      data: {
        projectId: project.id,
        roomId: rooftopBar.id,
        title: 'Καθυστέρηση παράδοσης outdoor APs',
        description: 'Τα outdoor APs για το rooftop έχουν καθυστέρηση παράδοσης 2 εβδομάδες.',
        causedBy: 'Cisco Hellas',
        priority: 'LOW',
        status: 'OPEN',
        createdById: pm.id,
      },
    }),
    // Low - Closed
    prisma.issue.create({
      data: {
        projectId: project.id,
        title: 'Documentation template update',
        description: 'Χρειαζόμαστε νέο template για τα as-built σχέδια.',
        priority: 'LOW',
        status: 'CLOSED',
        createdById: admin.id,
        resolvedAt: new Date('2025-12-01'),
      },
    }),
  ]);

  console.log(`✅ Created ${issues.length} issues\n`);

  // ============================================
  // STEP 10: Create Issue Comments
  // ============================================
  console.log('💬 Creating issue comments...');

  await prisma.issueComment.createMany({
    data: [
      // Issue 1 - HVAC
      { issueId: issues[0].id, userId: pm.id, comment: 'Επικοινώνησα με το HVAC συνεργείο. Θα έρθουν αύριο πρωί.' },
      { issueId: issues[0].id, userId: tech1.id, comment: 'Έχω βάλει προσωρινό portable AC για να κρατήσω τη θερμοκρασία.' },
      { issueId: issues[0].id, userId: pm.id, comment: 'Καλά έκανες. Ενημέρωσέ με για την κατάσταση.' },
      // Issue 2 - Electrical
      { issueId: issues[1].id, userId: tech2.id, comment: 'Μίλησα με τον ηλεκτρολόγο. Λέει ότι θα τελειώσει μέχρι Παρασκευή.' },
      { issueId: issues[1].id, userId: pm.id, comment: 'Εντάξει, θα επανέλθουμε τη Δευτέρα για να συνεχίσουμε.' },
      // Issue 3 - Ceiling
      { issueId: issues[2].id, userId: pm.id, comment: 'Πίεσα τον εργολάβο. Υπόσχεται ολοκλήρωση σε 1 εβδομάδα.' },
      // Issue 4 - Brackets (Resolved)
      { issueId: issues[3].id, userId: tech1.id, comment: 'Παραλάβαμε τα σωστά brackets. Μπορούμε να συνεχίσουμε.' },
      { issueId: issues[3].id, userId: pm.id, comment: 'Τέλεια! Κλείνω το issue.' },
    ],
  });

  console.log(`✅ Created issue comments\n`);

  // ============================================
  // STEP 11: Create Inventory Items & Logs
  // ============================================
  console.log('📦 Creating inventory...');

  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Cable - Cat6 UTP',
        description: 'Cat6 UTP Cable 305m Box - Blue',
        unit: 'box',
        quantityReceived: 15,
        quantityUsed: 9,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Cable - Cat6 UTP',
        description: 'Cat6 UTP Cable 305m Box - Grey',
        unit: 'box',
        quantityReceived: 10,
        quantityUsed: 6,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'RJ45 Connectors',
        description: 'Cat6 RJ45 Connectors (100pcs)',
        unit: 'bag',
        quantityReceived: 30,
        quantityUsed: 22,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Patch Panel 24-port',
        description: 'Panduit Cat6 24-port Patch Panel 1U',
        unit: 'pcs',
        quantityReceived: 8,
        quantityUsed: 5,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Patch Panel 48-port',
        description: 'Panduit Cat6 48-port Patch Panel 2U',
        unit: 'pcs',
        quantityReceived: 4,
        quantityUsed: 2,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Patch Cord 1m',
        description: 'Cat6 Patch Cord 1m Blue',
        unit: 'pcs',
        quantityReceived: 200,
        quantityUsed: 87,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Patch Cord 2m',
        description: 'Cat6 Patch Cord 2m Blue',
        unit: 'pcs',
        quantityReceived: 100,
        quantityUsed: 45,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Cable Ties',
        description: 'Velcro Cable Ties 200mm (100pcs)',
        unit: 'pack',
        quantityReceived: 20,
        quantityUsed: 14,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Access Point',
        description: 'Cisco Meraki MR46',
        unit: 'pcs',
        quantityReceived: 25,
        quantityUsed: 12,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Access Point',
        description: 'Cisco Meraki MR36',
        unit: 'pcs',
        quantityReceived: 30,
        quantityUsed: 8,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'CCTV Camera',
        description: 'Hikvision DS-2CD2386G2-IU',
        unit: 'pcs',
        quantityReceived: 20,
        quantityUsed: 6,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Network Switch',
        description: 'Cisco Catalyst 9200-24P',
        unit: 'pcs',
        quantityReceived: 6,
        quantityUsed: 3,
      },
    }),
  ]);

  // Create inventory logs
  for (const item of inventoryItems) {
    // Initial received log
    await prisma.inventoryLog.create({
      data: {
        itemId: item.id,
        action: 'RECEIVED',
        quantity: item.quantityReceived,
        notes: 'Αρχική παραλαβή υλικών',
        userId: pm.id,
      },
    });

    // Consumed logs (split into multiple for realism)
    if (item.quantityUsed > 0) {
      const firstUse = Math.ceil(item.quantityUsed * 0.6);
      const secondUse = item.quantityUsed - firstUse;

      await prisma.inventoryLog.create({
        data: {
          itemId: item.id,
          action: 'CONSUMED',
          quantity: firstUse,
          notes: 'Χρήση για εγκαταστάσεις ισογείου & υπογείου',
          userId: tech1.id,
        },
      });

      if (secondUse > 0) {
        await prisma.inventoryLog.create({
          data: {
            itemId: item.id,
            action: 'CONSUMED',
            quantity: secondUse,
            notes: 'Χρήση για εγκαταστάσεις ορόφων 1-2',
            userId: tech2.id,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${inventoryItems.length} inventory items with logs\n`);

  // ============================================
  // STEP 12: Create Time Entries
  // ============================================
  console.log('⏱️  Creating time entries...');

  const timeEntries = await Promise.all([
    // Tech 1 entries
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech1.id,
        roomId: serverRoom.id,
        type: 'INSTALLATION',
        description: 'Εγκατάσταση core switches & router',
        date: new Date('2025-12-10'),
        hours: 8,
        notes: 'Ολοκληρώθηκε η εγκατάσταση του core networking equipment',
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech1.id,
        roomId: serverRoom.id,
        type: 'CONFIGURATION',
        description: 'Παραμετροποίηση VLANs & routing',
        date: new Date('2025-12-11'),
        hours: 6,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech1.id,
        roomId: lobby.id,
        type: 'INSTALLATION',
        description: 'Εγκατάσταση APs Lobby',
        date: new Date('2025-12-20'),
        hours: 4,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech1.id,
        type: 'TESTING',
        description: 'WiFi coverage testing ισογείου',
        date: new Date('2025-12-21'),
        hours: 3,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech1.id,
        type: 'TRAVEL',
        description: 'Μετάβαση στο εργοτάξιο',
        date: new Date('2026-01-08'),
        hours: 1.5,
      },
    }),
    // Tech 2 entries
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech2.id,
        roomId: securityRoom.id,
        type: 'INSTALLATION',
        description: 'Εγκατάσταση CCTV υποδομής',
        date: new Date('2025-12-18'),
        hours: 6,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech2.id,
        roomId: lobby.id,
        type: 'INSTALLATION',
        description: 'Εγκατάσταση καμερών Lobby',
        date: new Date('2025-12-22'),
        hours: 5,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech2.id,
        roomId: room101.id,
        type: 'INSTALLATION',
        description: 'Εγκατάσταση equipment Room 101',
        date: new Date('2026-01-10'),
        hours: 3,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: tech2.id,
        type: 'TROUBLESHOOTING',
        description: 'Debugging network connectivity issues',
        date: new Date('2026-01-12'),
        hours: 2,
      },
    }),
    // PM entries
    prisma.timeEntry.create({
      data: {
        projectId: project.id,
        userId: pm.id,
        type: 'MEETING',
        description: 'Weekly progress meeting με πελάτη',
        date: new Date('2026-01-15'),
        hours: 2,
      },
    }),
  ]);

  console.log(`✅ Created ${timeEntries.length} time entries\n`);

  // ============================================
  // STEP 13: Create Signatures
  // ============================================
  console.log('✍️  Creating signatures...');

  const signatures = await Promise.all([
    prisma.signature.create({
      data: {
        projectId: project.id,
        roomId: lobby.id,
        type: 'ROOM_HANDOVER',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedByName: 'Αλέξανδρος Νικολάου',
        signedById: client.id,
        signedAt: new Date('2026-01-20'),
      },
    }),
    prisma.signature.create({
      data: {
        projectId: project.id,
        roomId: reception.id,
        type: 'ROOM_HANDOVER',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedByName: 'Αλέξανδρος Νικολάου',
        signedById: client.id,
        signedAt: new Date('2026-01-20'),
      },
    }),
    prisma.signature.create({
      data: {
        projectId: project.id,
        type: 'STAGE_COMPLETION',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedByName: 'Μαρία Κωνσταντίνου',
        signedById: pm.id,
        signedAt: new Date('2026-01-15'),
      },
    }),
  ]);

  console.log(`✅ Created ${signatures.length} signatures\n`);

  // ============================================
  // Summary
  // ============================================
  console.log('═══════════════════════════════════════════');
  console.log('🎉 DATABASE SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log(`   👤 Users: 5 (admin, pm, 2 technicians, client)`);
  console.log(`   📦 Asset Types: ${assetTypes.length}`);
  console.log(`   🏗️  Projects: 1`);
  console.log(`   🏢 Floors: ${floors.length}`);
  console.log(`   🚪 Rooms: ${allRooms.length}`);
  console.log(`   📡 Assets: ${assets.length}`);
  console.log(`   📋 Checklists: ${checklistCount}`);
  console.log(`   ✅ Checklist Items: ${itemCount}`);
  console.log(`   ⚠️  Issues: ${issues.length}`);
  console.log(`   📦 Inventory Items: ${inventoryItems.length}`);
  console.log(`   ⏱️  Time Entries: ${timeEntries.length}`);
  console.log(`   ✍️  Signatures: ${signatures.length}`);
  console.log('');
  console.log('📧 Test Accounts:');
  console.log('   Admin:      admin@synax.app / admin123');
  console.log('   PM:         pm@synax.app / pm123456');
  console.log('   Technician: tech@synax.app / tech123456');
  console.log('   Technician: tech2@synax.app / tech123456');
  console.log('   Client:     client@hotel.gr / client123');
  console.log('');
}

// Helper function to get checklist items
function getChecklistItems(type: string): { name: string; description?: string; isRequired?: boolean; requiresPhoto?: boolean }[] {
  switch (type) {
    case 'CABLING':
      return [
        { name: 'Καλωδίωση σημείου', requiresPhoto: false },
        { name: 'Τερματισμός καλωδίου', requiresPhoto: true },
        { name: 'Fluke test', requiresPhoto: true },
        { name: 'Ετικέτα καλωδίου', requiresPhoto: true },
      ];
    case 'EQUIPMENT':
      return [
        { name: 'Τοποθέτηση εξοπλισμού', requiresPhoto: true },
        { name: 'Σύνδεση τροφοδοσίας', requiresPhoto: false },
        { name: 'Σύνδεση δικτύου', requiresPhoto: false },
        { name: 'Ετικέτα εξοπλισμού', requiresPhoto: true },
      ];
    case 'CONFIG':
      return [
        { name: 'IP configuration', requiresPhoto: false },
        { name: 'Management setup', requiresPhoto: false },
        { name: 'Connectivity test', requiresPhoto: false },
        { name: 'Functional test', requiresPhoto: false },
      ];
    case 'DOCUMENTATION':
      return [
        { name: 'Καταγραφή Serial/MAC', requiresPhoto: false },
        { name: 'Φωτογραφία εγκατάστασης', requiresPhoto: true },
        { name: 'Update documentation', requiresPhoto: false },
      ];
    default:
      return [];
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
