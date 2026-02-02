import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// OOKEA RESORT - INSTALLATION PLAN SEED
// Based on "OOKEA 231120 Installation Plan.xlsx"
// ============================================

async function main() {
  console.log('🏝️  Starting OOKEA Resort database seed...\n');

  // ============================================
  // STEP 1: Clean existing data
  // ============================================
  console.log('🗑️  Cleaning existing data...');

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

  const passwordHash = await bcrypt.hash('123456789', 10);

  // Synax Team Users
  const admin = await prisma.user.create({
    data: { email: 'admin@synax.app', passwordHash, name: 'System Administrator', role: 'ADMIN' },
  });

  const iNouchakis = await prisma.user.create({
    data: { email: 'i.nouchakis@synax.app', passwordHash, name: 'Ioannis Nouchakis', role: 'ADMIN' },
  });

  const vKlakalas = await prisma.user.create({
    data: { email: 'v.klakalas@synax.app', passwordHash, name: 'Vassilis Klakalas', role: 'PM' },
  });

  const cPatsatzakis = await prisma.user.create({
    data: { email: 'c.patsatzakis@synax.app', passwordHash, name: 'Christos Patsatzakis', role: 'TECHNICIAN' },
  });

  const aAvgerinos = await prisma.user.create({
    data: { email: 'a.avgerinos@synax.app', passwordHash, name: 'Alexandros Avgerinos', role: 'TECHNICIAN' },
  });

  const allTechs = [cPatsatzakis, aAvgerinos];

  console.log(`✅ Created 5 users\n`);

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
          cabling: [{ name: 'Καλωδίωση δικτύου', requiresPhoto: false }, { name: 'PoE verification', requiresPhoto: false }],
          equipment: [{ name: 'Τοποθέτηση AP', requiresPhoto: true }, { name: 'Mounting bracket', requiresPhoto: true }],
          config: [{ name: 'Controller provisioning', requiresPhoto: false }, { name: 'SSID configuration', requiresPhoto: false }],
          documentation: [{ name: 'MAC address recording', requiresPhoto: false }, { name: 'Signal test', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Outdoor Access Point',
        icon: 'wifi',
        checklistTemplate: {
          cabling: [{ name: 'Outdoor cable routing', requiresPhoto: true }, { name: 'Weatherproof connections', requiresPhoto: true }],
          equipment: [{ name: 'Pole/wall mounting', requiresPhoto: true }, { name: 'Alignment', requiresPhoto: true }],
          config: [{ name: 'Controller provisioning', requiresPhoto: false }],
          documentation: [{ name: 'Coverage test', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Network Switch 8-port',
        icon: 'network',
        checklistTemplate: {
          cabling: [{ name: 'Uplink fiber/copper', requiresPhoto: false }, { name: 'Port patching', requiresPhoto: true }],
          equipment: [{ name: 'Rack/wall mounting', requiresPhoto: true }],
          config: [{ name: 'VLAN configuration', requiresPhoto: false }, { name: 'Management IP', requiresPhoto: false }],
          documentation: [{ name: 'Port mapping', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Network Switch 16-port',
        icon: 'network',
        checklistTemplate: {
          cabling: [{ name: 'Uplink fiber/copper', requiresPhoto: false }, { name: 'Port patching', requiresPhoto: true }],
          equipment: [{ name: 'Rack mounting', requiresPhoto: true }],
          config: [{ name: 'VLAN configuration', requiresPhoto: false }],
          documentation: [{ name: 'Port mapping', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'IP Camera',
        icon: 'camera',
        checklistTemplate: {
          cabling: [{ name: 'PoE cable connection', requiresPhoto: false }],
          equipment: [{ name: 'Camera mounting', requiresPhoto: true }, { name: 'Angle adjustment', requiresPhoto: true }],
          config: [{ name: 'NVR registration', requiresPhoto: false }, { name: 'Motion zones', requiresPhoto: false }],
          documentation: [{ name: 'Screenshot capture', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'PTZ Camera',
        icon: 'camera',
        checklistTemplate: {
          cabling: [{ name: 'PoE+ cable connection', requiresPhoto: false }],
          equipment: [{ name: 'PTZ mounting', requiresPhoto: true }],
          config: [{ name: 'Preset positions', requiresPhoto: false }, { name: 'Tour configuration', requiresPhoto: false }],
          documentation: [{ name: 'Coverage test', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Thermal Camera',
        icon: 'camera',
        checklistTemplate: {
          cabling: [{ name: 'Cable connection', requiresPhoto: false }],
          equipment: [{ name: 'Mounting', requiresPhoto: true }],
          config: [{ name: 'Temperature thresholds', requiresPhoto: false }],
          documentation: [{ name: 'Thermal image test', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Smart TV',
        icon: 'tv',
        checklistTemplate: {
          cabling: [{ name: 'HDMI/Network connection', requiresPhoto: false }],
          equipment: [{ name: 'TV mounting/placement', requiresPhoto: true }, { name: 'TV lift mechanism', requiresPhoto: true }],
          config: [{ name: 'IPTV setup', requiresPhoto: false }, { name: 'Channel configuration', requiresPhoto: false }],
          documentation: [{ name: 'Functionality test', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'VoIP Phone',
        icon: 'phone',
        checklistTemplate: {
          cabling: [{ name: 'PoE connection', requiresPhoto: false }],
          equipment: [{ name: 'Phone placement', requiresPhoto: true }],
          config: [{ name: 'Extension assignment', requiresPhoto: false }, { name: 'PBX registration', requiresPhoto: false }],
          documentation: [{ name: 'Call test', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'UPS',
        icon: 'battery',
        checklistTemplate: {
          cabling: [{ name: 'Power connection', requiresPhoto: false }],
          equipment: [{ name: 'UPS placement', requiresPhoto: true }],
          config: [{ name: 'Battery test', requiresPhoto: false }],
          documentation: [{ name: 'Runtime test', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'LDF Switch',
        icon: 'network',
        checklistTemplate: {
          cabling: [{ name: 'Fiber backbone', requiresPhoto: true }, { name: 'Copper distribution', requiresPhoto: true }],
          equipment: [{ name: 'Pillar/cabinet installation', requiresPhoto: true }],
          config: [{ name: 'VLAN trunk', requiresPhoto: false }],
          documentation: [{ name: 'Port documentation', requiresPhoto: false }],
        },
      },
    }),
  ]);

  const typeMap: Record<string, typeof assetTypes[0]> = {};
  assetTypes.forEach(t => typeMap[t.name] = t);

  console.log(`✅ Created ${assetTypes.length} asset types\n`);

  // ============================================
  // STEP 4: Create Project
  // ============================================
  console.log('🏗️  Creating OOKEA Resort project...');

  const project = await prisma.project.create({
    data: {
      name: 'OOKEA Resort - ICT Installation',
      description: 'Ολοκληρωμένη εγκατάσταση ICT υποδομής για luxury resort. Περιλαμβάνει WiFi (indoor & outdoor), CCTV, IPTV, IP PBX, δομημένη καλωδίωση και server farm.',
      clientName: 'OOKEA Resort S.A.',
      location: 'Ελλάδα',
      status: 'IN_PROGRESS',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-05-31'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: iNouchakis.id, role: 'ADMIN' },
          { userId: vKlakalas.id, role: 'PM' },
          { userId: cPatsatzakis.id, role: 'TECHNICIAN' },
          { userId: aAvgerinos.id, role: 'TECHNICIAN' },
        ],
      },
    },
  });

  console.log(`✅ Created project: ${project.name}\n`);

  // ============================================
  // STEP 5: Create Floors (Areas)
  // ============================================
  console.log('🏢 Creating floors/areas...');

  const floors = await Promise.all([
    // Main Building
    prisma.floor.create({ data: { projectId: project.id, name: 'Main Building - Level -3 (BOH)', level: -3 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Main Building - Level -2 (Kitchen)', level: -2 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Main Building - Level -1 (Tavern/Library)', level: -1 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Main Building - Level 0 (Lobby)', level: 0 } }),
    // Spa
    prisma.floor.create({ data: { projectId: project.id, name: 'Spa - Level -3 (Plant Room)', level: 1 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Spa - Level -2 (Pool Area)', level: 2 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Spa - Level -1', level: 3 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Spa - Level 0 (Reception)', level: 4 } }),
    // Other Buildings
    prisma.floor.create({ data: { projectId: project.id, name: 'Gym & Hair Salon', level: 5 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Kids Club', level: 6 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Beach Club', level: 7 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Dive Center', level: 8 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Guard House & Security', level: 9 } }),
    // Cottages Clusters
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 1 (Rooms 401-415)', level: 10 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 2 (Rooms 301-311)', level: 11 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 3 (Rooms 201-222)', level: 12 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 5 (Rooms 101-112, 210-216)', level: 13 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 6 (Rooms 106-112)', level: 14 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 7 (Rooms 217-222)', level: 15 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 8 (Rooms 307, 408, 410-413)', level: 16 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Cottages - Cluster 501-503', level: 17 } }),
    // Infrastructure
    prisma.floor.create({ data: { projectId: project.id, name: 'LDF/Pillar Infrastructure', level: 18 } }),
    prisma.floor.create({ data: { projectId: project.id, name: 'Outdoor Poles & Maid Stations', level: 19 } }),
  ]);

  const floorMap: Record<string, typeof floors[0]> = {};
  floors.forEach(f => floorMap[f.name] = f);

  console.log(`✅ Created ${floors.length} floors/areas\n`);

  // ============================================
  // STEP 6: Create Rooms & Assets
  // ============================================
  console.log('🚪 Creating rooms and assets...');

  let totalRooms = 0;
  let totalAssets = 0;

  // --- COTTAGES (63 villas from Excel) ---
  const cottagesData = [
    // Room No, Cluster, 8-port, 16-port, TV, WAP, Phone, UPS
    { room: '101', cluster: 5, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '102', cluster: 5, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '103', cluster: 5, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '104', cluster: 5, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '105', cluster: 5, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '106', cluster: 6, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '107', cluster: 8, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '108', cluster: 6, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '109', cluster: 6, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '110', cluster: 6, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '111', cluster: 6, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '112', cluster: 6, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '201', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '202', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '203', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '204', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '205', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '206', cluster: 3, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '207', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '208', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '209', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '210', cluster: 5, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '211', cluster: 5, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '212', cluster: 5, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '213', cluster: 5, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '214', cluster: 5, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '215', cluster: 5, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '216', cluster: 5, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '217', cluster: 7, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '218', cluster: 7, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '219', cluster: 7, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '220', cluster: 7, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '221', cluster: 7, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '222', cluster: 7, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '301', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '302', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '303', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '304', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '305', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '306', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '307', cluster: 8, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '308', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '309', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '310', cluster: 2, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '311', cluster: 8, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '401', cluster: 1, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '402', cluster: 1, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '403', cluster: 1, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '404', cluster: 1, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '405', cluster: 1, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 0, ups: true, notes: 'MockUp - Empty copper outlet' },
    { room: '406', cluster: 4, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '407', cluster: 4, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '408', cluster: 8, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '409', cluster: 4, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '410', cluster: 8, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '411', cluster: 4, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '412', cluster: 8, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '413', cluster: 8, sw8: 0, sw16: 1, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '414', cluster: 4, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '415', cluster: 4, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '501', cluster: 1, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '502', cluster: 1, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
    { room: '503', cluster: 3, sw8: 1, sw16: 0, tv: 1, wap: 1, phone: 1, ups: true },
  ];

  // Map cluster to floor
  const clusterFloorMap: Record<number, string> = {
    1: 'Cottages - Cluster 1 (Rooms 401-415)',
    2: 'Cottages - Cluster 2 (Rooms 301-311)',
    3: 'Cottages - Cluster 3 (Rooms 201-222)',
    4: 'Cottages - Cluster 1 (Rooms 401-415)',
    5: 'Cottages - Cluster 5 (Rooms 101-112, 210-216)',
    6: 'Cottages - Cluster 6 (Rooms 106-112)',
    7: 'Cottages - Cluster 7 (Rooms 217-222)',
    8: 'Cottages - Cluster 8 (Rooms 307, 408, 410-413)',
  };

  for (const c of cottagesData) {
    const floorName = clusterFloorMap[c.cluster] || 'Cottages - Cluster 501-503';
    const floor = floorMap[floorName];
    if (!floor) continue;

    const statuses: ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED')[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    const roomStatus = statuses[Math.floor(Math.random() * 3)];

    const room = await prisma.room.create({
      data: {
        floorId: floor.id,
        name: `Cottage ${c.room}`,
        type: 'cottage',
        status: roomStatus,
        notes: (c as any).notes || null,
        pinX: Math.random() * 500 + 50,
        pinY: Math.random() * 300 + 50,
      },
    });
    totalRooms++;

    // Create assets for cottage
    const assetStatuses: ('PLANNED' | 'IN_STOCK' | 'INSTALLED' | 'CONFIGURED' | 'VERIFIED')[] =
      ['PLANNED', 'IN_STOCK', 'INSTALLED', 'CONFIGURED', 'VERIFIED'];
    const tech = allTechs[Math.floor(Math.random() * allTechs.length)];

    // Switch
    if (c.sw8) {
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['Network Switch 8-port'].id,
          name: `SW-${c.room}-8P`,
          model: 'Cisco CBS250-8P-E-2G',
          serialNumber: `CBS8-${c.room}-${Date.now().toString(36)}`,
          status: assetStatuses[Math.floor(Math.random() * 5)],
          installedById: tech.id,
          pinX: 50, pinY: 50,
        },
      });
      totalAssets++;
    }
    if (c.sw16) {
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['Network Switch 16-port'].id,
          name: `SW-${c.room}-16P`,
          model: 'Cisco CBS250-16P-2G',
          serialNumber: `CBS16-${c.room}-${Date.now().toString(36)}`,
          status: assetStatuses[Math.floor(Math.random() * 5)],
          installedById: tech.id,
          pinX: 50, pinY: 100,
        },
      });
      totalAssets++;
    }

    // TV
    if (c.tv) {
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['Smart TV'].id,
          name: `TV-${c.room}`,
          model: 'Samsung HG55AU800',
          serialNumber: `TV-${c.room}-${Date.now().toString(36)}`,
          status: assetStatuses[Math.floor(Math.random() * 5)],
          installedById: tech.id,
          notes: 'TV Lift: Functional',
          pinX: 150, pinY: 50,
        },
      });
      totalAssets++;
    }

    // WAP
    if (c.wap) {
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['Access Point'].id,
          name: `AP-${c.room}`,
          model: 'Cisco Meraki MR36',
          serialNumber: `Q2QN-${c.room}-${Date.now().toString(36)}`,
          macAddress: `00:18:0A:${c.room.padStart(3, '0').substring(0, 2)}:${c.room.padStart(3, '0').substring(1)}:01`,
          status: 'VERIFIED',
          installedById: tech.id,
          pinX: 100, pinY: 150,
        },
      });
      totalAssets++;
    }

    // Phone
    if (c.phone) {
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['VoIP Phone'].id,
          name: `PHONE-${c.room}`,
          model: 'Cisco IP Phone 8845',
          serialNumber: `PHONE-${c.room}-${Date.now().toString(36)}`,
          status: assetStatuses[Math.floor(Math.random() * 5)],
          installedById: tech.id,
          pinX: 200, pinY: 50,
        },
      });
      totalAssets++;
    }

    // UPS
    if (c.ups) {
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['UPS'].id,
          name: `UPS-${c.room}`,
          model: 'APC Back-UPS 650VA',
          serialNumber: `UPS-${c.room}-${Date.now().toString(36)}`,
          status: assetStatuses[Math.floor(Math.random() * 5)],
          installedById: tech.id,
          pinX: 50, pinY: 200,
        },
      });
      totalAssets++;
    }
  }

  console.log(`   ✅ Created 63 cottages with ${totalAssets} assets`);

  // --- MAIN BUILDING ROOMS ---
  const mainBuildingRooms = [
    { floor: 'Main Building - Level -3 (BOH)', rooms: ['Deliveries Yard', 'Offices', 'Staff Canteen', 'Hot Kitchen', 'Cold Room Corridor', 'Receiving Area', 'Laundry', 'Dry Cleaning Area', 'HK Manager Office', 'Meat Prep', 'Towels Area', 'Computer Room'] },
    { floor: 'Main Building - Level -2 (Kitchen)', rooms: ['Kitchen', 'Wine Cellar Storage', 'Bakery'] },
    { floor: 'Main Building - Level -1 (Tavern/Library)', rooms: ['Tavern', 'Library', 'Room Next to Library', 'BOH False Column', 'Speakeasy Bar', 'Column Outside Tavern'] },
    { floor: 'Main Building - Level 0 (Lobby)', rooms: ['LDF Corridor', 'Lounge Bar', 'Main Entrance / Port Cochere', 'Guest Car Park / Events Hall'] },
  ];

  for (const mb of mainBuildingRooms) {
    const floor = floorMap[mb.floor];
    if (!floor) continue;

    for (const roomName of mb.rooms) {
      const room = await prisma.room.create({
        data: {
          floorId: floor.id,
          name: roomName,
          type: 'common_area',
          status: ['IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 2)] as any,
          pinX: Math.random() * 500 + 50,
          pinY: Math.random() * 300 + 50,
        },
      });
      totalRooms++;

      // Add WAP to each room
      const tech = allTechs[Math.floor(Math.random() * allTechs.length)];
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['Access Point'].id,
          name: `AP-MB-${roomName.substring(0, 10).replace(/\s/g, '')}`,
          model: 'Cisco Meraki MR46',
          serialNumber: `Q2QN-MB-${Date.now().toString(36)}`,
          status: 'VERIFIED',
          installedById: tech.id,
          pinX: 100, pinY: 100,
        },
      });
      totalAssets++;
    }
  }

  console.log(`   ✅ Created Main Building rooms`);

  // --- SPA ROOMS ---
  const spaRooms = [
    { floor: 'Spa - Level -3 (Plant Room)', rooms: ['MEP Plant Room'] },
    { floor: 'Spa - Level -2 (Pool Area)', rooms: ['Guest Stairs Left', 'Guest Stairs Right', 'Outdoors Main Staircase Left', 'Outdoors Main Staircase Right', 'Guest Elevator Light Hatch', 'Pool to Stairs Corridor'] },
    { floor: 'Spa - Level -1', rooms: ['Staff Elevator', 'Main Staircase Left', 'Main Staircase Right'] },
    { floor: 'Spa - Level 0 (Reception)', rooms: ['Spa Reception', 'Guest Elevator', 'Staff Elevator'] },
  ];

  for (const spa of spaRooms) {
    const floor = floorMap[spa.floor];
    if (!floor) continue;

    for (const roomName of spa.rooms) {
      const room = await prisma.room.create({
        data: {
          floorId: floor.id,
          name: roomName,
          type: 'spa',
          status: 'COMPLETED',
          pinX: Math.random() * 400 + 50,
          pinY: Math.random() * 200 + 50,
        },
      });
      totalRooms++;

      const tech = allTechs[Math.floor(Math.random() * allTechs.length)];
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: typeMap['Access Point'].id,
          name: `AP-SPA-${roomName.substring(0, 8).replace(/\s/g, '')}`,
          model: 'Cisco Meraki MR36',
          status: 'VERIFIED',
          installedById: tech.id,
          pinX: 100, pinY: 100,
        },
      });
      totalAssets++;
    }
  }

  console.log(`   ✅ Created Spa rooms`);

  // --- OTHER BUILDINGS ---
  const otherBuildings = [
    { floor: 'Gym & Hair Salon', rooms: ['Gym Reception', 'Gym Restroom', 'Hair Salon Reception', 'Hair Salon Workstation', 'Yoga Deck'] },
    { floor: 'Kids Club', rooms: ['Indoor Play Area', 'Shop 1', 'Shop 2', 'Bar Pergola'] },
    { floor: 'Beach Club', rooms: ['Bar Pergola', 'LDF Corridor', 'Receiving Area', 'Retail', 'Changing Rooms', 'Turn Circle', 'River Area'] },
    { floor: 'Dive Center', rooms: ['Inside', 'Outside Wall'] },
    { floor: 'Guard House & Security', rooms: ['Upstairs', 'Downstairs', 'Clinic'] },
  ];

  for (const bldg of otherBuildings) {
    const floor = floorMap[bldg.floor];
    if (!floor) continue;

    for (const roomName of bldg.rooms) {
      const room = await prisma.room.create({
        data: {
          floorId: floor.id,
          name: roomName,
          type: 'common_area',
          status: ['IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 2)] as any,
          pinX: Math.random() * 400 + 50,
          pinY: Math.random() * 200 + 50,
        },
      });
      totalRooms++;

      const tech = allTechs[Math.floor(Math.random() * allTechs.length)];
      const isOutdoor = roomName.toLowerCase().includes('outdoor') || roomName.toLowerCase().includes('pergola') || roomName.toLowerCase().includes('outside');
      await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: isOutdoor ? typeMap['Outdoor Access Point'].id : typeMap['Access Point'].id,
          name: `${isOutdoor ? 'OWAP' : 'AP'}-${bldg.floor.substring(0, 4)}-${roomName.substring(0, 6).replace(/\s/g, '')}`,
          model: isOutdoor ? 'Cisco Meraki MR86' : 'Cisco Meraki MR36',
          status: ['INSTALLED', 'VERIFIED'][Math.floor(Math.random() * 2)] as any,
          installedById: tech.id,
          pinX: 100, pinY: 100,
        },
      });
      totalAssets++;
    }
  }

  console.log(`   ✅ Created other buildings`);

  // --- LDF/PILLAR INFRASTRUCTURE (26 switches) ---
  const ldfData = [
    'Sub-1', 'Sub-2', 'Sub-3', 'Sub-4', 'Sub-5',
    'Maid-1', 'Maid-2', 'Maid-3', 'Maid-4', 'Maid-5', 'Maid-6',
    'Pillar-1', 'Pillar-2', 'Pillar-3', 'Pillar-4-Marine',
    'WWTP', 'Spa-L3', 'Spa-L1', 'Spa-L0', 'Gym',
    'Hair-Salon', 'Kids-Club', 'Dive-Center', 'Beach-Club',
    'Desalination', 'Security-Guard'
  ];

  const ldfFloor = floorMap['LDF/Pillar Infrastructure'];
  for (const ldf of ldfData) {
    const room = await prisma.room.create({
      data: {
        floorId: ldfFloor.id,
        name: `LDF ${ldf}`,
        type: 'comms_room',
        status: 'COMPLETED',
        pinX: Math.random() * 600 + 50,
        pinY: Math.random() * 400 + 50,
      },
    });
    totalRooms++;

    const tech = allTechs[Math.floor(Math.random() * allTechs.length)];
    await prisma.asset.create({
      data: {
        roomId: room.id,
        assetTypeId: typeMap['LDF Switch'].id,
        name: `LDF-SW-${ldf}`,
        model: 'Cisco Catalyst 9200-24P',
        serialNumber: `LDF-${ldf}-${Date.now().toString(36)}`,
        status: 'VERIFIED',
        installedById: tech.id,
        pinX: 100, pinY: 100,
      },
    });
    totalAssets++;
  }

  console.log(`   ✅ Created 26 LDF/Pillar locations`);

  // --- CCTV CAMERAS ---
  const cctvFloor = floorMap['Main Building - Level -3 (BOH)'];

  // Internal cameras from Excel (28 online)
  const cctvCodes = ['C-3.01', 'C-3.02', 'C-3.03', 'C-3.04', 'C-3.05', 'C-3.06', 'C-3.07', 'C-3.08',
    'C-3.09', 'C-3.10', 'C-3.11', 'C-3.12', 'C-3.13', 'C-3.16', 'C-3.17', 'Vault',
    'C-2.10', 'C-2.13', 'C-1.01', 'C-1.03', 'C-1.17',
    'C-0.01', 'C-0.02', 'C-0.03', 'C-0.05', 'C-0.07', 'C-0.11', 'C-0.12', 'C-0.13'];

  const securityRoom = await prisma.room.create({
    data: {
      floorId: cctvFloor.id,
      name: 'Security Control Room',
      type: 'security',
      status: 'COMPLETED',
      pinX: 300, pinY: 200,
    },
  });
  totalRooms++;

  for (const cam of cctvCodes) {
    const tech = allTechs[Math.floor(Math.random() * allTechs.length)];
    await prisma.asset.create({
      data: {
        roomId: securityRoom.id,
        assetTypeId: typeMap['IP Camera'].id,
        name: `CAM-${cam}`,
        model: 'Hikvision DS-2CD2386G2',
        serialNumber: `HKV-${cam}-${Date.now().toString(36)}`,
        status: cam === 'C-1.17' ? 'PLANNED' : 'VERIFIED',
        notes: cam === 'C-1.17' ? 'Scaffold Needed' : null,
        installedById: tech.id,
        pinX: Math.random() * 200 + 50,
        pinY: Math.random() * 200 + 50,
      },
    });
    totalAssets++;
  }

  // Outdoor pole cameras
  const poleCams = ['101', '214', '213', '209', 'THERMAL-222', 'THERMAL-216',
    'SUB-1', 'SUB-2', 'SUB-3', 'PTZ-MARINA', 'PTZ-MULTI', 'DESAL', 'PARKING',
    'MAID-1', 'MAID-2', 'MAID-3', 'MAID-4', 'MAID-5', 'MAID-6'];

  const polesFloor = floorMap['Outdoor Poles & Maid Stations'];
  const polesRoom = await prisma.room.create({
    data: {
      floorId: polesFloor.id,
      name: 'Outdoor Camera Poles',
      type: 'outdoor',
      status: 'IN_PROGRESS',
      pinX: 300, pinY: 200,
    },
  });
  totalRooms++;

  for (const cam of poleCams) {
    const tech = allTechs[Math.floor(Math.random() * allTechs.length)];
    const isThermal = cam.includes('THERMAL');
    const isPTZ = cam.includes('PTZ');
    const isOffline = ['PTZ-MARINA', 'PTZ-MULTI', 'DESAL', 'PARKING'].includes(cam);

    await prisma.asset.create({
      data: {
        roomId: polesRoom.id,
        assetTypeId: isThermal ? typeMap['Thermal Camera'].id : (isPTZ ? typeMap['PTZ Camera'].id : typeMap['IP Camera'].id),
        name: `CAM-POLE-${cam}`,
        model: isThermal ? 'Hikvision DS-2TD2136' : (isPTZ ? 'Hikvision DS-2DE4425IW' : 'Hikvision DS-2CD2T86G2'),
        serialNumber: `HKV-POLE-${cam}-${Date.now().toString(36)}`,
        status: isOffline ? 'INSTALLED' : 'VERIFIED',
        notes: isOffline ? 'Offline - cable missing' : null,
        installedById: tech.id,
        pinX: Math.random() * 400 + 50,
        pinY: Math.random() * 300 + 50,
      },
    });
    totalAssets++;
  }

  console.log(`   ✅ Created ${cctvCodes.length + poleCams.length} CCTV cameras`);

  console.log(`\n✅ Total: ${totalRooms} rooms, ${totalAssets} assets\n`);

  // ============================================
  // STEP 7: Create Checklists
  // ============================================
  console.log('📋 Creating checklists...');

  const allAssets = await prisma.asset.findMany({ where: { room: { floor: { projectId: project.id } } } });
  let checklistCount = 0;
  let itemCount = 0;

  for (const asset of allAssets) {
    const types: ('CABLING' | 'EQUIPMENT' | 'CONFIG' | 'DOCUMENTATION')[] = ['CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION'];

    for (const type of types) {
      const isCompleted = ['VERIFIED', 'CONFIGURED'].includes(asset.status);
      const isInProgress = ['INSTALLED'].includes(asset.status);

      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (isCompleted) status = 'COMPLETED';
      else if (isInProgress && ['CABLING', 'EQUIPMENT'].includes(type)) status = 'COMPLETED';
      else if (isInProgress && type === 'CONFIG') status = 'IN_PROGRESS';

      const checklist = await prisma.checklist.create({
        data: {
          assetId: asset.id,
          type,
          status,
          assignedToId: asset.installedById || allTechs[0].id,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
      });
      checklistCount++;

      const items = getChecklistItems(type);
      for (let i = 0; i < items.length; i++) {
        const completed = status === 'COMPLETED' || (status === 'IN_PROGRESS' && i < items.length / 2);
        await prisma.checklistItem.create({
          data: {
            checklistId: checklist.id,
            name: items[i].name,
            isRequired: true,
            requiresPhoto: items[i].requiresPhoto ?? false,
            completed,
            completedById: completed ? (asset.installedById || allTechs[0].id) : null,
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
  // STEP 8: Create Issues (from Open Issues sheet)
  // ============================================
  console.log('⚠️  Creating issues...');

  const issuesData = [
    { title: 'Pics of outdoor installation site for 5G Antennas', causedBy: 'Dolphin / Redex', status: 'OPEN', priority: 'MEDIUM' },
    { title: 'PBX config info gathering', causedBy: 'OTE/OOKEA', status: 'OPEN', priority: 'HIGH' },
    { title: 'Solution Offer for small rack connectivity to Core', causedBy: 'OTE', status: 'OPEN', priority: 'MEDIUM', notes: 'add switch' },
    { title: 'Face Plate Signature', causedBy: 'OOKEA', status: 'OPEN', priority: 'LOW' },
    { title: 'Main Building Installation Points for CCTV and APs', causedBy: 'Dolphin', status: 'OPEN', priority: 'HIGH' },
    { title: 'UPS Readiness to installation Sites', causedBy: 'Dolphin', status: 'OPEN', priority: 'HIGH' },
    { title: 'Teams Integration OFF Site Office', causedBy: 'OTE', status: 'OPEN', priority: 'MEDIUM' },
    { title: 'Power to the TV retraction mechanism', causedBy: 'Dolphin', status: 'OPEN', priority: 'HIGH' },
    { title: 'Repeated copper cabling numbering', causedBy: 'Dolphin', status: 'OPEN', priority: 'MEDIUM' },
    { title: 'Power to the Cottages', causedBy: 'Dolphin', status: 'OPEN', priority: 'CRITICAL' },
    { title: 'As Build cable plans outdoor/indoor', causedBy: 'Dolphin / Redex', status: 'CLOSED', priority: 'HIGH' },
    { title: 'Calculation of BMS switch port allocation', causedBy: 'OTE', status: 'CLOSED', priority: 'MEDIUM' },
    { title: 'Cottage Priorities', causedBy: 'Dolphin', status: 'CLOSED', priority: 'HIGH' },
    { title: 'Cameras Sort out Meeting', causedBy: 'Dolphin/OTE', status: 'CLOSED', priority: 'HIGH' },
    { title: 'Room Numbering', causedBy: 'Dolphin', status: 'CLOSED', priority: 'MEDIUM' },
    { title: 'Method Approval for APs and CCTV Cams ext', causedBy: 'OTE/Dolphin', status: 'CLOSED', priority: 'MEDIUM' },
    { title: 'No BMS connections to Hotel Network', causedBy: 'Dolphin', status: 'CLOSED', priority: 'LOW' },
    { title: '2nd Wi-Fi Controller', causedBy: 'OTE', status: 'CLOSED', priority: 'HIGH' },
    { title: 'Inform Kostas about Sat TV F/O requirements', causedBy: 'OTE', status: 'CLOSED', priority: 'LOW' },
    { title: 'NEC Hotel Pack - Info', causedBy: 'OTE', status: 'CLOSED', priority: 'MEDIUM' },
    { title: 'Rack from Demarcation room to CR', causedBy: 'Dolphin', status: 'CLOSED', priority: 'HIGH' },
  ];

  for (const issue of issuesData) {
    const createdIssue = await prisma.issue.create({
      data: {
        projectId: project.id,
        title: issue.title,
        description: `Issue: ${issue.title}`,
        causedBy: issue.causedBy,
        priority: issue.priority as any,
        status: issue.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
        createdById: vKlakalas.id,
        resolvedAt: issue.status === 'CLOSED' ? new Date() : null,
      },
    });

    // Add a comment
    await prisma.issueComment.create({
      data: {
        issueId: createdIssue.id,
        userId: vKlakalas.id,
        comment: issue.status === 'CLOSED' ? 'Issue resolved and closed.' : 'Working on this issue.',
      },
    });
  }

  console.log(`✅ Created ${issuesData.length} issues\n`);

  // ============================================
  // STEP 9: Create Inventory
  // ============================================
  console.log('📦 Creating inventory...');

  const inventoryItems = [
    { type: 'Network Switch 8-port', desc: 'Cisco CBS250-8P-E-2G', received: 50, used: 43 },
    { type: 'Network Switch 16-port', desc: 'Cisco CBS250-16P-2G', received: 25, used: 20 },
    { type: 'Access Point Indoor', desc: 'Cisco Meraki MR36', received: 100, used: 85 },
    { type: 'Access Point Indoor', desc: 'Cisco Meraki MR46', received: 30, used: 25 },
    { type: 'Access Point Outdoor', desc: 'Cisco Meraki MR86', received: 20, used: 15 },
    { type: 'IP Camera Dome', desc: 'Hikvision DS-2CD2386G2', received: 40, used: 35 },
    { type: 'IP Camera Bullet', desc: 'Hikvision DS-2CD2T86G2', received: 25, used: 20 },
    { type: 'PTZ Camera', desc: 'Hikvision DS-2DE4425IW', received: 5, used: 3 },
    { type: 'Thermal Camera', desc: 'Hikvision DS-2TD2136', received: 4, used: 2 },
    { type: 'Smart TV 55"', desc: 'Samsung HG55AU800', received: 70, used: 63 },
    { type: 'VoIP Phone', desc: 'Cisco IP Phone 8845', received: 70, used: 62 },
    { type: 'UPS 650VA', desc: 'APC Back-UPS 650VA', received: 70, used: 63 },
    { type: 'Cat6 Cable Box', desc: 'Cat6 UTP 305m Blue', received: 50, used: 42 },
    { type: 'Fiber Patch Cord', desc: 'LC-LC OM4 5m', received: 100, used: 75 },
    { type: 'RJ45 Connectors', desc: 'Cat6 RJ45 (100pcs)', received: 30, used: 25 },
  ];

  for (const item of inventoryItems) {
    const inv = await prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: item.type,
        description: item.desc,
        unit: 'pcs',
        quantityReceived: item.received,
        quantityUsed: item.used,
      },
    });

    await prisma.inventoryLog.create({
      data: { itemId: inv.id, action: 'RECEIVED', quantity: item.received, notes: 'Initial delivery', userId: vKlakalas.id },
    });
    await prisma.inventoryLog.create({
      data: { itemId: inv.id, action: 'CONSUMED', quantity: item.used, notes: 'Installation', userId: cPatsatzakis.id },
    });
  }

  console.log(`✅ Created ${inventoryItems.length} inventory items\n`);

  // ============================================
  // Summary
  // ============================================
  console.log('═══════════════════════════════════════════');
  console.log('🏝️  OOKEA RESORT SEED COMPLETED!');
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log(`   👤 Users: 5`);
  console.log(`   📦 Asset Types: ${assetTypes.length}`);
  console.log(`   🏗️  Project: OOKEA Resort`);
  console.log(`   🏢 Floors/Areas: ${floors.length}`);
  console.log(`   🚪 Rooms: ${totalRooms}`);
  console.log(`   📡 Assets: ${totalAssets}`);
  console.log(`   📋 Checklists: ${checklistCount}`);
  console.log(`   ✅ Checklist Items: ${itemCount}`);
  console.log(`   ⚠️  Issues: ${issuesData.length}`);
  console.log(`   📦 Inventory Items: ${inventoryItems.length}`);
  console.log('');
  console.log('📧 Test Accounts (password: 123456789):');
  console.log('   Admin:      admin@synax.app');
  console.log('   Admin:      i.nouchakis@synax.app');
  console.log('   PM:         v.klakalas@synax.app');
  console.log('   Tech:       c.patsatzakis@synax.app');
  console.log('   Tech:       a.avgerinos@synax.app');
  console.log('');
}

function getChecklistItems(type: string): { name: string; requiresPhoto?: boolean }[] {
  switch (type) {
    case 'CABLING': return [{ name: 'Cable routing', requiresPhoto: false }, { name: 'Termination', requiresPhoto: true }, { name: 'Test', requiresPhoto: true }];
    case 'EQUIPMENT': return [{ name: 'Mounting', requiresPhoto: true }, { name: 'Power connection', requiresPhoto: false }];
    case 'CONFIG': return [{ name: 'IP/VLAN setup', requiresPhoto: false }, { name: 'Functionality test', requiresPhoto: false }];
    case 'DOCUMENTATION': return [{ name: 'Serial/MAC recording', requiresPhoto: false }, { name: 'Photo documentation', requiresPhoto: true }];
    default: return [];
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
