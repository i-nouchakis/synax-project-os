const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed...\n');

  // ============================================
  // STEP 1: Create Users
  // ============================================
  console.log('👤 Creating users...');

  const adminHash = await bcrypt.hash('admin123', 10);
  const pmHash = await bcrypt.hash('pm123456', 10);
  const techHash = await bcrypt.hash('tech123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@synax.gr' },
    update: {},
    create: {
      email: 'admin@synax.gr',
      name: 'Admin User',
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true
    }
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@synax.gr' },
    update: {},
    create: {
      email: 'pm@synax.gr',
      name: 'Project Manager',
      passwordHash: pmHash,
      role: 'PM',
      isActive: true
    }
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@synax.gr' },
    update: {},
    create: {
      email: 'tech@synax.gr',
      name: 'Technician',
      passwordHash: techHash,
      role: 'TECHNICIAN',
      isActive: true
    }
  });

  console.log('   ✓ Created 3 users');

  // ============================================
  // STEP 2: Create Lookup Tables
  // ============================================
  console.log('📋 Creating lookup tables...');

  // Room Types
  const roomTypes = [
    { name: 'Server Room', icon: 'server', order: 1 },
    { name: 'Network Closet', icon: 'network', order: 2 },
    { name: 'Guest Room', icon: 'bed', order: 3 },
    { name: 'Suite', icon: 'home', order: 4 },
    { name: 'Conference Room', icon: 'users', order: 5 },
    { name: 'Office', icon: 'briefcase', order: 6 },
    { name: 'Reception', icon: 'building', order: 7 },
    { name: 'Lobby', icon: 'door-open', order: 8 },
    { name: 'Restaurant', icon: 'utensils', order: 9 },
    { name: 'Bar', icon: 'wine', order: 10 },
    { name: 'Corridor', icon: 'move-horizontal', order: 11 },
    { name: 'Storage', icon: 'archive', order: 12 },
  ];

  for (const rt of roomTypes) {
    await prisma.lookupRoomType.upsert({
      where: { name: rt.name },
      update: {},
      create: rt
    });
  }
  console.log(`   ✓ Created ${roomTypes.length} room types`);

  // Inventory Units
  const inventoryUnits = [
    { name: 'Pieces', abbreviation: 'pcs', order: 1 },
    { name: 'Meters', abbreviation: 'm', order: 2 },
    { name: 'Boxes', abbreviation: 'box', order: 3 },
    { name: 'Rolls', abbreviation: 'roll', order: 4 },
    { name: 'Packs', abbreviation: 'pack', order: 5 },
    { name: 'Sets', abbreviation: 'set', order: 6 },
  ];

  for (const iu of inventoryUnits) {
    await prisma.lookupInventoryUnit.upsert({
      where: { name: iu.name },
      update: {},
      create: iu
    });
  }
  console.log(`   ✓ Created ${inventoryUnits.length} inventory units`);

  // Issue Causes
  const issueCauses = [
    { name: 'Electrical Contractor', order: 1 },
    { name: 'HVAC Contractor', order: 2 },
    { name: 'General Contractor', order: 3 },
    { name: 'Plumbing', order: 4 },
    { name: 'Client Request', order: 5 },
    { name: 'Material Delay', order: 6 },
    { name: 'Equipment Failure', order: 7 },
    { name: 'Other', order: 99 },
  ];

  for (const ic of issueCauses) {
    await prisma.lookupIssueCause.upsert({
      where: { name: ic.name },
      update: {},
      create: ic
    });
  }
  console.log(`   ✓ Created ${issueCauses.length} issue causes`);

  // Manufacturers
  const manufacturers = [
    { name: 'Cisco', website: 'https://www.cisco.com', order: 1 },
    { name: 'Ubiquiti', website: 'https://www.ui.com', order: 2 },
    { name: 'Hikvision', website: 'https://www.hikvision.com', order: 3 },
    { name: 'Samsung', website: 'https://www.samsung.com', order: 4 },
    { name: 'APC', website: 'https://www.apc.com', order: 5 },
    { name: 'MikroTik', website: 'https://mikrotik.com', order: 6 },
  ];

  const createdManufacturers = {};
  for (const m of manufacturers) {
    const created = await prisma.lookupManufacturer.upsert({
      where: { name: m.name },
      update: {},
      create: m
    });
    createdManufacturers[m.name] = created;
  }
  console.log(`   ✓ Created ${manufacturers.length} manufacturers`);

  // ============================================
  // STEP 3: Create Asset Types
  // ============================================
  console.log('📦 Creating asset types...');

  const assetTypes = [
    {
      name: 'Access Point',
      icon: 'wifi',
      checklistTemplate: {
        cabling: [{ name: 'Cable terminated', requiresPhoto: true }],
        equipment: [{ name: 'AP mounted', requiresPhoto: true }],
        config: [{ name: 'SSID configured', requiresPhoto: false }],
        documentation: [{ name: 'Photo taken', requiresPhoto: true }],
      },
    },
    {
      name: 'Network Switch',
      icon: 'network',
      checklistTemplate: {
        cabling: [{ name: 'Uplink connected', requiresPhoto: false }],
        equipment: [{ name: 'Rack mounted', requiresPhoto: true }],
        config: [{ name: 'VLANs configured', requiresPhoto: false }],
        documentation: [{ name: 'Port mapping done', requiresPhoto: false }],
      },
    },
    {
      name: 'IP Camera',
      icon: 'camera',
      checklistTemplate: {
        cabling: [{ name: 'Cable terminated', requiresPhoto: true }],
        equipment: [{ name: 'Camera mounted', requiresPhoto: true }],
        config: [{ name: 'Added to NVR', requiresPhoto: false }],
        documentation: [{ name: 'Screenshot taken', requiresPhoto: true }],
      },
    },
    {
      name: 'Router',
      icon: 'router',
      checklistTemplate: {
        equipment: [{ name: 'Rack mounted', requiresPhoto: true }],
        config: [{ name: 'WAN configured', requiresPhoto: false }],
        documentation: [{ name: 'Photo taken', requiresPhoto: true }],
      },
    },
    {
      name: 'TV Display',
      icon: 'tv',
      checklistTemplate: {
        equipment: [{ name: 'TV mounted', requiresPhoto: true }],
        config: [{ name: 'IPTV configured', requiresPhoto: false }],
        documentation: [{ name: 'Photo taken', requiresPhoto: true }],
      },
    },
  ];

  const createdAssetTypes = {};
  for (const at of assetTypes) {
    const created = await prisma.assetType.upsert({
      where: { name: at.name },
      update: {},
      create: at
    });
    createdAssetTypes[at.name] = created;
  }
  console.log(`   ✓ Created ${assetTypes.length} asset types`);

  // Asset Models - use createMany with skipDuplicates
  const assetModels = [
    { manufacturerId: createdManufacturers['Cisco'].id, name: 'Meraki MR46', icon: 'wifi', assetTypeId: createdAssetTypes['Access Point'].id, order: 1 },
    { manufacturerId: createdManufacturers['Ubiquiti'].id, name: 'UniFi 6 Pro', icon: 'wifi', assetTypeId: createdAssetTypes['Access Point'].id, order: 2 },
    { manufacturerId: createdManufacturers['Cisco'].id, name: 'Catalyst 9300', icon: 'network', assetTypeId: createdAssetTypes['Network Switch'].id, order: 1 },
    { manufacturerId: createdManufacturers['Ubiquiti'].id, name: 'USW-Pro-48-PoE', icon: 'network', assetTypeId: createdAssetTypes['Network Switch'].id, order: 2 },
    { manufacturerId: createdManufacturers['Hikvision'].id, name: 'DS-2CD2143G2', icon: 'camera', assetTypeId: createdAssetTypes['IP Camera'].id, order: 1 },
    { manufacturerId: createdManufacturers['Samsung'].id, name: 'HG55AU800', icon: 'tv', assetTypeId: createdAssetTypes['TV Display'].id, order: 1 },
  ];

  // Delete existing and recreate
  await prisma.lookupAssetModel.deleteMany({});
  for (const am of assetModels) {
    await prisma.lookupAssetModel.create({ data: am });
  }
  console.log(`   ✓ Created ${assetModels.length} asset models`);

  // ============================================
  // STEP 4: Create Project with Data
  // ============================================
  console.log('🏗️  Creating demo project...');

  const project = await prisma.project.create({
    data: {
      name: 'Demo Hotel Project',
      description: 'Demo project for testing',
      clientName: 'Demo Client',
      location: 'Athens, Greece',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: pm.id, role: 'PM' },
          { userId: tech.id, role: 'TECHNICIAN' },
        ],
      },
    },
  });

  // Create Building
  const building = await prisma.building.create({
    data: {
      projectId: project.id,
      name: 'Main Building',
      description: 'Main hotel building',
    },
  });

  // Create Floors
  const floor1 = await prisma.floor.create({
    data: { buildingId: building.id, name: 'Ground Floor', level: 0 },
  });
  const floor2 = await prisma.floor.create({
    data: { buildingId: building.id, name: '1st Floor', level: 1 },
  });

  // Create Rooms
  const lobby = await prisma.room.create({
    data: { floorId: floor1.id, name: 'Lobby', type: 'Lobby', status: 'COMPLETED' },
  });
  const serverRoom = await prisma.room.create({
    data: { floorId: floor1.id, name: 'Server Room', type: 'Server Room', status: 'IN_PROGRESS' },
  });
  const room101 = await prisma.room.create({
    data: { floorId: floor2.id, name: 'Room 101', type: 'Guest Room', status: 'IN_PROGRESS' },
  });
  const room102 = await prisma.room.create({
    data: { floorId: floor2.id, name: 'Room 102', type: 'Guest Room', status: 'NOT_STARTED' },
  });

  console.log('   ✓ Created project with 1 building, 2 floors, 4 rooms');

  // Create Assets
  await prisma.asset.create({
    data: {
      roomId: lobby.id,
      assetTypeId: createdAssetTypes['Access Point'].id,
      name: 'AP-LOBBY-01',
      model: 'Meraki MR46',
      serialNumber: 'AP-001',
      status: 'VERIFIED',
      installedById: tech.id,
      installedAt: new Date(),
    },
  });

  await prisma.asset.create({
    data: {
      roomId: serverRoom.id,
      assetTypeId: createdAssetTypes['Network Switch'].id,
      name: 'SW-CORE-01',
      model: 'Catalyst 9300',
      serialNumber: 'SW-001',
      status: 'CONFIGURED',
      installedById: tech.id,
      installedAt: new Date(),
    },
  });

  await prisma.asset.create({
    data: {
      roomId: room101.id,
      assetTypeId: createdAssetTypes['TV Display'].id,
      name: 'TV-101',
      model: 'HG55AU800',
      serialNumber: 'TV-001',
      status: 'INSTALLED',
    },
  });

  await prisma.asset.create({
    data: {
      roomId: room101.id,
      assetTypeId: createdAssetTypes['Access Point'].id,
      name: 'AP-101',
      model: 'UniFi 6 Pro',
      serialNumber: 'AP-002',
      status: 'IN_STOCK',
    },
  });

  console.log('   ✓ Created 4 assets');

  // Create an Issue
  await prisma.issue.create({
    data: {
      projectId: project.id,
      roomId: serverRoom.id,
      title: 'AC not working in server room',
      description: 'The air conditioning is not maintaining temperature',
      causedBy: 'HVAC Contractor',
      priority: 'HIGH',
      status: 'OPEN',
      createdById: tech.id,
    },
  });

  console.log('   ✓ Created 1 issue');

  // Create Inventory
  await prisma.inventoryItem.create({
    data: {
      projectId: project.id,
      itemType: 'Cat6 Cable',
      description: 'Cat6 UTP Cable 305m Box',
      unit: 'box',
      quantityReceived: 10,
      quantityUsed: 3,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      projectId: project.id,
      itemType: 'RJ45 Connectors',
      description: 'Cat6 RJ45 Connectors (100pcs)',
      unit: 'bag',
      quantityReceived: 5,
      quantityUsed: 2,
    },
  });

  console.log('   ✓ Created 2 inventory items');

  // ============================================
  // Summary
  // ============================================
  console.log('\n═══════════════════════════════════════════');
  console.log('🎉 PRODUCTION SEED COMPLETED!');
  console.log('═══════════════════════════════════════════\n');
  console.log('🔑 Login Credentials:');
  console.log('   Admin:      admin@synax.gr / admin123');
  console.log('   PM:         pm@synax.gr / pm123456');
  console.log('   Technician: tech@synax.gr / tech123456');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
