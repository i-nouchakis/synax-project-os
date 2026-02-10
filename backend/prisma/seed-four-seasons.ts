import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Helper functions
// ============================================
function generateSerial(): string {
  const prefix = 'SN';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generateMac(): string {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`.toUpperCase();
}

function generateIp(subnet: string, host: number): string {
  return `${subnet}.${host}`;
}

// ============================================
// Equipment data from BoM_Net.xlsx
// ============================================
const bomData = [
  { qty: 2,   productCode: 'R0X26C', description: 'Aruba 6405 v2 Switch',                  type: 'Core Switches', prefix: 'Core-SW',      assetType: 'Network Switch', subnet: '10.1.0' },
  { qty: 8,   productCode: 'R8Q67A', description: 'Aruba 6200M 24G 4SFP+ Sw',              type: 'Non PoE',       prefix: 'SW-24G',        assetType: 'Network Switch', subnet: '10.1.1' },
  { qty: 10,  productCode: 'R8Q68A', description: 'Aruba 6200M 24G CL4 PoE 4SFP+ Sw',      type: 'PoE',           prefix: 'SW-24G-POE',    assetType: 'Network Switch', subnet: '10.1.2' },
  { qty: 11,  productCode: 'R8Q69A', description: 'Aruba 6200M 48G 4SFP+ Sw',              type: 'Non PoE',       prefix: 'SW-48G',        assetType: 'Network Switch', subnet: '10.1.3' },
  { qty: 39,  productCode: 'R8Q70A', description: 'Aruba 6200M 48G CL4 PoE 4SFP+ Sw',      type: 'PoE',           prefix: 'SW-48G-POE',    assetType: 'Network Switch', subnet: '10.1.4' },
  { qty: 2,   productCode: 'R7H97A', description: 'Aruba 9240 (RW) Campus Gateway',         type: 'WLC',           prefix: 'WLC',           assetType: 'Controller',     subnet: '10.1.5' },
  { qty: 86,  productCode: 'R2H28A', description: 'Aruba AP-505 (RW) Unified AP',           type: 'AP',            prefix: 'AP-505',        assetType: 'Access Point',   subnet: '10.2.0' },
  { qty: 138, productCode: 'R3V46A', description: 'Aruba AP-505H (RW) Unified AP',          type: 'AP',            prefix: 'AP-505H',       assetType: 'Access Point',   subnet: '10.2.1' },
  { qty: 3,   productCode: 'JZ336A', description: 'Aruba AP-535 (RW) Unified AP',           type: 'AP',            prefix: 'AP-535',        assetType: 'Access Point',   subnet: '10.2.2' },
  { qty: 74,  productCode: 'R4H17A', description: 'Aruba AP-575 (RW) Outdoor 11ax AP',      type: 'AP',            prefix: 'AP-575',        assetType: 'Access Point',   subnet: '10.2.3' },
  { qty: 37,  productCode: 'R4H22A', description: 'Aruba AP-577 (RW) Outdoor 11ax AP',      type: 'AP',            prefix: 'AP-577',        assetType: 'Access Point',   subnet: '10.2.4' },
];

// Materials (cables) - inventory items
const materialsData = [
  { productCode: 'J9281D',  description: 'Aruba 10G SFP+ to SFP+ 1m DAC Cable',   qty: 44 },
  { productCode: 'JL488A',  description: 'Aruba 25G SFP28 to SFP28 3m DAC Cable',  qty: 5 },
];

// Building structure
const buildings = [
  // 8 κτίρια: 3 ορόφους × 3 rooms
  ...Array.from({ length: 8 }, (_, i) => ({
    name: `Κ${i + 1}`,
    floors: [
      { name: 'Ground Floor', level: 0, rooms: ['Room 1', 'Room 2', 'Room 3'] },
      { name: '1st Floor',    level: 1, rooms: ['Room 1', 'Room 2', 'Room 3'] },
      { name: '2nd Floor',    level: 2, rooms: ['Room 1', 'Room 2', 'Room 3'] },
    ],
  })),
  // 93 βίλες: 1 όροφος × 2 rooms
  ...Array.from({ length: 93 }, (_, i) => ({
    name: `Villa ${i + 1}`,
    floors: [
      { name: 'Ground Floor', level: 0, rooms: ['Room 1', 'Room 2'] },
    ],
  })),
];

async function main() {
  console.log('🏨 Four Seasons Mykonos - Additive Seed');
  console.log('========================================');

  // ============================================
  // 1. MANUFACTURER (upsert - additive)
  // ============================================
  console.log('🏭 Creating/updating manufacturer...');
  const manufacturer = await prisma.lookupManufacturer.upsert({
    where: { name: 'HPE Aruba Networking' },
    update: {},
    create: {
      name: 'HPE Aruba Networking',
      website: 'https://www.arubanetworks.com',
      order: 100,
    },
  });
  console.log(`✅ Manufacturer: ${manufacturer.name} (${manufacturer.id})`);

  // ============================================
  // 2. ASSET TYPES (upsert - additive)
  // ============================================
  console.log('🔧 Ensuring asset types exist...');
  const assetTypeNames = [...new Set(bomData.map(b => b.assetType))];
  const assetTypeMap: Record<string, string> = {};

  for (const typeName of assetTypeNames) {
    const iconMap: Record<string, string> = {
      'Network Switch': 'network',
      'Access Point': 'wifi',
      'Controller': 'cpu',
    };

    const existing = await prisma.assetType.findFirst({ where: { name: typeName } });
    if (existing) {
      assetTypeMap[typeName] = existing.id;
    } else {
      const created = await prisma.assetType.create({
        data: { name: typeName, icon: iconMap[typeName] || 'box' },
      });
      assetTypeMap[typeName] = created.id;
    }
  }
  console.log(`✅ Asset types ready: ${Object.keys(assetTypeMap).join(', ')}`);

  // ============================================
  // 3. ASSET MODELS (upsert - additive)
  // ============================================
  console.log('📱 Creating asset models...');
  const modelDescriptions = bomData.map(b => b.description);

  for (const bom of bomData) {
    const modelName = bom.description;
    const existing = await prisma.lookupAssetModel.findFirst({
      where: {
        manufacturerId: manufacturer.id,
        name: modelName,
      },
    });
    if (!existing) {
      await prisma.lookupAssetModel.create({
        data: {
          manufacturerId: manufacturer.id,
          name: modelName,
          assetTypeId: assetTypeMap[bom.assetType],
          order: bomData.indexOf(bom),
        },
      });
    }
  }
  console.log(`✅ ${modelDescriptions.length} asset models ready`);

  // ============================================
  // 4. CLIENT (upsert - additive)
  // ============================================
  console.log('👤 Creating/finding client...');
  let client = await prisma.client.findFirst({ where: { name: 'ΟΤΕ' } });
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: 'ΟΤΕ',
        contactPerson: 'Διεύθυνση Δικτύων',
        email: 'networks@ote.gr',
        phone: '+30 210 6111000',
      },
    });
  }
  console.log(`✅ Client: ${client.name} (${client.id})`);

  // ============================================
  // 5. PROJECT
  // ============================================
  console.log('📋 Creating project...');
  const project = await prisma.project.create({
    data: {
      name: 'Four Seasons Mykonos',
      description: 'Network infrastructure deployment for Four Seasons Resort, Mykonos. Includes 8 main buildings and 93 villas. Equipment: Aruba switches, APs, and wireless controllers.',
      clientName: 'ΟΤΕ',
      clientId: client.id,
      location: 'Μύκονος, Ελλάδα',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-01-15'),
    },
  });
  console.log(`✅ Project: ${project.name} (${project.id})`);

  // ============================================
  // 6. BUILDINGS → FLOORS → ROOMS
  // ============================================
  console.log('🏗️  Creating buildings, floors, and rooms...');
  let totalFloors = 0;
  let totalRooms = 0;

  for (const bldg of buildings) {
    const building = await prisma.building.create({
      data: {
        projectId: project.id,
        name: bldg.name,
        description: bldg.name.startsWith('Villa')
          ? `Villa unit - Four Seasons Mykonos`
          : `Main building ${bldg.name} - Four Seasons Mykonos`,
      },
    });

    for (const fl of bldg.floors) {
      const floor = await prisma.floor.create({
        data: {
          buildingId: building.id,
          name: fl.name,
          level: fl.level,
        },
      });
      totalFloors++;

      for (const roomName of fl.rooms) {
        await prisma.room.create({
          data: {
            floorId: floor.id,
            name: roomName,
            status: 'NOT_STARTED',
          },
        });
        totalRooms++;
      }
    }
  }
  console.log(`✅ ${buildings.length} buildings, ${totalFloors} floors, ${totalRooms} rooms created`);

  // ============================================
  // 7. EQUIPMENT (Assets - all IN_STOCK)
  // ============================================
  console.log('⚡ Creating equipment assets...');
  let totalAssets = 0;

  for (const bom of bomData) {
    for (let i = 1; i <= bom.qty; i++) {
      const num = i.toString().padStart(3, '0');
      const hostIp = (i % 254) + 1; // Avoid .0 and .255

      await prisma.asset.create({
        data: {
          projectId: project.id,
          name: `${bom.prefix}-${num}`,
          model: bom.description,
          serialNumber: generateSerial(),
          macAddress: generateMac(),
          ipAddress: generateIp(bom.subnet, hostIp),
          status: 'IN_STOCK',
          notes: `Product Code: ${bom.productCode} | Type: ${bom.type}`,
          assetTypeId: assetTypeMap[bom.assetType],
        },
      });
      totalAssets++;
    }

    console.log(`   📦 ${bom.qty}x ${bom.prefix} created`);
  }
  console.log(`✅ ${totalAssets} equipment assets created (all IN_STOCK)`);

  // ============================================
  // 8. MATERIALS (Inventory Items - cables)
  // ============================================
  console.log('🔌 Creating inventory materials...');

  for (const mat of materialsData) {
    await prisma.inventoryItem.create({
      data: {
        projectId: project.id,
        itemType: 'Cable',
        description: `${mat.description} (${mat.productCode})`,
        unit: 'pcs',
        quantityReceived: mat.qty,
        quantityUsed: 0,
      },
    });
  }
  console.log(`✅ ${materialsData.length} inventory items created`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================');
  console.log('🎉 Four Seasons Mykonos seed completed!');
  console.log('========================================');
  console.log(`📋 Project:    ${project.name}`);
  console.log(`👤 Client:     ΟΤΕ`);
  console.log(`📍 Location:   Μύκονος, Ελλάδα`);
  console.log(`🏗️  Buildings:  ${buildings.length} (8 κτίρια + 93 βίλες)`);
  console.log(`📊 Floors:     ${totalFloors}`);
  console.log(`🚪 Rooms:      ${totalRooms}`);
  console.log(`⚡ Equipment:  ${totalAssets} (IN_STOCK)`);
  console.log(`🔌 Materials:  ${materialsData.length} items (${materialsData.reduce((s, m) => s + m.qty, 0)} pcs)`);
  console.log(`🏭 Manufacturer: HPE Aruba Networking`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
