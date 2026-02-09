import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding lookup tables...\n');

  // ============================================
  // Room Types
  // ============================================
  const roomTypes = [
    { name: 'Server Room', icon: 'FaServer', order: 1 },
    { name: 'Comms Room', icon: 'FaWifi', order: 2 },
    { name: 'Data Center', icon: 'FaNetworkWired', order: 3 },
    { name: 'Network Closet', icon: 'MdLan', order: 4 },
    { name: 'Office', icon: 'MdDesk', order: 5 },
    { name: 'Meeting Room', icon: 'MdMeetingRoom', order: 6 },
    { name: 'Reception', icon: 'BsReception4', order: 7 },
    { name: 'Lobby', icon: 'BsLamp', order: 8 },
    { name: 'Hallway', icon: 'MdDoorFront', order: 9 },
    { name: 'Storage', icon: 'MdStorage', order: 10 },
    { name: 'Utility Room', icon: 'FaBolt', order: 11 },
    { name: 'Guest Room', icon: 'MdBed', order: 12 },
    { name: 'Suite', icon: 'FaBed', order: 13 },
    { name: 'Restaurant', icon: 'MdRestaurant', order: 14 },
    { name: 'Bar', icon: 'MdLocalBar', order: 15 },
    { name: 'Pool Area', icon: 'MdPool', order: 16 },
    { name: 'Gym', icon: 'MdFitnessCenter', order: 17 },
    { name: 'Spa', icon: 'MdSpa', order: 18 },
    { name: 'Parking', icon: 'MdLocalParking', order: 19 },
    { name: 'Other', icon: 'MdDoorFront', order: 99 },
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
  // Asset Types
  // ============================================
  const assetTypes = [
    { name: 'Switch', icon: 'FaNetworkWired' },
    { name: 'Router', icon: 'MdRouter' },
    { name: 'Access Point', icon: 'FaWifi' },
    { name: 'Firewall', icon: 'FaShieldAlt' },
    { name: 'Server', icon: 'FaServer' },
    { name: 'IP Camera', icon: 'MdVideocam' },
    { name: 'NVR', icon: 'FaHdd' },
    { name: 'UPS', icon: 'FaBolt' },
    { name: 'Rack Cabinet', icon: 'MdStorage' },
    { name: 'Patch Panel', icon: 'MdCable' },
    { name: 'Media Converter', icon: 'MdDeviceHub' },
    { name: 'PoE Injector', icon: 'FaPlug' },
    { name: 'Antenna', icon: 'MdSettingsInputAntenna' },
    { name: 'Sensor', icon: 'MdSecurity' },
    { name: 'Controller', icon: 'FaMicrochip' },
    { name: 'Display', icon: 'MdMonitor' },
    { name: 'Printer', icon: 'FaPrint' },
    { name: 'Phone', icon: 'MdPhoneAndroid' },
    { name: 'Other', icon: 'MdDeviceHub' },
  ];

  const assetTypeMap: Record<string, string> = {};
  const assetTypeIconMap: Record<string, string> = {};

  for (const at of assetTypes) {
    const created = await prisma.assetType.upsert({
      where: { name: at.name },
      update: { icon: at.icon },
      create: at,
    });
    assetTypeMap[at.name] = created.id;
    assetTypeIconMap[at.name] = at.icon;
  }
  console.log(`✅ Asset Types: ${assetTypes.length} items`);

  // ============================================
  // Asset Models
  // ============================================
  const assetModels = [
    // Cisco
    { manufacturer: 'Cisco', name: 'Catalyst 9300', assetType: 'Switch', order: 1 },
    { manufacturer: 'Cisco', name: 'Catalyst 9200', assetType: 'Switch', order: 2 },
    { manufacturer: 'Cisco', name: 'Catalyst 2960X', assetType: 'Switch', order: 3 },
    { manufacturer: 'Cisco', name: 'ISR 4000', assetType: 'Router', order: 4 },
    { manufacturer: 'Cisco', name: 'Meraki MR46', assetType: 'Access Point', order: 5 },
    { manufacturer: 'Cisco', name: 'Meraki MS120', assetType: 'Switch', order: 6 },

    // Ubiquiti
    { manufacturer: 'Ubiquiti', name: 'UniFi 6 Pro', assetType: 'Access Point', order: 1 },
    { manufacturer: 'Ubiquiti', name: 'UniFi 6 LR', assetType: 'Access Point', order: 2 },
    { manufacturer: 'Ubiquiti', name: 'UniFi 6 Lite', assetType: 'Access Point', order: 3 },
    { manufacturer: 'Ubiquiti', name: 'UniFi Switch Pro 24', assetType: 'Switch', order: 4 },
    { manufacturer: 'Ubiquiti', name: 'UniFi Switch Pro 48', assetType: 'Switch', order: 5 },
    { manufacturer: 'Ubiquiti', name: 'UniFi Dream Machine Pro', assetType: 'Router', order: 6 },

    // Dahua
    { manufacturer: 'Dahua', name: 'IPC-HDBW2431E', assetType: 'IP Camera', order: 1 },
    { manufacturer: 'Dahua', name: 'IPC-HFW2831S', assetType: 'IP Camera', order: 2 },
    { manufacturer: 'Dahua', name: 'NVR5216-16P-4KS2E', assetType: 'NVR', order: 3 },

    // Hikvision
    { manufacturer: 'Hikvision', name: 'DS-2CD2143G2-I', assetType: 'IP Camera', order: 1 },
    { manufacturer: 'Hikvision', name: 'DS-2CD2683G2-IZS', assetType: 'IP Camera', order: 2 },
    { manufacturer: 'Hikvision', name: 'DS-7616NI-K2/16P', assetType: 'NVR', order: 3 },

    // APC
    { manufacturer: 'APC', name: 'Smart-UPS 1500VA', assetType: 'UPS', order: 1 },
    { manufacturer: 'APC', name: 'Smart-UPS 3000VA', assetType: 'UPS', order: 2 },
    { manufacturer: 'APC', name: 'NetShelter SX 42U', assetType: 'Rack Cabinet', order: 3 },
  ];

  for (const model of assetModels) {
    const manufacturerId = manufacturerMap[model.manufacturer];
    const assetTypeId = assetTypeMap[model.assetType];
    const icon = assetTypeIconMap[model.assetType];
    if (manufacturerId) {
      await prisma.lookupAssetModel.upsert({
        where: {
          manufacturerId_name: {
            manufacturerId,
            name: model.name,
          },
        },
        update: { order: model.order, assetTypeId, icon },
        create: {
          manufacturerId,
          name: model.name,
          order: model.order,
          assetTypeId,
          icon,
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
