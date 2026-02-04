import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing database...');

  // Delete in correct order (respecting foreign keys)
  await prisma.checklistPhoto.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.checklistTemplateItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.issueComment.deleteMany();
  await prisma.issuePhoto.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lookupAssetModel.deleteMany();
  await prisma.lookupManufacturer.deleteMany();
  await prisma.lookupRoomType.deleteMany();
  await prisma.lookupInventoryUnit.deleteMany();
  await prisma.lookupIssueCause.deleteMany();
  await prisma.assetType.deleteMany();

  console.log('✅ Database cleared');

  // ============================================
  // USERS
  // ============================================
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const techPassword = await bcrypt.hash('tech123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@synax.gr',
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'pm@synax.gr',
      passwordHash: await bcrypt.hash('pm123456', 10),
      name: 'Γιώργος Παπαδόπουλος',
      role: 'PM',
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'maria@synax.gr',
      passwordHash: techPassword,
      name: 'Μαρία Αντωνίου',
      role: 'PM',
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      email: 'tech1@synax.gr',
      passwordHash: techPassword,
      name: 'Νίκος Δημητρίου',
      role: 'TECHNICIAN',
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      email: 'tech2@synax.gr',
      passwordHash: techPassword,
      name: 'Κώστας Ιωάννου',
      role: 'TECHNICIAN',
    },
  });

  const tech3 = await prisma.user.create({
    data: {
      email: 'tech3@synax.gr',
      passwordHash: techPassword,
      name: 'Αλέξανδρος Νικολάου',
      role: 'TECHNICIAN',
    },
  });

  await prisma.user.create({
    data: {
      email: 'client@example.com',
      passwordHash: techPassword,
      name: 'Πελάτης Demo',
      role: 'CLIENT',
    },
  });

  console.log('✅ Users created');

  // ============================================
  // LOOKUPS - ROOM TYPES
  // ============================================
  console.log('🏷️  Creating room types...');
  const roomTypes = [
    'Guest Room', 'Suite', 'Conference Room', 'Server Room', 'Reception',
    'Restaurant', 'Bar', 'Kitchen', 'Storage', 'Office',
    'Gym', 'Spa', 'Pool Area', 'Parking', 'Lobby',
    'Corridor', 'Elevator Area', 'Bathroom', 'Laundry', 'Staff Room',
  ];

  for (let i = 0; i < roomTypes.length; i++) {
    await prisma.lookupRoomType.create({
      data: { name: roomTypes[i], order: i },
    });
  }
  console.log('✅ Room types created');

  // ============================================
  // LOOKUPS - INVENTORY UNITS
  // ============================================
  console.log('📦 Creating inventory units...');
  const inventoryUnits = [
    { name: 'Pieces', abbreviation: 'pcs' },
    { name: 'Meters', abbreviation: 'm' },
    { name: 'Boxes', abbreviation: 'box' },
    { name: 'Rolls', abbreviation: 'roll' },
    { name: 'Packs', abbreviation: 'pack' },
    { name: 'Kilograms', abbreviation: 'kg' },
    { name: 'Liters', abbreviation: 'L' },
    { name: 'Sets', abbreviation: 'set' },
    { name: 'Pairs', abbreviation: 'pair' },
    { name: 'Bundles', abbreviation: 'bundle' },
  ];

  for (let i = 0; i < inventoryUnits.length; i++) {
    await prisma.lookupInventoryUnit.create({
      data: { ...inventoryUnits[i], order: i },
    });
  }
  console.log('✅ Inventory units created');

  // ============================================
  // LOOKUPS - ISSUE CAUSES
  // ============================================
  console.log('⚠️  Creating issue causes...');
  const issueCauses = [
    'Defective Equipment', 'Installation Error', 'Configuration Issue',
    'Network Problem', 'Power Issue', 'Physical Damage',
    'Software Bug', 'Compatibility Issue', 'Environmental Factor',
    'User Error', 'Documentation Missing', 'Vendor Delay',
  ];

  for (let i = 0; i < issueCauses.length; i++) {
    await prisma.lookupIssueCause.create({
      data: { name: issueCauses[i], order: i },
    });
  }
  console.log('✅ Issue causes created');

  // ============================================
  // ASSET TYPES
  // ============================================
  console.log('🔧 Creating asset types...');
  const assetTypesData = [
    { name: 'Access Point', icon: 'wifi' },
    { name: 'Network Switch', icon: 'network' },
    { name: 'IP Camera', icon: 'camera' },
    { name: 'Router', icon: 'router' },
    { name: 'Server', icon: 'server' },
    { name: 'UPS', icon: 'battery' },
    { name: 'Smart TV', icon: 'tv' },
    { name: 'VoIP Phone', icon: 'phone' },
    { name: 'POS Terminal', icon: 'creditcard' },
    { name: 'Digital Signage', icon: 'monitor' },
    { name: 'Patch Panel', icon: 'grid' },
    { name: 'NVR/DVR', icon: 'harddrive' },
    { name: 'Controller', icon: 'cpu' },
    { name: 'Sensor', icon: 'activity' },
    { name: 'Thermostat', icon: 'thermometer' },
  ];

  const assetTypes: Record<string, { id: string; name: string }> = {};
  for (const at of assetTypesData) {
    assetTypes[at.name] = await prisma.assetType.create({ data: at });
  }
  console.log('✅ Asset types created');

  // ============================================
  // MANUFACTURERS
  // ============================================
  console.log('🏭 Creating manufacturers...');
  const manufacturersData = [
    { name: 'Cisco', website: 'https://cisco.com' },
    { name: 'Ubiquiti', website: 'https://ui.com' },
    { name: 'Aruba', website: 'https://arubanetworks.com' },
    { name: 'MikroTik', website: 'https://mikrotik.com' },
    { name: 'TP-Link', website: 'https://tp-link.com' },
    { name: 'Netgear', website: 'https://netgear.com' },
    { name: 'Hikvision', website: 'https://hikvision.com' },
    { name: 'Dahua', website: 'https://dahuasecurity.com' },
    { name: 'Axis', website: 'https://axis.com' },
    { name: 'Samsung', website: 'https://samsung.com' },
    { name: 'LG', website: 'https://lg.com' },
    { name: 'APC', website: 'https://apc.com' },
    { name: 'Eaton', website: 'https://eaton.com' },
    { name: 'Dell', website: 'https://dell.com' },
    { name: 'HP', website: 'https://hp.com' },
    { name: 'Juniper', website: 'https://juniper.net' },
    { name: 'Fortinet', website: 'https://fortinet.com' },
    { name: 'Ruckus', website: 'https://ruckuswireless.com' },
  ];

  const manufacturers: Record<string, { id: string; name: string }> = {};
  for (let i = 0; i < manufacturersData.length; i++) {
    manufacturers[manufacturersData[i].name] = await prisma.lookupManufacturer.create({
      data: { ...manufacturersData[i], order: i },
    });
  }
  console.log('✅ Manufacturers created');

  // ============================================
  // ASSET MODELS
  // ============================================
  console.log('📱 Creating asset models...');
  const modelsData = [
    // Cisco
    { manufacturer: 'Cisco', name: 'Catalyst 9200', assetType: 'Network Switch' },
    { manufacturer: 'Cisco', name: 'Catalyst 9300', assetType: 'Network Switch' },
    { manufacturer: 'Cisco', name: 'Meraki MR46', assetType: 'Access Point' },
    { manufacturer: 'Cisco', name: 'ISR 4331', assetType: 'Router' },
    // Ubiquiti
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Pro', assetType: 'Access Point' },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Enterprise', assetType: 'Access Point' },
    { manufacturer: 'Ubiquiti', name: 'USW-Pro-48-PoE', assetType: 'Network Switch' },
    { manufacturer: 'Ubiquiti', name: 'USW-Pro-24-PoE', assetType: 'Network Switch' },
    { manufacturer: 'Ubiquiti', name: 'UDM Pro', assetType: 'Router' },
    { manufacturer: 'Ubiquiti', name: 'G4 Bullet', assetType: 'IP Camera' },
    { manufacturer: 'Ubiquiti', name: 'G4 Dome', assetType: 'IP Camera' },
    // Aruba
    { manufacturer: 'Aruba', name: 'AP-515', assetType: 'Access Point' },
    { manufacturer: 'Aruba', name: 'AP-635', assetType: 'Access Point' },
    { manufacturer: 'Aruba', name: 'CX 6300', assetType: 'Network Switch' },
    // MikroTik
    { manufacturer: 'MikroTik', name: 'CRS326-24G-2S+', assetType: 'Network Switch' },
    { manufacturer: 'MikroTik', name: 'hAP ax3', assetType: 'Access Point' },
    { manufacturer: 'MikroTik', name: 'CCR2004', assetType: 'Router' },
    // TP-Link
    { manufacturer: 'TP-Link', name: 'EAP670', assetType: 'Access Point' },
    { manufacturer: 'TP-Link', name: 'TL-SG3428XMP', assetType: 'Network Switch' },
    // Hikvision
    { manufacturer: 'Hikvision', name: 'DS-2CD2143G2-I', assetType: 'IP Camera' },
    { manufacturer: 'Hikvision', name: 'DS-2CD2183G2-I', assetType: 'IP Camera' },
    { manufacturer: 'Hikvision', name: 'DS-7616NI-K2', assetType: 'NVR/DVR' },
    // Dahua
    { manufacturer: 'Dahua', name: 'IPC-HDBW2431E', assetType: 'IP Camera' },
    { manufacturer: 'Dahua', name: 'NVR4216-16P-4KS2', assetType: 'NVR/DVR' },
    // Samsung
    { manufacturer: 'Samsung', name: 'QE55Q80B', assetType: 'Smart TV' },
    { manufacturer: 'Samsung', name: 'HG43AU800', assetType: 'Smart TV' },
    // LG
    { manufacturer: 'LG', name: '55UQ751C', assetType: 'Smart TV' },
    { manufacturer: 'LG', name: '65UR640S', assetType: 'Digital Signage' },
    // APC
    { manufacturer: 'APC', name: 'Smart-UPS 1500', assetType: 'UPS' },
    { manufacturer: 'APC', name: 'Smart-UPS 3000', assetType: 'UPS' },
    // Dell
    { manufacturer: 'Dell', name: 'PowerEdge R650', assetType: 'Server' },
    { manufacturer: 'Dell', name: 'PowerEdge R750', assetType: 'Server' },
    // HP
    { manufacturer: 'HP', name: 'ProLiant DL380 Gen10', assetType: 'Server' },
  ];

  for (const model of modelsData) {
    await prisma.lookupAssetModel.create({
      data: {
        manufacturerId: manufacturers[model.manufacturer].id,
        name: model.name,
        assetTypeId: assetTypes[model.assetType]?.id,
      },
    });
  }
  console.log('✅ Asset models created');

  // ============================================
  // CHECKLIST TEMPLATES
  // ============================================
  console.log('📋 Creating checklist templates...');

  const templates = [
    {
      name: 'Access Point Installation',
      description: 'Standard checklist for AP installation',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Access Point'].id,
      isDefault: true,
      items: [
        { name: 'Verify mounting location', requiresPhoto: true },
        { name: 'Check PoE power delivery', requiresPhoto: false },
        { name: 'Connect ethernet cable', requiresPhoto: false },
        { name: 'Verify LED status', requiresPhoto: true },
        { name: 'Test wireless connectivity', requiresPhoto: false },
        { name: 'Configure SSID', requiresPhoto: false },
        { name: 'Test roaming between APs', requiresPhoto: false },
        { name: 'Document final placement', requiresPhoto: true },
      ],
    },
    {
      name: 'Network Switch Setup',
      description: 'Configuration checklist for network switches',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Network Switch'].id,
      isDefault: true,
      items: [
        { name: 'Rack mount switch', requiresPhoto: true },
        { name: 'Connect power cables', requiresPhoto: false },
        { name: 'Connect uplink ports', requiresPhoto: true },
        { name: 'Configure management IP', requiresPhoto: false },
        { name: 'Set VLANs', requiresPhoto: false },
        { name: 'Enable PoE on required ports', requiresPhoto: false },
        { name: 'Test port connectivity', requiresPhoto: false },
        { name: 'Label all ports', requiresPhoto: true },
        { name: 'Update documentation', requiresPhoto: false },
      ],
    },
    {
      name: 'IP Camera Installation',
      description: 'Security camera deployment checklist',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['IP Camera'].id,
      isDefault: true,
      items: [
        { name: 'Verify camera angle and coverage', requiresPhoto: true },
        { name: 'Mount camera securely', requiresPhoto: true },
        { name: 'Connect PoE cable', requiresPhoto: false },
        { name: 'Configure IP address', requiresPhoto: false },
        { name: 'Add to NVR', requiresPhoto: false },
        { name: 'Adjust focus and zoom', requiresPhoto: true },
        { name: 'Set motion detection zones', requiresPhoto: false },
        { name: 'Test recording', requiresPhoto: false },
        { name: 'Verify night vision', requiresPhoto: true },
      ],
    },
    {
      name: 'Server Installation',
      description: 'Server deployment and initial setup',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Server'].id,
      isDefault: true,
      items: [
        { name: 'Unpack and inventory components', requiresPhoto: true },
        { name: 'Install in rack', requiresPhoto: true },
        { name: 'Connect power (redundant)', requiresPhoto: false },
        { name: 'Connect network cables', requiresPhoto: false },
        { name: 'Configure BIOS/UEFI', requiresPhoto: false },
        { name: 'Install operating system', requiresPhoto: false },
        { name: 'Configure RAID', requiresPhoto: false },
        { name: 'Set up remote management (iLO/iDRAC)', requiresPhoto: false },
        { name: 'Run burn-in tests', requiresPhoto: false },
        { name: 'Document serial numbers', requiresPhoto: true },
      ],
    },
    {
      name: 'UPS Setup',
      description: 'UPS installation and configuration',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['UPS'].id,
      isDefault: true,
      items: [
        { name: 'Position UPS in rack/floor', requiresPhoto: true },
        { name: 'Connect input power', requiresPhoto: false },
        { name: 'Connect output loads', requiresPhoto: false },
        { name: 'Configure management card', requiresPhoto: false },
        { name: 'Set battery charge level alerts', requiresPhoto: false },
        { name: 'Test failover', requiresPhoto: false },
        { name: 'Document runtime calculations', requiresPhoto: false },
      ],
    },
    {
      name: 'Smart TV Installation',
      description: 'Hotel TV setup checklist',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Smart TV'].id,
      isDefault: true,
      items: [
        { name: 'Mount TV on wall', requiresPhoto: true },
        { name: 'Connect to network', requiresPhoto: false },
        { name: 'Configure hotel mode', requiresPhoto: false },
        { name: 'Set channel lineup', requiresPhoto: false },
        { name: 'Configure welcome screen', requiresPhoto: false },
        { name: 'Test all inputs', requiresPhoto: false },
        { name: 'Hide service menu', requiresPhoto: false },
      ],
    },
    {
      name: 'Structured Cabling - Cat6',
      description: 'Cable installation and testing',
      type: 'CABLING' as const,
      isDefault: false,
      items: [
        { name: 'Verify cable route', requiresPhoto: true },
        { name: 'Pull cable through conduit', requiresPhoto: false },
        { name: 'Terminate at patch panel', requiresPhoto: true },
        { name: 'Terminate at wall outlet', requiresPhoto: true },
        { name: 'Label both ends', requiresPhoto: true },
        { name: 'Test with cable tester', requiresPhoto: true },
        { name: 'Document test results', requiresPhoto: false },
      ],
    },
    {
      name: 'Fiber Optic Installation',
      description: 'Fiber cable deployment',
      type: 'CABLING' as const,
      isDefault: false,
      items: [
        { name: 'Verify fiber route', requiresPhoto: true },
        { name: 'Install fiber tray/enclosure', requiresPhoto: true },
        { name: 'Pull fiber cable', requiresPhoto: false },
        { name: 'Splice/terminate connectors', requiresPhoto: true },
        { name: 'Test with OTDR', requiresPhoto: true },
        { name: 'Document loss measurements', requiresPhoto: false },
        { name: 'Install protective covers', requiresPhoto: false },
      ],
    },
    {
      name: 'VLAN Configuration',
      description: 'Network segmentation setup',
      type: 'CONFIG' as const,
      isDefault: false,
      items: [
        { name: 'Document VLAN requirements', requiresPhoto: false },
        { name: 'Create VLANs on switches', requiresPhoto: false },
        { name: 'Configure trunk ports', requiresPhoto: false },
        { name: 'Configure access ports', requiresPhoto: false },
        { name: 'Set up inter-VLAN routing', requiresPhoto: false },
        { name: 'Test connectivity between VLANs', requiresPhoto: false },
        { name: 'Test isolation where required', requiresPhoto: false },
      ],
    },
    {
      name: 'WiFi Configuration',
      description: 'Wireless network setup',
      type: 'CONFIG' as const,
      isDefault: false,
      items: [
        { name: 'Create SSIDs', requiresPhoto: false },
        { name: 'Configure security (WPA3/WPA2)', requiresPhoto: false },
        { name: 'Set up guest network portal', requiresPhoto: false },
        { name: 'Configure band steering', requiresPhoto: false },
        { name: 'Set channel and power', requiresPhoto: false },
        { name: 'Test coverage in all areas', requiresPhoto: false },
        { name: 'Document signal strength map', requiresPhoto: true },
      ],
    },
    {
      name: 'Firewall Configuration',
      description: 'Security appliance setup',
      type: 'CONFIG' as const,
      isDefault: false,
      items: [
        { name: 'Configure WAN interface', requiresPhoto: false },
        { name: 'Configure LAN interfaces', requiresPhoto: false },
        { name: 'Set up NAT rules', requiresPhoto: false },
        { name: 'Configure firewall policies', requiresPhoto: false },
        { name: 'Set up VPN (if required)', requiresPhoto: false },
        { name: 'Enable logging', requiresPhoto: false },
        { name: 'Test all rules', requiresPhoto: false },
        { name: 'Backup configuration', requiresPhoto: false },
      ],
    },
    {
      name: 'Room Handover Documentation',
      description: 'Final room delivery checklist',
      type: 'DOCUMENTATION' as const,
      isDefault: false,
      items: [
        { name: 'Complete as-built drawings', requiresPhoto: false },
        { name: 'Document all IP addresses', requiresPhoto: false },
        { name: 'Create cable schedule', requiresPhoto: false },
        { name: 'Photograph all installations', requiresPhoto: true },
        { name: 'Compile test results', requiresPhoto: false },
        { name: 'Get client sign-off', requiresPhoto: true },
      ],
    },
    {
      name: 'NVR/DVR Setup',
      description: 'Video recorder configuration',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['NVR/DVR'].id,
      isDefault: true,
      items: [
        { name: 'Install in rack', requiresPhoto: true },
        { name: 'Connect to network', requiresPhoto: false },
        { name: 'Install hard drives', requiresPhoto: true },
        { name: 'Configure storage settings', requiresPhoto: false },
        { name: 'Add all cameras', requiresPhoto: false },
        { name: 'Configure recording schedule', requiresPhoto: false },
        { name: 'Set up remote access', requiresPhoto: false },
        { name: 'Test playback', requiresPhoto: false },
      ],
    },
    {
      name: 'Router Configuration',
      description: 'Router deployment checklist',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Router'].id,
      isDefault: true,
      items: [
        { name: 'Install router', requiresPhoto: true },
        { name: 'Configure WAN connection', requiresPhoto: false },
        { name: 'Set up routing protocols', requiresPhoto: false },
        { name: 'Configure DHCP (if needed)', requiresPhoto: false },
        { name: 'Set up DNS', requiresPhoto: false },
        { name: 'Configure QoS', requiresPhoto: false },
        { name: 'Test internet connectivity', requiresPhoto: false },
        { name: 'Backup configuration', requiresPhoto: false },
      ],
    },
    {
      name: 'General Equipment Check',
      description: 'Basic equipment verification',
      type: 'GENERAL' as const,
      isDefault: false,
      items: [
        { name: 'Verify equipment model', requiresPhoto: true },
        { name: 'Check physical condition', requiresPhoto: true },
        { name: 'Record serial number', requiresPhoto: false },
        { name: 'Connect and power on', requiresPhoto: false },
        { name: 'Basic functionality test', requiresPhoto: false },
      ],
    },
  ];

  const createdTemplates: Record<string, { id: string }> = {};
  for (const template of templates) {
    const { items, ...templateData } = template;
    const created = await prisma.checklistTemplate.create({
      data: templateData,
    });
    createdTemplates[template.name] = created;

    for (let i = 0; i < items.length; i++) {
      await prisma.checklistTemplateItem.create({
        data: {
          templateId: created.id,
          name: items[i].name,
          requiresPhoto: items[i].requiresPhoto,
          order: i,
        },
      });
    }
  }
  console.log('✅ Checklist templates created');

  // ============================================
  // PROJECTS
  // ============================================
  console.log('🏗️  Creating projects...');

  const projectsData = [
    {
      name: 'Μεγάλο Ξενοδοχείο Αθήνα',
      clientName: 'Athens Grand Hotels S.A.',
      description: 'Ολοκληρωμένη εγκατάσταση δικτύου και συστημάτων ασφαλείας σε ξενοδοχείο 5 αστέρων',
      location: 'Αθήνα, Σύνταγμα',
      status: 'IN_PROGRESS' as const,
      buildings: [
        { name: 'Main Building', floors: ['Υπόγειο', 'Ισόγειο', '1ος Όροφος', '2ος Όροφος', '3ος Όροφος', '4ος Όροφος', '5ος Όροφος', 'Rooftop'] },
        { name: 'Conference Center', floors: ['Ground Floor', '1st Floor'] },
      ],
    },
    {
      name: 'Tech Hub Θεσσαλονίκη',
      clientName: 'Thessaloniki Tech Park',
      description: 'Εγκατάσταση υποδομής δικτύου για tech startup hub',
      location: 'Θεσσαλονίκη, Πυλαία',
      status: 'IN_PROGRESS' as const,
      buildings: [
        { name: 'Building A', floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'] },
        { name: 'Building B', floors: ['Ground Floor', '1st Floor', '2nd Floor'] },
        { name: 'Data Center', floors: ['Main Hall'] },
      ],
    },
    {
      name: 'Marina Resort Κρήτη',
      clientName: 'Crete Luxury Resorts',
      description: 'Smart resort με IoT integration και high-density WiFi',
      location: 'Ηράκλειο, Κρήτη',
      status: 'PLANNING' as const,
      buildings: [
        { name: 'Main Resort', floors: ['Reception', '1st Floor', '2nd Floor'] },
        { name: 'Villas Block A', floors: ['Ground Level'] },
        { name: 'Villas Block B', floors: ['Ground Level'] },
        { name: 'Beach Club', floors: ['Main Area'] },
      ],
    },
    {
      name: 'Εμπορικό Κέντρο Πειραιάς',
      clientName: 'Piraeus Commercial Properties',
      description: 'Εγκατάσταση WiFi και CCTV σε εμπορικό κέντρο',
      location: 'Πειραιάς',
      status: 'COMPLETED' as const,
      buildings: [
        { name: 'Main Mall', floors: ['Parking -2', 'Parking -1', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'] },
      ],
    },
    {
      name: 'Νοσοκομείο Πάτρας',
      clientName: 'Patras Medical Center',
      description: 'Healthcare-grade δίκτυο με redundancy και ασφάλεια',
      location: 'Πάτρα',
      status: 'IN_PROGRESS' as const,
      buildings: [
        { name: 'Main Hospital', floors: ['Basement', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor'] },
        { name: 'Emergency Wing', floors: ['Ground Floor', '1st Floor'] },
        { name: 'Admin Building', floors: ['Ground Floor', '1st Floor', '2nd Floor'] },
      ],
    },
  ];

  const roomTypesList = await prisma.lookupRoomType.findMany();
  const roomTypesArray = roomTypesList.map(rt => rt.name);

  const assetTypesList = await prisma.assetType.findMany();
  const modelsList = await prisma.lookupAssetModel.findMany({ include: { manufacturer: true } });

  for (const projectData of projectsData) {
    console.log(`  Creating project: ${projectData.name}...`);

    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        clientName: projectData.clientName,
        description: projectData.description,
        location: projectData.location,
        status: projectData.status,
        startDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      },
    });

    // Add project members
    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: admin.id, role: 'ADMIN' },
        { projectId: project.id, userId: pm1.id, role: 'PM' },
        { projectId: project.id, userId: tech1.id, role: 'TECHNICIAN' },
        { projectId: project.id, userId: tech2.id, role: 'TECHNICIAN' },
      ],
    });

    // Create inventory items (materials)
    const materials = [
      { itemType: 'Cable', description: 'Cat6 UTP Cable', unit: 'm', quantityReceived: 1000, quantityUsed: Math.floor(Math.random() * 500) },
      { itemType: 'Cable', description: 'Cat6A STP Cable', unit: 'm', quantityReceived: 500, quantityUsed: Math.floor(Math.random() * 200) },
      { itemType: 'Cable', description: 'Fiber OM4 Multimode', unit: 'm', quantityReceived: 200, quantityUsed: Math.floor(Math.random() * 100) },
      { itemType: 'Connector', description: 'RJ45 Connectors', unit: 'pcs', quantityReceived: 500, quantityUsed: Math.floor(Math.random() * 200) },
      { itemType: 'Connector', description: 'Keystone Jacks Cat6', unit: 'pcs', quantityReceived: 200, quantityUsed: Math.floor(Math.random() * 100) },
      { itemType: 'Mounting', description: 'AP Mounting Brackets', unit: 'pcs', quantityReceived: 50, quantityUsed: Math.floor(Math.random() * 30) },
      { itemType: 'Mounting', description: 'Camera Mounts', unit: 'pcs', quantityReceived: 30, quantityUsed: Math.floor(Math.random() * 20) },
      { itemType: 'Cable Management', description: 'Cable Ties (pack of 100)', unit: 'pack', quantityReceived: 20, quantityUsed: Math.floor(Math.random() * 10) },
      { itemType: 'Cable Management', description: 'Velcro Strips (roll)', unit: 'roll', quantityReceived: 10, quantityUsed: Math.floor(Math.random() * 5) },
      { itemType: 'Labels', description: 'Cable Labels', unit: 'roll', quantityReceived: 5, quantityUsed: Math.floor(Math.random() * 3) },
    ];

    for (const material of materials) {
      await prisma.inventoryItem.create({
        data: {
          projectId: project.id,
          ...material,
        },
      });
    }

    // Create equipment (Assets) in different states
    let assetCounter = 0;
    const projectAssets: { id: string; assetTypeId: string | null }[] = [];

    // Create IN_STOCK assets (available in inventory)
    const stockCount = 10 + Math.floor(Math.random() * 15);
    for (let i = 0; i < stockCount; i++) {
      const assetType = assetTypesList[Math.floor(Math.random() * assetTypesList.length)];
      const compatibleModels = modelsList.filter(m => m.assetTypeId === assetType.id);
      const model = compatibleModels.length > 0
        ? compatibleModels[Math.floor(Math.random() * compatibleModels.length)]
        : modelsList[Math.floor(Math.random() * modelsList.length)];

      assetCounter++;
      const asset = await prisma.asset.create({
        data: {
          projectId: project.id,
          name: `${assetType.name} ${String(assetCounter).padStart(3, '0')}`,
          assetTypeId: assetType.id,
          model: `${model.manufacturer.name} ${model.name}`,
          serialNumber: `SN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          macAddress: Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase(),
          status: 'IN_STOCK',
          labelCode: `${project.name.substring(0, 3).toUpperCase()}-${assetType.name.substring(0, 2).toUpperCase()}-${String(assetCounter).padStart(4, '0')}`,
        },
      });
      projectAssets.push({ id: asset.id, assetTypeId: asset.assetTypeId });
    }

    // Create PLANNED assets (on order)
    const plannedCount = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < plannedCount; i++) {
      const assetType = assetTypesList[Math.floor(Math.random() * assetTypesList.length)];
      const compatibleModels = modelsList.filter(m => m.assetTypeId === assetType.id);
      const model = compatibleModels.length > 0
        ? compatibleModels[Math.floor(Math.random() * compatibleModels.length)]
        : modelsList[Math.floor(Math.random() * modelsList.length)];

      assetCounter++;
      await prisma.asset.create({
        data: {
          projectId: project.id,
          name: `${assetType.name} ${String(assetCounter).padStart(3, '0')}`,
          assetTypeId: assetType.id,
          model: `${model.manufacturer.name} ${model.name}`,
          status: 'PLANNED',
          notes: 'Αναμένεται παράδοση',
        },
      });
    }

    // Create buildings, floors, rooms
    for (const buildingData of projectData.buildings) {
      const building = await prisma.building.create({
        data: {
          projectId: project.id,
          name: buildingData.name,
        },
      });

      for (let floorIdx = 0; floorIdx < buildingData.floors.length; floorIdx++) {
        const floorName = buildingData.floors[floorIdx];
        const floor = await prisma.floor.create({
          data: {
            buildingId: building.id,
            name: floorName,
            level: floorIdx,
          },
        });

        // Create rooms for this floor
        const roomCount = 3 + Math.floor(Math.random() * 8);
        for (let roomIdx = 0; roomIdx < roomCount; roomIdx++) {
          const roomType = roomTypesArray[Math.floor(Math.random() * roomTypesArray.length)];
          const statuses: ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED')[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
          const weights = [0.2, 0.4, 0.35, 0.05];
          const random = Math.random();
          let cumulative = 0;
          let roomStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' = 'NOT_STARTED';
          for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
              roomStatus = statuses[i];
              break;
            }
          }

          const room = await prisma.room.create({
            data: {
              floorId: floor.id,
              name: `${roomType} ${roomIdx + 1}`,
              type: roomType,
              status: roomStatus,
              pinX: roomIdx % 3 === 0 ? null : 100 + (roomIdx * 150) % 600,
              pinY: roomIdx % 3 === 0 ? null : 100 + Math.floor(roomIdx / 4) * 120,
            },
          });

          // Add assets to room (installed)
          const assetsInRoom = Math.floor(Math.random() * 4);
          for (let assetIdx = 0; assetIdx < assetsInRoom && projectAssets.length > 0; assetIdx++) {
            const assetToInstall = projectAssets.shift();
            if (assetToInstall) {
              const installStatuses: ('INSTALLED' | 'CONFIGURED' | 'VERIFIED')[] = ['INSTALLED', 'CONFIGURED', 'VERIFIED'];
              const installStatus = installStatuses[Math.floor(Math.random() * installStatuses.length)];

              await prisma.asset.update({
                where: { id: assetToInstall.id },
                data: {
                  roomId: room.id,
                  status: installStatus,
                  installedById: [tech1.id, tech2.id, tech3.id][Math.floor(Math.random() * 3)],
                  installedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                  pinX: 50 + Math.random() * 200,
                  pinY: 50 + Math.random() * 150,
                },
              });

              // Create checklist for installed asset
              if (assetToInstall.assetTypeId) {
                const matchingTemplate = await prisma.checklistTemplate.findFirst({
                  where: { assetTypeId: assetToInstall.assetTypeId, isDefault: true },
                  include: { items: true },
                });

                if (matchingTemplate) {
                  const checklistStatuses: ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED')[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
                  const clStatus = checklistStatuses[Math.floor(Math.random() * checklistStatuses.length)];

                  const checklist = await prisma.checklist.create({
                    data: {
                      assetId: assetToInstall.id,
                      type: 'EQUIPMENT',
                      status: clStatus,
                      templateId: matchingTemplate.id,
                      assignedToId: [tech1.id, tech2.id, tech3.id][Math.floor(Math.random() * 3)],
                      completedAt: clStatus === 'COMPLETED' ? new Date() : null,
                    },
                  });

                  // Create checklist items
                  for (const templateItem of matchingTemplate.items) {
                    const itemCompleted = clStatus === 'COMPLETED' || (clStatus === 'IN_PROGRESS' && Math.random() > 0.5);
                    await prisma.checklistItem.create({
                      data: {
                        checklistId: checklist.id,
                        name: templateItem.name,
                        description: templateItem.description,
                        requiresPhoto: templateItem.requiresPhoto,
                        isRequired: templateItem.isRequired,
                        order: templateItem.order,
                        sourceItemId: templateItem.id,
                        completed: itemCompleted,
                        completedById: itemCompleted ? [tech1.id, tech2.id][Math.floor(Math.random() * 2)] : null,
                        completedAt: itemCompleted ? new Date() : null,
                      },
                    });
                  }
                }
              }
            }
          }

          // Create some issues for rooms
          if (Math.random() > 0.7) {
            const issueTitles = [
              'Χαμηλό σήμα WiFi',
              'Δεν λειτουργεί η κάμερα',
              'Πρόβλημα με το switch',
              'Καλώδιο κατεστραμμένο',
              'Δεν έχει ρεύμα',
              'Λάθος VLAN configuration',
            ];

            await prisma.issue.create({
              data: {
                projectId: project.id,
                roomId: room.id,
                title: issueTitles[Math.floor(Math.random() * issueTitles.length)],
                description: 'Περιγραφή του προβλήματος που εντοπίστηκε κατά την εγκατάσταση.',
                priority: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const)[Math.floor(Math.random() * 4)],
                status: (['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const)[Math.floor(Math.random() * 3)],
                createdById: [tech1.id, tech2.id][Math.floor(Math.random() * 2)],
                causedBy: issueCauses[Math.floor(Math.random() * issueCauses.length)],
              },
            });
          }
        }

        // Add some floor-level assets
        const floorAssets = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < floorAssets && projectAssets.length > 0; i++) {
          const assetToInstall = projectAssets.shift();
          if (assetToInstall) {
            await prisma.asset.update({
              where: { id: assetToInstall.id },
              data: {
                floorId: floor.id,
                roomId: null,
                status: 'INSTALLED',
                installedById: tech1.id,
                installedAt: new Date(),
                pinX: 300 + i * 100,
                pinY: 50,
              },
            });
          }
        }
      }
    }

    console.log(`  ✅ Project "${projectData.name}" created`);
  }

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Projects: ${await prisma.project.count()}`);
  console.log(`   - Buildings: ${await prisma.building.count()}`);
  console.log(`   - Floors: ${await prisma.floor.count()}`);
  console.log(`   - Rooms: ${await prisma.room.count()}`);
  console.log(`   - Assets: ${await prisma.asset.count()}`);
  console.log(`   - Checklist Templates: ${await prisma.checklistTemplate.count()}`);
  console.log(`   - Checklists: ${await prisma.checklist.count()}`);
  console.log(`   - Issues: ${await prisma.issue.count()}`);
  console.log(`   - Inventory Items: ${await prisma.inventoryItem.count()}`);
  console.log('');
  console.log('🔐 Test Accounts:');
  console.log('   - admin@synax.gr / admin123 (ADMIN)');
  console.log('   - pm@synax.gr / pm123456 (PM)');
  console.log('   - tech1@synax.gr / tech123456 (TECHNICIAN)');
  console.log('   - tech2@synax.gr / tech123456 (TECHNICIAN)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
