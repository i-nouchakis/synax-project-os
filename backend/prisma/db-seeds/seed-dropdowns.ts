/**
 * Seed Dropdowns - Γεμίζει μόνο τα lookup tables για τα dropdowns
 *
 * Εκτέλεση:
 *   npx ts-node prisma/db-seeds/seed-dropdowns.ts
 *
 * Ή από το root του backend:
 *   npx ts-node --esm prisma/db-seeds/seed-dropdowns.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding dropdown tables...\n');

  // ============================================
  // 1. ROOM TYPES - Τύποι Δωματίων
  // ============================================
  const roomTypes = [
    // IT/Technical
    { name: 'Server Room', icon: 'server', order: 1 },
    { name: 'Comms Room', icon: 'router', order: 2 },
    { name: 'Data Center', icon: 'database', order: 3 },
    { name: 'Network Closet', icon: 'network', order: 4 },
    { name: 'MDF Room', icon: 'hard-drive', order: 5 },
    { name: 'IDF Room', icon: 'cable', order: 6 },
    // Office
    { name: 'Office', icon: 'briefcase', order: 10 },
    { name: 'Meeting Room', icon: 'users', order: 11 },
    { name: 'Conference Room', icon: 'presentation', order: 12 },
    { name: 'Board Room', icon: 'crown', order: 13 },
    // Common Areas
    { name: 'Reception', icon: 'door-open', order: 20 },
    { name: 'Lobby', icon: 'building', order: 21 },
    { name: 'Hallway', icon: 'move-horizontal', order: 22 },
    { name: 'Corridor', icon: 'arrow-right', order: 23 },
    { name: 'Staircase', icon: 'stairs', order: 24 },
    { name: 'Elevator', icon: 'arrow-up-down', order: 25 },
    // Hotel/Hospitality
    { name: 'Guest Room', icon: 'bed', order: 30 },
    { name: 'Suite', icon: 'home', order: 31 },
    { name: 'Presidential Suite', icon: 'star', order: 32 },
    { name: 'Restaurant', icon: 'utensils', order: 33 },
    { name: 'Bar', icon: 'wine', order: 34 },
    { name: 'Kitchen', icon: 'chef-hat', order: 35 },
    { name: 'Dining Area', icon: 'utensils-crossed', order: 36 },
    // Amenities
    { name: 'Pool Area', icon: 'waves', order: 40 },
    { name: 'Gym', icon: 'dumbbell', order: 41 },
    { name: 'Spa', icon: 'sparkles', order: 42 },
    { name: 'Sauna', icon: 'thermometer', order: 43 },
    { name: 'Fitness Center', icon: 'heart-pulse', order: 44 },
    // Utility
    { name: 'Storage', icon: 'archive', order: 50 },
    { name: 'Utility Room', icon: 'wrench', order: 51 },
    { name: 'Electrical Room', icon: 'zap', order: 52 },
    { name: 'Mechanical Room', icon: 'cog', order: 53 },
    { name: 'Janitor Closet', icon: 'spray-can', order: 54 },
    { name: 'Laundry', icon: 'shirt', order: 55 },
    // Outdoor
    { name: 'Parking', icon: 'car', order: 60 },
    { name: 'Garage', icon: 'warehouse', order: 61 },
    { name: 'Loading Dock', icon: 'truck', order: 62 },
    { name: 'Terrace', icon: 'sun', order: 63 },
    { name: 'Balcony', icon: 'fence', order: 64 },
    { name: 'Garden', icon: 'flower', order: 65 },
    { name: 'Rooftop', icon: 'cloud', order: 66 },
    // Security
    { name: 'Security Room', icon: 'shield', order: 70 },
    { name: 'Guard Station', icon: 'user-shield', order: 71 },
    // Other
    { name: 'Bathroom', icon: 'bath', order: 80 },
    { name: 'Restroom', icon: 'door-closed', order: 81 },
    { name: 'Break Room', icon: 'coffee', order: 82 },
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
  // 2. INVENTORY UNITS - Μονάδες Μέτρησης
  // ============================================
  const inventoryUnits = [
    // Count
    { name: 'Pieces', abbreviation: 'pcs', order: 1 },
    { name: 'Units', abbreviation: 'units', order: 2 },
    { name: 'Items', abbreviation: 'items', order: 3 },
    // Length
    { name: 'Meters', abbreviation: 'm', order: 10 },
    { name: 'Centimeters', abbreviation: 'cm', order: 11 },
    { name: 'Kilometers', abbreviation: 'km', order: 12 },
    { name: 'Feet', abbreviation: 'ft', order: 13 },
    { name: 'Inches', abbreviation: 'in', order: 14 },
    { name: 'Yards', abbreviation: 'yd', order: 15 },
    // Packaging
    { name: 'Boxes', abbreviation: 'box', order: 20 },
    { name: 'Cartons', abbreviation: 'carton', order: 21 },
    { name: 'Cases', abbreviation: 'case', order: 22 },
    { name: 'Packs', abbreviation: 'pack', order: 23 },
    { name: 'Pallets', abbreviation: 'pallet', order: 24 },
    // Cable specific
    { name: 'Rolls', abbreviation: 'roll', order: 30 },
    { name: 'Spools', abbreviation: 'spool', order: 31 },
    { name: 'Bundles', abbreviation: 'bundle', order: 32 },
    { name: 'Coils', abbreviation: 'coil', order: 33 },
    // Groups
    { name: 'Pairs', abbreviation: 'pair', order: 40 },
    { name: 'Sets', abbreviation: 'set', order: 41 },
    { name: 'Kits', abbreviation: 'kit', order: 42 },
    // Weight
    { name: 'Kilograms', abbreviation: 'kg', order: 50 },
    { name: 'Grams', abbreviation: 'g', order: 51 },
    { name: 'Pounds', abbreviation: 'lb', order: 52 },
    // Volume
    { name: 'Liters', abbreviation: 'L', order: 60 },
    { name: 'Milliliters', abbreviation: 'mL', order: 61 },
    { name: 'Gallons', abbreviation: 'gal', order: 62 },
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
  // 3. ISSUE CAUSES - Αιτίες Προβλημάτων
  // ============================================
  const issueCauses = [
    // Internal
    { name: 'Internal Team', order: 1 },
    { name: 'Design Error', order: 2 },
    { name: 'Installation Error', order: 3 },
    { name: 'Configuration Error', order: 4 },
    // Contractors
    { name: 'Electrical Contractor', order: 10 },
    { name: 'HVAC Contractor', order: 11 },
    { name: 'Plumbing Contractor', order: 12 },
    { name: 'Security Contractor', order: 13 },
    { name: 'Network Contractor', order: 14 },
    { name: 'General Contractor', order: 15 },
    { name: 'Cabling Contractor', order: 16 },
    // External
    { name: 'Telecom Provider', order: 20 },
    { name: 'ISP Provider', order: 21 },
    { name: 'Third Party Vendor', order: 22 },
    { name: 'Equipment Manufacturer', order: 23 },
    { name: 'Software Vendor', order: 24 },
    // Client
    { name: 'Client / Owner', order: 30 },
    { name: 'End User', order: 31 },
    // Materials
    { name: 'Material Defect', order: 40 },
    { name: 'Equipment Failure', order: 41 },
    { name: 'Compatibility Issue', order: 42 },
    // External Factors
    { name: 'Weather / Force Majeure', order: 50 },
    { name: 'Power Outage', order: 51 },
    { name: 'Network Outage', order: 52 },
    // Other
    { name: 'Pending Investigation', order: 90 },
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
  // 4. MANUFACTURERS - Κατασκευαστές
  // ============================================
  const manufacturers = [
    // Networking - Enterprise
    { name: 'Cisco', website: 'https://www.cisco.com', order: 1 },
    { name: 'Juniper', website: 'https://www.juniper.net', order: 2 },
    { name: 'Aruba (HPE)', website: 'https://www.arubanetworks.com', order: 3 },
    { name: 'Fortinet', website: 'https://www.fortinet.com', order: 4 },
    { name: 'Palo Alto', website: 'https://www.paloaltonetworks.com', order: 5 },
    // Networking - SMB/Prosumer
    { name: 'Ubiquiti', website: 'https://www.ui.com', order: 10 },
    { name: 'MikroTik', website: 'https://mikrotik.com', order: 11 },
    { name: 'TP-Link', website: 'https://www.tp-link.com', order: 12 },
    { name: 'Netgear', website: 'https://www.netgear.com', order: 13 },
    { name: 'D-Link', website: 'https://www.dlink.com', order: 14 },
    { name: 'Zyxel', website: 'https://www.zyxel.com', order: 15 },
    // CCTV/Security
    { name: 'Hikvision', website: 'https://www.hikvision.com', order: 20 },
    { name: 'Dahua', website: 'https://www.dahuasecurity.com', order: 21 },
    { name: 'Axis', website: 'https://www.axis.com', order: 22 },
    { name: 'Hanwha (Samsung Techwin)', website: 'https://www.hanwhasecurity.com', order: 23 },
    { name: 'Vivotek', website: 'https://www.vivotek.com', order: 24 },
    { name: 'Bosch Security', website: 'https://www.boschsecurity.com', order: 25 },
    { name: 'Uniview', website: 'https://www.uniview.com', order: 26 },
    // Power/UPS
    { name: 'APC', website: 'https://www.apc.com', order: 30 },
    { name: 'Eaton', website: 'https://www.eaton.com', order: 31 },
    { name: 'CyberPower', website: 'https://www.cyberpowersystems.com', order: 32 },
    { name: 'Vertiv (Liebert)', website: 'https://www.vertiv.com', order: 33 },
    { name: 'Tripp Lite', website: 'https://www.tripplite.com', order: 34 },
    // Structured Cabling
    { name: 'CommScope', website: 'https://www.commscope.com', order: 40 },
    { name: 'Panduit', website: 'https://www.panduit.com', order: 41 },
    { name: 'Leviton', website: 'https://www.leviton.com', order: 42 },
    { name: 'Belden', website: 'https://www.belden.com', order: 43 },
    { name: 'Corning', website: 'https://www.corning.com', order: 44 },
    { name: 'Legrand', website: 'https://www.legrand.com', order: 45 },
    { name: 'Nexans', website: 'https://www.nexans.com', order: 46 },
    // Consumer Electronics
    { name: 'Samsung', website: 'https://www.samsung.com', order: 50 },
    { name: 'LG', website: 'https://www.lg.com', order: 51 },
    { name: 'Sony', website: 'https://www.sony.com', order: 52 },
    { name: 'Panasonic', website: 'https://www.panasonic.com', order: 53 },
    { name: 'Philips', website: 'https://www.philips.com', order: 54 },
    // VoIP/Telephony
    { name: 'Yealink', website: 'https://www.yealink.com', order: 60 },
    { name: 'Poly (Polycom)', website: 'https://www.poly.com', order: 61 },
    { name: 'Grandstream', website: 'https://www.grandstream.com', order: 62 },
    { name: 'Fanvil', website: 'https://www.fanvil.com', order: 63 },
    { name: 'Snom', website: 'https://www.snom.com', order: 64 },
    // Racks & Enclosures
    { name: 'Rittal', website: 'https://www.rittal.com', order: 70 },
    { name: 'Schneider Electric', website: 'https://www.se.com', order: 71 },
    { name: 'Chatsworth (CPI)', website: 'https://www.chatsworth.com', order: 72 },
    { name: 'Great Lakes', website: 'https://www.greatlakescaseworks.com', order: 73 },
    // Other
    { name: 'Generic', order: 98 },
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
  // 5. ASSET TYPES - Τύποι Εξοπλισμού
  // ============================================
  const assetTypes = [
    // Networking
    {
      name: 'Access Point',
      icon: 'wifi',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount AP securely', 'Connect PoE cable', 'Verify LED status', 'Configure SSID', 'Test wireless coverage'] },
        { type: 'TESTING', items: ['Speed test', 'Signal strength check', 'Roaming test', 'Channel interference check'] },
      ],
    },
    {
      name: 'Network Switch',
      icon: 'network',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Rack mount switch', 'Connect uplink', 'Connect power', 'Verify port LEDs', 'Label ports'] },
        { type: 'TESTING', items: ['Port connectivity test', 'VLAN verification', 'PoE test', 'Spanning tree check'] },
      ],
    },
    {
      name: 'Router',
      icon: 'router',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Rack mount router', 'Connect WAN', 'Connect LAN', 'Power on', 'Initial configuration'] },
        { type: 'TESTING', items: ['Internet connectivity', 'Routing table check', 'Firewall rules test', 'VPN test'] },
      ],
    },
    {
      name: 'Firewall',
      icon: 'shield',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Rack mount', 'Connect interfaces', 'Initial config', 'License activation'] },
        { type: 'TESTING', items: ['Rule verification', 'NAT test', 'VPN connectivity', 'Logging check'] },
      ],
    },
    // CCTV
    {
      name: 'IP Camera',
      icon: 'camera',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount camera', 'Adjust angle', 'Connect PoE cable', 'Weatherproof connections', 'Add to NVR'] },
        { type: 'TESTING', items: ['Image quality check', 'Night vision test', 'Motion detection', 'Recording verification'] },
      ],
    },
    {
      name: 'PTZ Camera',
      icon: 'video',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount camera', 'Connect PoE cable', 'Configure presets', 'Set patrol routes', 'Add to NVR'] },
        { type: 'TESTING', items: ['Pan/Tilt/Zoom test', 'Preset positions', 'Auto-tracking test', 'Image quality'] },
      ],
    },
    {
      name: 'NVR',
      icon: 'hard-drive',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Rack mount NVR', 'Install HDDs', 'Connect network', 'Power on', 'Initial setup'] },
        { type: 'TESTING', items: ['Camera discovery', 'Recording test', 'Playback test', 'Remote access test', 'Storage health'] },
      ],
    },
    // Power
    {
      name: 'UPS',
      icon: 'plug',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Position UPS', 'Connect input power', 'Connect equipment', 'Configure alerts', 'Test battery'] },
        { type: 'TESTING', items: ['Load test', 'Battery runtime test', 'Failover test', 'Alert notifications'] },
      ],
    },
    {
      name: 'PDU',
      icon: 'power',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount PDU', 'Connect input', 'Label outlets', 'Configure monitoring'] },
        { type: 'TESTING', items: ['Outlet test', 'Load monitoring', 'Remote management test'] },
      ],
    },
    // Structured Cabling
    {
      name: 'Patch Panel',
      icon: 'server',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount patch panel', 'Punch down cables', 'Test terminations', 'Label ports', 'Install cable management'] },
        { type: 'TESTING', items: ['Continuity test', 'Certification test', 'Document results'] },
      ],
    },
    {
      name: 'Fiber Patch Panel',
      icon: 'cable',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount panel', 'Splice/terminate fibers', 'Clean connectors', 'Label ports'] },
        { type: 'TESTING', items: ['OTDR test', 'Light level test', 'Document results'] },
      ],
    },
    // Display
    {
      name: 'TV Display',
      icon: 'monitor',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount TV', 'Connect HDMI/Network', 'Power on', 'Configure display settings', 'Install signage software'] },
        { type: 'TESTING', items: ['Picture quality', 'Content playback', 'Remote management'] },
      ],
    },
    {
      name: 'Digital Signage',
      icon: 'presentation',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Mount display', 'Connect media player', 'Network connection', 'Content setup'] },
        { type: 'TESTING', items: ['Content display', 'Scheduling test', 'Remote update test'] },
      ],
    },
    // VoIP
    {
      name: 'VoIP Phone',
      icon: 'phone',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Place phone', 'Connect PoE cable', 'Provision extension', 'Configure features'] },
        { type: 'TESTING', items: ['Dial tone test', 'Inbound/outbound calls', 'Voicemail test', 'Directory access'] },
      ],
    },
    // Other
    {
      name: 'Server',
      icon: 'server',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Rack mount', 'Connect power (redundant)', 'Connect network', 'Connect KVM/iLO', 'Initial OS setup'] },
        { type: 'TESTING', items: ['POST check', 'RAID verification', 'Network connectivity', 'Remote management'] },
      ],
    },
    {
      name: 'Rack Cabinet',
      icon: 'box',
      checklistTemplate: [
        { type: 'INSTALLATION', items: ['Position rack', 'Level and secure', 'Install rails', 'Cable management', 'Grounding'] },
        { type: 'TESTING', items: ['Stability check', 'Door operation', 'Ventilation check'] },
      ],
    },
  ];

  const assetTypeMap: Record<string, string> = {};

  for (const at of assetTypes) {
    const created = await prisma.assetType.upsert({
      where: { name: at.name },
      update: { icon: at.icon, checklistTemplate: at.checklistTemplate },
      create: {
        name: at.name,
        icon: at.icon,
        checklistTemplate: at.checklistTemplate,
      },
    });
    assetTypeMap[at.name] = created.id;
  }
  console.log(`✅ Asset Types: ${assetTypes.length} items`);

  // ============================================
  // 6. ASSET MODELS - Μοντέλα Εξοπλισμού
  // ============================================
  const assetModels = [
    // Cisco - Access Points
    { manufacturer: 'Cisco', name: 'Meraki MR46', icon: 'wifi', assetType: 'Access Point', order: 1 },
    { manufacturer: 'Cisco', name: 'Meraki MR36', icon: 'wifi', assetType: 'Access Point', order: 2 },
    { manufacturer: 'Cisco', name: 'Meraki MR56', icon: 'wifi', assetType: 'Access Point', order: 3 },
    { manufacturer: 'Cisco', name: 'Catalyst 9120AXI', icon: 'wifi', assetType: 'Access Point', order: 4 },
    // Cisco - Switches
    { manufacturer: 'Cisco', name: 'Catalyst 9300-48P', icon: 'network', assetType: 'Network Switch', order: 1 },
    { manufacturer: 'Cisco', name: 'Catalyst 9200-24P', icon: 'network', assetType: 'Network Switch', order: 2 },
    { manufacturer: 'Cisco', name: 'CBS350-24P', icon: 'network', assetType: 'Network Switch', order: 3 },
    { manufacturer: 'Cisco', name: 'CBS250-8P', icon: 'network', assetType: 'Network Switch', order: 4 },
    // Cisco - Routers
    { manufacturer: 'Cisco', name: 'ISR 4451-X', icon: 'router', assetType: 'Router', order: 1 },
    { manufacturer: 'Cisco', name: 'ISR 4331', icon: 'router', assetType: 'Router', order: 2 },
    { manufacturer: 'Cisco', name: 'ISR 1100-4G', icon: 'router', assetType: 'Router', order: 3 },

    // Ubiquiti - Access Points
    { manufacturer: 'Ubiquiti', name: 'UniFi U7 Pro', icon: 'wifi', assetType: 'Access Point', order: 1 },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Pro', icon: 'wifi', assetType: 'Access Point', order: 2 },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 LR', icon: 'wifi', assetType: 'Access Point', order: 3 },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Lite', icon: 'wifi', assetType: 'Access Point', order: 4 },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Mesh', icon: 'wifi', assetType: 'Access Point', order: 5 },
    // Ubiquiti - Switches
    { manufacturer: 'Ubiquiti', name: 'USW-Pro-24-PoE', icon: 'network', assetType: 'Network Switch', order: 1 },
    { manufacturer: 'Ubiquiti', name: 'USW-Pro-48-PoE', icon: 'network', assetType: 'Network Switch', order: 2 },
    { manufacturer: 'Ubiquiti', name: 'USW-Lite-16-PoE', icon: 'network', assetType: 'Network Switch', order: 3 },
    { manufacturer: 'Ubiquiti', name: 'USW-Lite-8-PoE', icon: 'network', assetType: 'Network Switch', order: 4 },
    // Ubiquiti - Routers
    { manufacturer: 'Ubiquiti', name: 'Dream Machine Pro Max', icon: 'router', assetType: 'Router', order: 1 },
    { manufacturer: 'Ubiquiti', name: 'Dream Machine Pro', icon: 'router', assetType: 'Router', order: 2 },
    { manufacturer: 'Ubiquiti', name: 'Dream Router', icon: 'router', assetType: 'Router', order: 3 },

    // Aruba - Access Points
    { manufacturer: 'Aruba (HPE)', name: 'AP-635', icon: 'wifi', assetType: 'Access Point', order: 1 },
    { manufacturer: 'Aruba (HPE)', name: 'AP-535', icon: 'wifi', assetType: 'Access Point', order: 2 },
    { manufacturer: 'Aruba (HPE)', name: 'AP-515', icon: 'wifi', assetType: 'Access Point', order: 3 },
    { manufacturer: 'Aruba (HPE)', name: 'AP-505', icon: 'wifi', assetType: 'Access Point', order: 4 },

    // MikroTik
    { manufacturer: 'MikroTik', name: 'CCR2004-1G-12S+2XS', icon: 'router', assetType: 'Router', order: 1 },
    { manufacturer: 'MikroTik', name: 'CCR2116-12G-4S+', icon: 'router', assetType: 'Router', order: 2 },
    { manufacturer: 'MikroTik', name: 'CRS326-24G-2S+', icon: 'network', assetType: 'Network Switch', order: 1 },
    { manufacturer: 'MikroTik', name: 'CRS354-48G-4S+2Q+', icon: 'network', assetType: 'Network Switch', order: 2 },
    { manufacturer: 'MikroTik', name: 'cAP ax', icon: 'wifi', assetType: 'Access Point', order: 1 },

    // Hikvision - Cameras
    { manufacturer: 'Hikvision', name: 'DS-2CD2143G2-I', icon: 'camera', assetType: 'IP Camera', order: 1 },
    { manufacturer: 'Hikvision', name: 'DS-2CD2386G2-IU', icon: 'camera', assetType: 'IP Camera', order: 2 },
    { manufacturer: 'Hikvision', name: 'DS-2CD2T47G2-L', icon: 'camera', assetType: 'IP Camera', order: 3 },
    { manufacturer: 'Hikvision', name: 'DS-2CD2683G2-IZS', icon: 'camera', assetType: 'IP Camera', order: 4 },
    { manufacturer: 'Hikvision', name: 'DS-2DE4425IW-DE', icon: 'video', assetType: 'PTZ Camera', order: 1 },
    { manufacturer: 'Hikvision', name: 'DS-2DE7A432IW-AEB', icon: 'video', assetType: 'PTZ Camera', order: 2 },
    // Hikvision - NVR
    { manufacturer: 'Hikvision', name: 'DS-7616NI-K2/16P', icon: 'hard-drive', assetType: 'NVR', order: 1 },
    { manufacturer: 'Hikvision', name: 'DS-7732NI-K4/16P', icon: 'hard-drive', assetType: 'NVR', order: 2 },
    { manufacturer: 'Hikvision', name: 'DS-9664NI-M8', icon: 'hard-drive', assetType: 'NVR', order: 3 },

    // Dahua - Cameras
    { manufacturer: 'Dahua', name: 'IPC-HDBW2431E-S', icon: 'camera', assetType: 'IP Camera', order: 1 },
    { manufacturer: 'Dahua', name: 'IPC-HFW2831S-S', icon: 'camera', assetType: 'IP Camera', order: 2 },
    { manufacturer: 'Dahua', name: 'IPC-HDW3849H-AS-PV', icon: 'camera', assetType: 'IP Camera', order: 3 },
    { manufacturer: 'Dahua', name: 'SD6AL245XA-HNR', icon: 'video', assetType: 'PTZ Camera', order: 1 },
    // Dahua - NVR
    { manufacturer: 'Dahua', name: 'NVR5216-16P-4KS2E', icon: 'hard-drive', assetType: 'NVR', order: 1 },
    { manufacturer: 'Dahua', name: 'NVR5432-16P-4KS2E', icon: 'hard-drive', assetType: 'NVR', order: 2 },

    // APC - UPS
    { manufacturer: 'APC', name: 'Smart-UPS 750VA', icon: 'plug', assetType: 'UPS', order: 1 },
    { manufacturer: 'APC', name: 'Smart-UPS 1500VA', icon: 'plug', assetType: 'UPS', order: 2 },
    { manufacturer: 'APC', name: 'Smart-UPS 2200VA', icon: 'plug', assetType: 'UPS', order: 3 },
    { manufacturer: 'APC', name: 'Smart-UPS 3000VA', icon: 'plug', assetType: 'UPS', order: 4 },
    { manufacturer: 'APC', name: 'Smart-UPS 5000VA', icon: 'plug', assetType: 'UPS', order: 5 },
    { manufacturer: 'APC', name: 'Smart-UPS SRT 10kVA', icon: 'plug', assetType: 'UPS', order: 6 },

    // Eaton - UPS
    { manufacturer: 'Eaton', name: '5P 1500VA', icon: 'plug', assetType: 'UPS', order: 1 },
    { manufacturer: 'Eaton', name: '5PX 2200VA', icon: 'plug', assetType: 'UPS', order: 2 },
    { manufacturer: 'Eaton', name: '9PX 3000VA', icon: 'plug', assetType: 'UPS', order: 3 },

    // Panduit - Patch Panels
    { manufacturer: 'Panduit', name: 'CP24BLY', icon: 'server', assetType: 'Patch Panel', order: 1 },
    { manufacturer: 'Panduit', name: 'CP48BLY', icon: 'server', assetType: 'Patch Panel', order: 2 },
    { manufacturer: 'Panduit', name: 'CFPL4SY', icon: 'cable', assetType: 'Fiber Patch Panel', order: 1 },

    // CommScope - Patch Panels
    { manufacturer: 'CommScope', name: ' 760237319', icon: 'server', assetType: 'Patch Panel', order: 1 },
    { manufacturer: 'CommScope', name: '360G2-1U-24', icon: 'server', assetType: 'Patch Panel', order: 2 },

    // Samsung - TV
    { manufacturer: 'Samsung', name: 'HG55AU800', icon: 'monitor', assetType: 'TV Display', order: 1 },
    { manufacturer: 'Samsung', name: 'HG65AU800', icon: 'monitor', assetType: 'TV Display', order: 2 },
    { manufacturer: 'Samsung', name: 'QM55R', icon: 'monitor', assetType: 'TV Display', order: 3 },
    { manufacturer: 'Samsung', name: 'QM65R', icon: 'monitor', assetType: 'TV Display', order: 4 },

    // LG - TV
    { manufacturer: 'LG', name: '55UN73006LA', icon: 'monitor', assetType: 'TV Display', order: 1 },
    { manufacturer: 'LG', name: '65UN73006LA', icon: 'monitor', assetType: 'TV Display', order: 2 },
    { manufacturer: 'LG', name: '55UM7600PLB', icon: 'monitor', assetType: 'TV Display', order: 3 },

    // Yealink - Phones
    { manufacturer: 'Yealink', name: 'T54W', icon: 'phone', assetType: 'VoIP Phone', order: 1 },
    { manufacturer: 'Yealink', name: 'T53W', icon: 'phone', assetType: 'VoIP Phone', order: 2 },
    { manufacturer: 'Yealink', name: 'T46U', icon: 'phone', assetType: 'VoIP Phone', order: 3 },
    { manufacturer: 'Yealink', name: 'T33G', icon: 'phone', assetType: 'VoIP Phone', order: 4 },

    // Grandstream - Phones
    { manufacturer: 'Grandstream', name: 'GRP2615', icon: 'phone', assetType: 'VoIP Phone', order: 1 },
    { manufacturer: 'Grandstream', name: 'GRP2613', icon: 'phone', assetType: 'VoIP Phone', order: 2 },
    { manufacturer: 'Grandstream', name: 'GXP2170', icon: 'phone', assetType: 'VoIP Phone', order: 3 },
  ];

  for (const model of assetModels) {
    const manufacturerId = manufacturerMap[model.manufacturer];
    const assetTypeId = model.assetType ? assetTypeMap[model.assetType] : undefined;

    if (manufacturerId) {
      await prisma.lookupAssetModel.upsert({
        where: {
          manufacturerId_name: {
            manufacturerId,
            name: model.name,
          },
        },
        update: {
          icon: model.icon,
          order: model.order,
          assetTypeId: assetTypeId || null,
        },
        create: {
          manufacturerId,
          name: model.name,
          icon: model.icon,
          order: model.order,
          assetTypeId: assetTypeId || null,
        },
      });
    }
  }
  console.log(`✅ Asset Models: ${assetModels.length} items`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`   Room Types:      ${roomTypes.length}`);
  console.log(`   Inventory Units: ${inventoryUnits.length}`);
  console.log(`   Issue Causes:    ${issueCauses.length}`);
  console.log(`   Manufacturers:   ${manufacturers.length}`);
  console.log(`   Asset Types:     ${assetTypes.length}`);
  console.log(`   Asset Models:    ${assetModels.length}`);
  console.log('='.repeat(50));
  console.log('\n✨ All dropdown tables seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding dropdowns:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
