import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding lookup tables...\n');

  // ============================================
  // Room Types
  // ============================================
  const roomTypes = [
    { name: 'Server Room', icon: 'server', order: 1 },
    { name: 'Comms Room', icon: 'router', order: 2 },
    { name: 'Data Center', icon: 'database', order: 3 },
    { name: 'Network Closet', icon: 'network', order: 4 },
    { name: 'Office', icon: 'briefcase', order: 5 },
    { name: 'Meeting Room', icon: 'users', order: 6 },
    { name: 'Reception', icon: 'door-open', order: 7 },
    { name: 'Lobby', icon: 'building', order: 8 },
    { name: 'Hallway', icon: 'move-horizontal', order: 9 },
    { name: 'Storage', icon: 'archive', order: 10 },
    { name: 'Utility Room', icon: 'wrench', order: 11 },
    { name: 'Guest Room', icon: 'bed', order: 12 },
    { name: 'Suite', icon: 'home', order: 13 },
    { name: 'Restaurant', icon: 'utensils', order: 14 },
    { name: 'Bar', icon: 'wine', order: 15 },
    { name: 'Pool Area', icon: 'waves', order: 16 },
    { name: 'Gym', icon: 'dumbbell', order: 17 },
    { name: 'Spa', icon: 'sparkles', order: 18 },
    { name: 'Parking', icon: 'car', order: 19 },
    { name: 'Other', icon: 'circle', order: 99 },
  ];

  for (const rt of roomTypes) {
    await prisma.lookupRoomType.upsert({
      where: { name: rt.name },
      update: { icon: rt.icon, order: rt.order },
      create: rt,
    });
  }
  console.log(`✅ Room Types: ${roomTypes.length} items`);

  // ============================================
  // Inventory Units
  // ============================================
  const inventoryUnits = [
    { name: 'Pieces', abbreviation: 'pcs', order: 1 },
    { name: 'Meters', abbreviation: 'm', order: 2 },
    { name: 'Kilometers', abbreviation: 'km', order: 3 },
    { name: 'Feet', abbreviation: 'ft', order: 4 },
    { name: 'Boxes', abbreviation: 'box', order: 5 },
    { name: 'Rolls', abbreviation: 'roll', order: 6 },
    { name: 'Spools', abbreviation: 'spool', order: 7 },
    { name: 'Bundles', abbreviation: 'bundle', order: 8 },
    { name: 'Pairs', abbreviation: 'pair', order: 9 },
    { name: 'Sets', abbreviation: 'set', order: 10 },
    { name: 'Cartons', abbreviation: 'carton', order: 11 },
    { name: 'Packs', abbreviation: 'pack', order: 12 },
  ];

  for (const iu of inventoryUnits) {
    await prisma.lookupInventoryUnit.upsert({
      where: { abbreviation: iu.abbreviation },
      update: { name: iu.name, order: iu.order },
      create: iu,
    });
  }
  console.log(`✅ Inventory Units: ${inventoryUnits.length} items`);

  // ============================================
  // Issue Causes
  // ============================================
  const issueCauses = [
    { name: 'Internal Team', order: 1 },
    { name: 'Electrical Contractor', order: 2 },
    { name: 'HVAC Contractor', order: 3 },
    { name: 'Plumbing Contractor', order: 4 },
    { name: 'Security Contractor', order: 5 },
    { name: 'Telecom Provider', order: 6 },
    { name: 'Client / Owner', order: 7 },
    { name: 'Third Party Vendor', order: 8 },
    { name: 'Equipment Manufacturer', order: 9 },
    { name: 'General Contractor', order: 10 },
    { name: 'Design Error', order: 11 },
    { name: 'Material Defect', order: 12 },
    { name: 'Weather / Force Majeure', order: 13 },
    { name: 'Unknown', order: 99 },
  ];

  for (const ic of issueCauses) {
    await prisma.lookupIssueCause.upsert({
      where: { name: ic.name },
      update: { order: ic.order },
      create: ic,
    });
  }
  console.log(`✅ Issue Causes: ${issueCauses.length} items`);

  // ============================================
  // Manufacturers
  // ============================================
  const manufacturers = [
    { name: 'Cisco', website: 'https://www.cisco.com', order: 1 },
    { name: 'Ubiquiti', website: 'https://www.ui.com', order: 2 },
    { name: 'Aruba (HPE)', website: 'https://www.arubanetworks.com', order: 3 },
    { name: 'Juniper', website: 'https://www.juniper.net', order: 4 },
    { name: 'Fortinet', website: 'https://www.fortinet.com', order: 5 },
    { name: 'Dahua', website: 'https://www.dahuasecurity.com', order: 6 },
    { name: 'Hikvision', website: 'https://www.hikvision.com', order: 7 },
    { name: 'Axis', website: 'https://www.axis.com', order: 8 },
    { name: 'Panasonic', website: 'https://www.panasonic.com', order: 9 },
    { name: 'Samsung', website: 'https://www.samsung.com', order: 10 },
    { name: 'LG', website: 'https://www.lg.com', order: 11 },
    { name: 'APC', website: 'https://www.apc.com', order: 12 },
    { name: 'Eaton', website: 'https://www.eaton.com', order: 13 },
    { name: 'CommScope', website: 'https://www.commscope.com', order: 14 },
    { name: 'Panduit', website: 'https://www.panduit.com', order: 15 },
    { name: 'TP-Link', website: 'https://www.tp-link.com', order: 16 },
    { name: 'Netgear', website: 'https://www.netgear.com', order: 17 },
    { name: 'MikroTik', website: 'https://mikrotik.com', order: 18 },
    { name: 'Other', order: 99 },
  ];

  const manufacturerMap: Record<string, string> = {};

  for (const mfr of manufacturers) {
    const created = await prisma.lookupManufacturer.upsert({
      where: { name: mfr.name },
      update: { website: mfr.website, order: mfr.order },
      create: mfr,
    });
    manufacturerMap[mfr.name] = created.id;
  }
  console.log(`✅ Manufacturers: ${manufacturers.length} items`);

  // ============================================
  // Asset Models
  // ============================================
  const assetModels = [
    // Cisco
    { manufacturer: 'Cisco', name: 'Catalyst 9300', order: 1 },
    { manufacturer: 'Cisco', name: 'Catalyst 9200', order: 2 },
    { manufacturer: 'Cisco', name: 'Catalyst 2960X', order: 3 },
    { manufacturer: 'Cisco', name: 'ISR 4000', order: 4 },
    { manufacturer: 'Cisco', name: 'Meraki MR46', order: 5 },
    { manufacturer: 'Cisco', name: 'Meraki MS120', order: 6 },

    // Ubiquiti
    { manufacturer: 'Ubiquiti', name: 'UniFi 6 Pro', order: 1 },
    { manufacturer: 'Ubiquiti', name: 'UniFi 6 LR', order: 2 },
    { manufacturer: 'Ubiquiti', name: 'UniFi 6 Lite', order: 3 },
    { manufacturer: 'Ubiquiti', name: 'UniFi Switch Pro 24', order: 4 },
    { manufacturer: 'Ubiquiti', name: 'UniFi Switch Pro 48', order: 5 },
    { manufacturer: 'Ubiquiti', name: 'UniFi Dream Machine Pro', order: 6 },

    // Dahua
    { manufacturer: 'Dahua', name: 'IPC-HDBW2431E', order: 1 },
    { manufacturer: 'Dahua', name: 'IPC-HFW2831S', order: 2 },
    { manufacturer: 'Dahua', name: 'NVR5216-16P-4KS2E', order: 3 },

    // Hikvision
    { manufacturer: 'Hikvision', name: 'DS-2CD2143G2-I', order: 1 },
    { manufacturer: 'Hikvision', name: 'DS-2CD2683G2-IZS', order: 2 },
    { manufacturer: 'Hikvision', name: 'DS-7616NI-K2/16P', order: 3 },

    // APC
    { manufacturer: 'APC', name: 'Smart-UPS 1500VA', order: 1 },
    { manufacturer: 'APC', name: 'Smart-UPS 3000VA', order: 2 },
    { manufacturer: 'APC', name: 'NetShelter SX 42U', order: 3 },
  ];

  for (const model of assetModels) {
    const manufacturerId = manufacturerMap[model.manufacturer];
    if (manufacturerId) {
      await prisma.lookupAssetModel.upsert({
        where: {
          manufacturerId_name: {
            manufacturerId,
            name: model.name,
          },
        },
        update: { order: model.order },
        create: {
          manufacturerId,
          name: model.name,
          order: model.order,
        },
      });
    }
  }
  console.log(`✅ Asset Models: ${assetModels.length} items`);

  console.log('\n✨ Lookup tables seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding lookups:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
