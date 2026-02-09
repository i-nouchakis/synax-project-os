import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// HELPERS
// ============================================
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSerial(): string {
  return `SN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function generateMac(): string {
  return Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase();
}

function generateIp(subnet: string, host: number): string {
  return `${subnet}.${host}`;
}

function randomDate(daysAgo: number): Date {
  return new Date(Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

// ============================================
// MAIN SEED
// ============================================
async function main() {
  console.log('🗑️  Clearing database...');

  // Delete in correct order (respecting foreign keys)
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.calendarEventAttendee.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.cable.deleteMany();
  await prisma.cableBundle.deleteMany();
  await prisma.drawingShape.deleteMany();
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
  await prisma.generatedReport.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.label.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.client.deleteMany();
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
  const adminHash = await bcrypt.hash('admin123', 10);
  const pmHash = await bcrypt.hash('pm123456', 10);
  const techHash = await bcrypt.hash('tech123456', 10);
  const clientHash = await bcrypt.hash('client123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@synax.gr', passwordHash: adminHash, name: 'Ιωάννης Νουχάκης', role: 'ADMIN' },
  });
  const pm1 = await prisma.user.create({
    data: { email: 'pm@synax.gr', passwordHash: pmHash, name: 'Γιώργος Παπαδόπουλος', role: 'PM' },
  });
  const pm2 = await prisma.user.create({
    data: { email: 'maria@synax.gr', passwordHash: pmHash, name: 'Μαρία Αντωνίου', role: 'PM' },
  });
  const tech1 = await prisma.user.create({
    data: { email: 'tech1@synax.gr', passwordHash: techHash, name: 'Νίκος Δημητρίου', role: 'TECHNICIAN' },
  });
  const tech2 = await prisma.user.create({
    data: { email: 'tech2@synax.gr', passwordHash: techHash, name: 'Κώστας Ιωάννου', role: 'TECHNICIAN' },
  });
  const tech3 = await prisma.user.create({
    data: { email: 'tech3@synax.gr', passwordHash: techHash, name: 'Αλέξανδρος Νικολάου', role: 'TECHNICIAN' },
  });
  const clientUser = await prisma.user.create({
    data: { email: 'client@demo.gr', passwordHash: clientHash, name: 'Δημήτρης Οικονομίδης', role: 'CLIENT' },
  });

  const techs = [tech1, tech2, tech3];
  console.log('✅ Users created');

  // ============================================
  // LOOKUPS - ROOM TYPES
  // ============================================
  console.log('🏷️  Creating room types...');
  const roomTypesData = [
    { name: 'Server Room', icon: 'FaServer' },
    { name: 'Comms Room', icon: 'MdRouter' },
    { name: 'Office', icon: 'MdDesk' },
    { name: 'Meeting Room', icon: 'MdMeetingRoom' },
    { name: 'Reception', icon: 'BsReception4' },
    { name: 'Lobby', icon: 'BsLamp' },
    { name: 'Corridor', icon: 'MdDoorFront' },
    { name: 'Storage', icon: 'MdStorage' },
    { name: 'Kitchen', icon: 'MdKitchen' },
    { name: 'Restaurant', icon: 'MdRestaurant' },
    { name: 'Bar', icon: 'MdLocalBar' },
    { name: 'Guest Room', icon: 'MdBed' },
    { name: 'Suite', icon: 'FaBed' },
    { name: 'Gym', icon: 'MdFitnessCenter' },
    { name: 'Spa', icon: 'MdSpa' },
    { name: 'Pool Area', icon: 'MdPool' },
    { name: 'Parking', icon: 'MdLocalParking' },
    { name: 'Elevator Area', icon: 'MdElevator' },
    { name: 'Bathroom', icon: 'MdBathtub' },
    { name: 'Laundry', icon: 'MdLocalLaundryService' },
    { name: 'Staff Room', icon: 'GiOfficeChair' },
    { name: 'Warehouse', icon: 'FaWarehouse' },
    { name: 'Production Area', icon: 'MdFactory' },
    { name: 'Cold Storage', icon: 'FaSnowflake' },
    { name: 'Sales Floor', icon: 'MdShoppingCart' },
    { name: 'Checkout Area', icon: 'MdPointOfSale' },
    { name: 'Loading Dock', icon: 'FaTruck' },
    { name: 'Pharmacy', icon: 'MdLocalPharmacy' },
    { name: 'Lab', icon: 'MdScience' },
    { name: 'Operating Room', icon: 'MdLocalHospital' },
    { name: 'Patient Room', icon: 'MdBed' },
    { name: 'Classroom', icon: 'MdSchool' },
    { name: 'Library', icon: 'MdLocalLibrary' },
    { name: 'Auditorium', icon: 'MdTheaters' },
    { name: 'Security Room', icon: 'MdSecurity' },
    { name: 'Mechanical Room', icon: 'MdBuild' },
  ];

  for (let i = 0; i < roomTypesData.length; i++) {
    await prisma.lookupRoomType.create({
      data: { name: roomTypesData[i].name, icon: roomTypesData[i].icon, order: i },
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
    'Cable Fault', 'Signal Interference',
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
    { name: 'Access Point', icon: 'FaWifi' },
    { name: 'Network Switch', icon: 'FaNetworkWired' },
    { name: 'IP Camera', icon: 'MdVideocam' },
    { name: 'Router', icon: 'MdRouter' },
    { name: 'Firewall', icon: 'MdSecurity' },
    { name: 'Server', icon: 'FaServer' },
    { name: 'UPS', icon: 'MdBatteryChargingFull' },
    { name: 'Smart TV', icon: 'MdTv' },
    { name: 'VoIP Phone', icon: 'MdPhone' },
    { name: 'POS Terminal', icon: 'MdPointOfSale' },
    { name: 'Digital Signage', icon: 'MdDesktopWindows' },
    { name: 'Patch Panel', icon: 'MdViewModule' },
    { name: 'NVR/DVR', icon: 'MdStorage' },
    { name: 'Controller', icon: 'MdMemory' },
    { name: 'Sensor', icon: 'MdSensors' },
    { name: 'Thermostat', icon: 'MdThermostat' },
    { name: 'Rack Cabinet', icon: 'MdDns' },
    { name: 'Media Converter', icon: 'MdSwapHoriz' },
    { name: 'PoE Injector', icon: 'MdPower' },
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
    { name: 'Netgear', website: 'https://netgear.com' },
    { name: 'Daikin', website: 'https://daikin.com' },
  ];

  const manufacturers: Record<string, { id: string }> = {};
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
    { manufacturer: 'Cisco', name: 'Catalyst 9200-24P', assetType: 'Network Switch' },
    { manufacturer: 'Cisco', name: 'Catalyst 9300-48P', assetType: 'Network Switch' },
    { manufacturer: 'Cisco', name: 'Meraki MR46', assetType: 'Access Point' },
    { manufacturer: 'Cisco', name: 'Meraki MR56', assetType: 'Access Point' },
    { manufacturer: 'Cisco', name: 'ISR 4331', assetType: 'Router' },
    { manufacturer: 'Cisco', name: 'Firepower 1010', assetType: 'Firewall' },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Pro', assetType: 'Access Point' },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Enterprise', assetType: 'Access Point' },
    { manufacturer: 'Ubiquiti', name: 'UniFi U6 Lite', assetType: 'Access Point' },
    { manufacturer: 'Ubiquiti', name: 'USW-Pro-48-PoE', assetType: 'Network Switch' },
    { manufacturer: 'Ubiquiti', name: 'USW-Pro-24-PoE', assetType: 'Network Switch' },
    { manufacturer: 'Ubiquiti', name: 'USW-Lite-16-PoE', assetType: 'Network Switch' },
    { manufacturer: 'Ubiquiti', name: 'UDM Pro', assetType: 'Router' },
    { manufacturer: 'Ubiquiti', name: 'G4 Bullet', assetType: 'IP Camera' },
    { manufacturer: 'Ubiquiti', name: 'G4 Dome', assetType: 'IP Camera' },
    { manufacturer: 'Ubiquiti', name: 'G4 Pro', assetType: 'IP Camera' },
    { manufacturer: 'Aruba', name: 'AP-515', assetType: 'Access Point' },
    { manufacturer: 'Aruba', name: 'AP-635', assetType: 'Access Point' },
    { manufacturer: 'Aruba', name: 'CX 6300', assetType: 'Network Switch' },
    { manufacturer: 'MikroTik', name: 'CRS326-24G-2S+', assetType: 'Network Switch' },
    { manufacturer: 'MikroTik', name: 'hAP ax3', assetType: 'Access Point' },
    { manufacturer: 'MikroTik', name: 'CCR2004', assetType: 'Router' },
    { manufacturer: 'TP-Link', name: 'EAP670', assetType: 'Access Point' },
    { manufacturer: 'TP-Link', name: 'TL-SG3428XMP', assetType: 'Network Switch' },
    { manufacturer: 'Hikvision', name: 'DS-2CD2143G2-I', assetType: 'IP Camera' },
    { manufacturer: 'Hikvision', name: 'DS-2CD2183G2-I', assetType: 'IP Camera' },
    { manufacturer: 'Hikvision', name: 'DS-2CD2347G2-L', assetType: 'IP Camera' },
    { manufacturer: 'Hikvision', name: 'DS-7616NI-K2', assetType: 'NVR/DVR' },
    { manufacturer: 'Hikvision', name: 'DS-7732NI-K4', assetType: 'NVR/DVR' },
    { manufacturer: 'Dahua', name: 'IPC-HDBW2431E-S', assetType: 'IP Camera' },
    { manufacturer: 'Dahua', name: 'IPC-HFW2831T-ZAS', assetType: 'IP Camera' },
    { manufacturer: 'Dahua', name: 'NVR4216-16P-4KS2', assetType: 'NVR/DVR' },
    { manufacturer: 'Samsung', name: 'HG55AU800', assetType: 'Smart TV' },
    { manufacturer: 'Samsung', name: 'HG43AU800', assetType: 'Smart TV' },
    { manufacturer: 'Samsung', name: 'QM55R', assetType: 'Digital Signage' },
    { manufacturer: 'LG', name: '55UQ751C', assetType: 'Smart TV' },
    { manufacturer: 'LG', name: '55UH5J-H', assetType: 'Digital Signage' },
    { manufacturer: 'APC', name: 'Smart-UPS 1500VA', assetType: 'UPS' },
    { manufacturer: 'APC', name: 'Smart-UPS 3000VA', assetType: 'UPS' },
    { manufacturer: 'APC', name: 'Smart-UPS 5000VA', assetType: 'UPS' },
    { manufacturer: 'Eaton', name: '5PX 1500', assetType: 'UPS' },
    { manufacturer: 'Dell', name: 'PowerEdge R650xs', assetType: 'Server' },
    { manufacturer: 'Dell', name: 'PowerEdge R750xs', assetType: 'Server' },
    { manufacturer: 'HP', name: 'ProLiant DL380 Gen10', assetType: 'Server' },
    { manufacturer: 'Fortinet', name: 'FortiGate 60F', assetType: 'Firewall' },
    { manufacturer: 'Fortinet', name: 'FortiGate 100F', assetType: 'Firewall' },
  ];

  const models: Record<string, { id: string; name: string; manufacturerId: string; assetTypeId: string | null }> = {};
  for (const model of modelsData) {
    const created = await prisma.lookupAssetModel.create({
      data: {
        manufacturerId: manufacturers[model.manufacturer].id,
        name: model.name,
        assetTypeId: assetTypes[model.assetType]?.id,
      },
    });
    models[`${model.manufacturer} ${model.name}`] = { ...created, manufacturerId: manufacturers[model.manufacturer].id };
  }
  console.log('✅ Asset models created');

  // ============================================
  // CHECKLIST TEMPLATES
  // ============================================
  console.log('📋 Creating checklist templates...');

  const templates = [
    {
      name: 'Access Point Installation',
      description: 'Εγκατάσταση και ρύθμιση WiFi Access Point',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Access Point'].id,
      isDefault: true,
      items: [
        { name: 'Επαλήθευση θέσης τοποθέτησης', requiresPhoto: true },
        { name: 'Έλεγχος PoE τροφοδοσίας', requiresPhoto: false },
        { name: 'Σύνδεση ethernet καλωδίου', requiresPhoto: false },
        { name: 'Επαλήθευση LED ένδειξης', requiresPhoto: true },
        { name: 'Δοκιμή ασύρματης σύνδεσης', requiresPhoto: false },
        { name: 'Ρύθμιση SSID', requiresPhoto: false },
        { name: 'Δοκιμή roaming', requiresPhoto: false },
        { name: 'Καταγραφή τελικής θέσης', requiresPhoto: true },
      ],
    },
    {
      name: 'Network Switch Setup',
      description: 'Εγκατάσταση και ρύθμιση δικτυακού switch',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Network Switch'].id,
      isDefault: true,
      items: [
        { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
        { name: 'Σύνδεση τροφοδοσίας', requiresPhoto: false },
        { name: 'Σύνδεση uplink', requiresPhoto: true },
        { name: 'Ρύθμιση management IP', requiresPhoto: false },
        { name: 'Δημιουργία VLANs', requiresPhoto: false },
        { name: 'Ενεργοποίηση PoE', requiresPhoto: false },
        { name: 'Δοκιμή ports', requiresPhoto: false },
        { name: 'Επισήμανση ports', requiresPhoto: true },
      ],
    },
    {
      name: 'IP Camera Installation',
      description: 'Εγκατάσταση κάμερας ασφαλείας',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['IP Camera'].id,
      isDefault: true,
      items: [
        { name: 'Έλεγχος γωνίας κάλυψης', requiresPhoto: true },
        { name: 'Στερέωση κάμερας', requiresPhoto: true },
        { name: 'Σύνδεση PoE καλωδίου', requiresPhoto: false },
        { name: 'Ρύθμιση IP διεύθυνσης', requiresPhoto: false },
        { name: 'Προσθήκη σε NVR', requiresPhoto: false },
        { name: 'Ρύθμιση focus/zoom', requiresPhoto: true },
        { name: 'Ρύθμιση motion detection', requiresPhoto: false },
        { name: 'Δοκιμή εγγραφής', requiresPhoto: false },
        { name: 'Δοκιμή νυχτερινής λήψης', requiresPhoto: true },
      ],
    },
    {
      name: 'Server Installation',
      description: 'Εγκατάσταση server',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Server'].id,
      isDefault: true,
      items: [
        { name: 'Αποσυσκευασία και έλεγχος', requiresPhoto: true },
        { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
        { name: 'Σύνδεση τροφοδοσίας (redundant)', requiresPhoto: false },
        { name: 'Σύνδεση δικτύου', requiresPhoto: false },
        { name: 'Ρύθμιση BIOS/UEFI', requiresPhoto: false },
        { name: 'Εγκατάσταση OS', requiresPhoto: false },
        { name: 'Ρύθμιση RAID', requiresPhoto: false },
        { name: 'Ρύθμιση remote management', requiresPhoto: false },
        { name: 'Burn-in tests', requiresPhoto: false },
        { name: 'Καταγραφή serial numbers', requiresPhoto: true },
      ],
    },
    {
      name: 'UPS Setup',
      description: 'Εγκατάσταση και ρύθμιση UPS',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['UPS'].id,
      isDefault: true,
      items: [
        { name: 'Τοποθέτηση UPS', requiresPhoto: true },
        { name: 'Σύνδεση εισόδου', requiresPhoto: false },
        { name: 'Σύνδεση φορτίων', requiresPhoto: false },
        { name: 'Ρύθμιση management card', requiresPhoto: false },
        { name: 'Ρύθμιση ειδοποιήσεων', requiresPhoto: false },
        { name: 'Δοκιμή failover', requiresPhoto: false },
        { name: 'Τεκμηρίωση runtime', requiresPhoto: false },
      ],
    },
    {
      name: 'Smart TV Installation',
      description: 'Εγκατάσταση Smart TV',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Smart TV'].id,
      isDefault: true,
      items: [
        { name: 'Τοποθέτηση σε τοίχο', requiresPhoto: true },
        { name: 'Σύνδεση στο δίκτυο', requiresPhoto: false },
        { name: 'Ρύθμιση hotel mode', requiresPhoto: false },
        { name: 'Ρύθμιση καναλιών', requiresPhoto: false },
        { name: 'Δοκιμή εισόδων', requiresPhoto: false },
      ],
    },
    {
      name: 'NVR/DVR Setup',
      description: 'Εγκατάσταση καταγραφικού βίντεο',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['NVR/DVR'].id,
      isDefault: true,
      items: [
        { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
        { name: 'Σύνδεση στο δίκτυο', requiresPhoto: false },
        { name: 'Εγκατάσταση σκληρών δίσκων', requiresPhoto: true },
        { name: 'Ρύθμιση αποθήκευσης', requiresPhoto: false },
        { name: 'Προσθήκη καμερών', requiresPhoto: false },
        { name: 'Ρύθμιση προγράμματος εγγραφής', requiresPhoto: false },
        { name: 'Ρύθμιση απομακρυσμένης πρόσβασης', requiresPhoto: false },
        { name: 'Δοκιμή playback', requiresPhoto: false },
      ],
    },
    {
      name: 'Router Configuration',
      description: 'Εγκατάσταση και ρύθμιση router',
      type: 'EQUIPMENT' as const,
      assetTypeId: assetTypes['Router'].id,
      isDefault: true,
      items: [
        { name: 'Τοποθέτηση router', requiresPhoto: true },
        { name: 'Ρύθμιση WAN', requiresPhoto: false },
        { name: 'Ρύθμιση routing protocols', requiresPhoto: false },
        { name: 'Ρύθμιση DHCP', requiresPhoto: false },
        { name: 'Ρύθμιση DNS', requiresPhoto: false },
        { name: 'Ρύθμιση QoS', requiresPhoto: false },
        { name: 'Δοκιμή internet', requiresPhoto: false },
        { name: 'Backup configuration', requiresPhoto: false },
      ],
    },
    {
      name: 'Structured Cabling - Cat6',
      description: 'Εγκατάσταση δομημένης καλωδίωσης',
      type: 'CABLING' as const,
      isDefault: false,
      items: [
        { name: 'Επαλήθευση διαδρομής', requiresPhoto: true },
        { name: 'Τράβηγμα καλωδίου', requiresPhoto: false },
        { name: 'Τερματισμός σε patch panel', requiresPhoto: true },
        { name: 'Τερματισμός σε πρίζα', requiresPhoto: true },
        { name: 'Επισήμανση άκρων', requiresPhoto: true },
        { name: 'Δοκιμή με cable tester', requiresPhoto: true },
        { name: 'Τεκμηρίωση αποτελεσμάτων', requiresPhoto: false },
      ],
    },
    {
      name: 'Fiber Optic Installation',
      description: 'Εγκατάσταση οπτικής ίνας',
      type: 'CABLING' as const,
      isDefault: false,
      items: [
        { name: 'Επαλήθευση διαδρομής fiber', requiresPhoto: true },
        { name: 'Εγκατάσταση fiber tray', requiresPhoto: true },
        { name: 'Τράβηγμα fiber', requiresPhoto: false },
        { name: 'Τερματισμός connectors', requiresPhoto: true },
        { name: 'Μέτρηση με OTDR', requiresPhoto: true },
        { name: 'Τεκμηρίωση loss measurements', requiresPhoto: false },
      ],
    },
    {
      name: 'VLAN Configuration',
      description: 'Ρύθμιση δικτυακού segmentation',
      type: 'CONFIG' as const,
      isDefault: false,
      items: [
        { name: 'Τεκμηρίωση απαιτήσεων VLAN', requiresPhoto: false },
        { name: 'Δημιουργία VLANs σε switches', requiresPhoto: false },
        { name: 'Ρύθμιση trunk ports', requiresPhoto: false },
        { name: 'Ρύθμιση access ports', requiresPhoto: false },
        { name: 'Inter-VLAN routing', requiresPhoto: false },
        { name: 'Δοκιμή connectivity', requiresPhoto: false },
        { name: 'Δοκιμή isolation', requiresPhoto: false },
      ],
    },
    {
      name: 'Room Handover',
      description: 'Παράδοση χώρου - τελικός έλεγχος',
      type: 'DOCUMENTATION' as const,
      isDefault: false,
      items: [
        { name: 'As-built σχέδια', requiresPhoto: false },
        { name: 'Τεκμηρίωση IP addresses', requiresPhoto: false },
        { name: 'Cable schedule', requiresPhoto: false },
        { name: 'Φωτογράφηση εγκαταστάσεων', requiresPhoto: true },
        { name: 'Αποτελέσματα δοκιμών', requiresPhoto: false },
        { name: 'Υπογραφή πελάτη', requiresPhoto: true },
      ],
    },
    {
      name: 'General Equipment Check',
      description: 'Γενικός έλεγχος εξοπλισμού',
      type: 'GENERAL' as const,
      isDefault: false,
      items: [
        { name: 'Επαλήθευση μοντέλου', requiresPhoto: true },
        { name: 'Έλεγχος φυσικής κατάστασης', requiresPhoto: true },
        { name: 'Καταγραφή serial number', requiresPhoto: false },
        { name: 'Σύνδεση και εκκίνηση', requiresPhoto: false },
        { name: 'Βασική δοκιμή λειτουργίας', requiresPhoto: false },
      ],
    },
  ];

  const createdTemplates: Record<string, { id: string }> = {};
  for (const template of templates) {
    const { items, ...templateData } = template;
    const created = await prisma.checklistTemplate.create({ data: templateData });
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
  // CLIENTS
  // ============================================
  console.log('🏢 Creating clients...');
  const clientsData = [
    { name: 'Ελληνικά Ξενοδοχεία Α.Ε.', email: 'info@ellinkahotels.gr', phone: '+30 210 7234567', contactPerson: 'Αλέξανδρος Κωνσταντίνου', address: 'Λεωφ. Βασ. Σοφίας 48, Αθήνα 10674' },
    { name: 'Αφοί Παπαδόπουλοι ΑΒΕΕ', email: 'info@papadopouloiindustries.gr', phone: '+30 2310 567890', contactPerson: 'Κωνσταντίνος Παπαδόπουλος', address: 'ΒΙ.ΠΕ. Σίνδου, Θεσσαλονίκη 57022' },
    { name: 'Super Market "Ο Γαλαξίας"', email: 'it@galaxias-sm.gr', phone: '+30 210 8901234', contactPerson: 'Σπύρος Γαλανόπουλος', address: 'Λεωφ. Κηφισίας 186, Χαλάνδρι 15231' },
    { name: 'Νοσοκομείο "Υγεία Πάτρας"', email: 'admin@ygieia-patras.gr', phone: '+30 2610 345678', contactPerson: 'Δρ. Ιωάννης Γεωργίου', address: 'Κορίνθου 256, Πάτρα 26221' },
    { name: 'TechSpace Offices', email: 'management@techspace.gr', phone: '+30 210 3456789', contactPerson: 'Μαρίνα Βλαχοπούλου', address: 'Λεωφ. Κηφισίας 44, Μαρούσι 15125' },
    { name: 'Δήμος Ηρακλείου', email: 'it@heraklion.gov.gr', phone: '+30 2810 399000', contactPerson: 'Μιχάλης Τσαγκαράκης', address: 'Αγ. Τίτου 1, Ηράκλειο 71202' },
  ];

  const clients: Record<string, { id: string }> = {};
  for (const c of clientsData) {
    clients[c.name] = await prisma.client.create({ data: c });
  }
  console.log('✅ Clients created');

  // ============================================
  // PROJECT DEFINITIONS - ΡΕΑΛΙΣΤΙΚΑ ΔΕΔΟΜΕΝΑ
  // ============================================

  interface RoomDef {
    name: string;
    type: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    assets: { type: string; model: string; status: 'INSTALLED' | 'CONFIGURED' | 'VERIFIED' }[];
  }

  interface FloorDef {
    name: string;
    level: number;
    rooms: RoomDef[];
  }

  interface BuildingDef {
    name: string;
    floors: FloorDef[];
  }

  interface ProjectDef {
    name: string;
    clientName: string;
    description: string;
    location: string;
    status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
    buildings: BuildingDef[];
    extraStock: { type: string; model: string; count: number }[];
    plannedAssets: { type: string; model: string; count: number }[];
  }

  const projectDefs: ProjectDef[] = [
    // ============================================
    // PROJECT 1: ΞΕΝΟΔΟΧΕΙΟ 5 ΑΣΤΕΡΩΝ
    // ============================================
    {
      name: 'Athena Palace Hotel - Δίκτυο & Ασφάλεια',
      clientName: 'Ελληνικά Ξενοδοχεία Α.Ε.',
      description: 'Ολοκληρωμένη εγκατάσταση δικτύου, WiFi, CCTV και IPTV σε ξενοδοχείο 5 αστέρων 120 δωματίων στο κέντρο της Αθήνας',
      location: 'Λεωφ. Βασ. Σοφίας 48, Αθήνα',
      status: 'IN_PROGRESS',
      buildings: [
        {
          name: 'Κεντρικό Κτίριο',
          floors: [
            {
              name: 'Υπόγειο', level: -1,
              rooms: [
                { name: 'Server Room', type: 'Server Room', status: 'COMPLETED', assets: [
                  { type: 'Server', model: 'Dell PowerEdge R650xs', status: 'CONFIGURED' },
                  { type: 'Server', model: 'HP ProLiant DL380 Gen10', status: 'CONFIGURED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9300-48P', status: 'CONFIGURED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9300-48P', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 5000VA', status: 'VERIFIED' },
                  { type: 'UPS', model: 'APC Smart-UPS 3000VA', status: 'VERIFIED' },
                  { type: 'Patch Panel', model: 'Cisco Catalyst 9200-24P', status: 'INSTALLED' },
                  { type: 'NVR/DVR', model: 'Hikvision DS-7732NI-K4', status: 'CONFIGURED' },
                  { type: 'Firewall', model: 'Fortinet FortiGate 100F', status: 'CONFIGURED' },
                  { type: 'Router', model: 'Cisco ISR 4331', status: 'CONFIGURED' },
                ]},
                { name: 'Αποθήκη', type: 'Storage', status: 'COMPLETED', assets: [
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                ]},
                { name: 'Parking', type: 'Parking', status: 'IN_PROGRESS', assets: [
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'INSTALLED' },
                ]},
              ],
            },
            {
              name: 'Ισόγειο', level: 0,
              rooms: [
                { name: 'Reception', type: 'Reception', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'CONFIGURED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                  { type: 'Digital Signage', model: 'Samsung QM55R', status: 'INSTALLED' },
                ]},
                { name: 'Lobby', type: 'Lobby', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                ]},
                { name: 'Εστιατόριο "Olympus"', type: 'Restaurant', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HDBW2431E-S', status: 'INSTALLED' },
                  { type: 'Smart TV', model: 'Samsung HG55AU800', status: 'INSTALLED' },
                ]},
                { name: 'Bar "Acropolis"', type: 'Bar', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'INSTALLED' },
                  { type: 'Smart TV', model: 'LG 55UQ751C', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HDBW2431E-S', status: 'INSTALLED' },
                ]},
                { name: 'Comms Room Ισογείου', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-48-PoE', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
                { name: 'Security Room', type: 'Security Room', status: 'COMPLETED', assets: [
                  { type: 'NVR/DVR', model: 'Hikvision DS-7616NI-K2', status: 'CONFIGURED' },
                ]},
              ],
            },
            {
              name: '1ος Όροφος', level: 1,
              rooms: [
                { name: 'Δωμάτιο 101', type: 'Guest Room', status: 'COMPLETED', assets: [
                  { type: 'Smart TV', model: 'Samsung HG43AU800', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                ]},
                { name: 'Δωμάτιο 102', type: 'Guest Room', status: 'COMPLETED', assets: [
                  { type: 'Smart TV', model: 'Samsung HG43AU800', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                ]},
                { name: 'Δωμάτιο 103', type: 'Guest Room', status: 'COMPLETED', assets: [
                  { type: 'Smart TV', model: 'Samsung HG43AU800', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                ]},
                { name: 'Δωμάτιο 104', type: 'Guest Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Smart TV', model: 'Samsung HG43AU800', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'INSTALLED' },
                ]},
                { name: 'Δωμάτιο 105', type: 'Guest Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Smart TV', model: 'Samsung HG43AU800', status: 'INSTALLED' },
                ]},
                { name: 'Suite 110', type: 'Suite', status: 'IN_PROGRESS', assets: [
                  { type: 'Smart TV', model: 'Samsung HG55AU800', status: 'INSTALLED' },
                  { type: 'Smart TV', model: 'Samsung HG43AU800', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'INSTALLED' },
                ]},
                { name: 'Comms Room 1ου', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
                { name: 'Διάδρομος 1ου', type: 'Corridor', status: 'COMPLETED', assets: [
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                ]},
              ],
            },
            {
              name: '2ος Όροφος', level: 2,
              rooms: [
                { name: 'Δωμάτιο 201', type: 'Guest Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Smart TV', model: 'Samsung HG43AU800', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'INSTALLED' },
                ]},
                { name: 'Δωμάτιο 202', type: 'Guest Room', status: 'NOT_STARTED', assets: [] },
                { name: 'Δωμάτιο 203', type: 'Guest Room', status: 'NOT_STARTED', assets: [] },
                { name: 'Δωμάτιο 204', type: 'Guest Room', status: 'NOT_STARTED', assets: [] },
                { name: 'Suite 210', type: 'Suite', status: 'NOT_STARTED', assets: [] },
                { name: 'Comms Room 2ου', type: 'Comms Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'INSTALLED' },
                ]},
              ],
            },
            {
              name: 'Rooftop', level: 5,
              rooms: [
                { name: 'Pool Bar', type: 'Bar', status: 'NOT_STARTED', assets: [] },
                { name: 'Pool Area', type: 'Pool Area', status: 'NOT_STARTED', assets: [] },
              ],
            },
          ],
        },
        {
          name: 'Συνεδριακό Κέντρο',
          floors: [
            {
              name: 'Ισόγειο', level: 0,
              rooms: [
                { name: 'Αίθουσα "Παρθενών"', type: 'Meeting Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR56', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Cisco Meraki MR56', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                  { type: 'Digital Signage', model: 'LG 55UH5J-H', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HDBW2431E-S', status: 'INSTALLED' },
                ]},
                { name: 'Αίθουσα "Ολυμπία"', type: 'Meeting Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'INSTALLED' },
                  { type: 'Digital Signage', model: 'Samsung QM55R', status: 'INSTALLED' },
                ]},
                { name: 'Foyer', type: 'Lobby', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                ]},
              ],
            },
          ],
        },
      ],
      extraStock: [
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', count: 25 },
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', count: 10 },
        { type: 'Smart TV', model: 'Samsung HG43AU800', count: 30 },
        { type: 'Smart TV', model: 'Samsung HG55AU800', count: 5 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', count: 15 },
        { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', count: 4 },
        { type: 'UPS', model: 'APC Smart-UPS 1500VA', count: 3 },
      ],
      plannedAssets: [
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', count: 5 },
        { type: 'Smart TV', model: 'Samsung HG43AU800', count: 20 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', count: 8 },
      ],
    },

    // ============================================
    // PROJECT 2: ΒΙΟΜΗΧΑΝΙΑ
    // ============================================
    {
      name: 'Παπαδόπουλοι ΑΒΕΕ - Δίκτυο Εργοστασίου',
      clientName: 'Αφοί Παπαδόπουλοι ΑΒΕΕ',
      description: 'Εγκατάσταση βιομηχανικού δικτύου, CCTV περιμετρικής ασφάλειας και WiFi κάλυψη σε εργοστάσιο τροφίμων 12.000 τ.μ.',
      location: 'ΒΙ.ΠΕ. Σίνδου, Θεσσαλονίκη',
      status: 'IN_PROGRESS',
      buildings: [
        {
          name: 'Κτίριο Παραγωγής',
          floors: [
            {
              name: 'Ισόγειο Παραγωγής', level: 0,
              rooms: [
                { name: 'Γραμμή Παραγωγής Α', type: 'Production Area', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Aruba AP-635', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Aruba AP-635', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Aruba CX 6300', status: 'CONFIGURED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', status: 'INSTALLED' },
                ]},
                { name: 'Γραμμή Παραγωγής Β', type: 'Production Area', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Aruba AP-635', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', status: 'INSTALLED' },
                ]},
                { name: 'Ψυκτικός Θάλαμος', type: 'Cold Storage', status: 'COMPLETED', assets: [
                  { type: 'IP Camera', model: 'Dahua IPC-HDBW2431E-S', status: 'VERIFIED' },
                  { type: 'Sensor', model: 'MikroTik hAP ax3', status: 'INSTALLED' },
                ]},
                { name: 'Αποθήκη Α\' Υλών', type: 'Warehouse', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Aruba AP-515', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', status: 'INSTALLED' },
                ]},
                { name: 'Loading Dock', type: 'Loading Dock', status: 'IN_PROGRESS', assets: [
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Aruba AP-515', status: 'INSTALLED' },
                ]},
                { name: 'MDF Room', type: 'Server Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Aruba CX 6300', status: 'CONFIGURED' },
                  { type: 'Network Switch', model: 'Aruba CX 6300', status: 'CONFIGURED' },
                  { type: 'Server', model: 'Dell PowerEdge R650xs', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 5000VA', status: 'VERIFIED' },
                  { type: 'UPS', model: 'APC Smart-UPS 3000VA', status: 'VERIFIED' },
                  { type: 'Firewall', model: 'Fortinet FortiGate 100F', status: 'CONFIGURED' },
                  { type: 'NVR/DVR', model: 'Hikvision DS-7732NI-K4', status: 'CONFIGURED' },
                  { type: 'Router', model: 'Cisco ISR 4331', status: 'CONFIGURED' },
                ]},
              ],
            },
            {
              name: '1ος Όροφος - Γραφεία', level: 1,
              rooms: [
                { name: 'Γραφείο Διεύθυνσης', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Ubiquiti USW-Lite-16-PoE', status: 'CONFIGURED' },
                ]},
                { name: 'Λογιστήριο', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                ]},
                { name: 'Αίθουσα Συσκέψεων', type: 'Meeting Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'Smart TV', model: 'Samsung HG55AU800', status: 'INSTALLED' },
                ]},
                { name: 'IDF Room', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
              ],
            },
          ],
        },
        {
          name: 'Κτίριο Αποθήκευσης',
          floors: [
            {
              name: 'Κεντρική Αποθήκη', level: 0,
              rooms: [
                { name: 'Αποθήκη Τελικών Προϊόντων', type: 'Warehouse', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Aruba AP-635', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Aruba AP-635', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', status: 'INSTALLED' },
                ]},
                { name: 'Γραφείο Αποθήκης', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                ]},
              ],
            },
          ],
        },
      ],
      extraStock: [
        { type: 'Access Point', model: 'Aruba AP-635', count: 8 },
        { type: 'Access Point', model: 'Aruba AP-515', count: 5 },
        { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', count: 10 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', count: 6 },
        { type: 'Network Switch', model: 'Aruba CX 6300', count: 3 },
        { type: 'UPS', model: 'APC Smart-UPS 1500VA', count: 2 },
      ],
      plannedAssets: [
        { type: 'Access Point', model: 'Aruba AP-635', count: 4 },
        { type: 'IP Camera', model: 'Dahua IPC-HFW2831T-ZAS', count: 6 },
      ],
    },

    // ============================================
    // PROJECT 3: SUPER MARKET
    // ============================================
    {
      name: 'Galaxias Super Market - Αναβάθμιση Δικτύου',
      clientName: 'Super Market "Ο Γαλαξίας"',
      description: 'Αναβάθμιση δικτυακής υποδομής, εγκατάσταση WiFi πελατών, CCTV και POS networking σε κατάστημα 3.500 τ.μ.',
      location: 'Λεωφ. Κηφισίας 186, Χαλάνδρι',
      status: 'IN_PROGRESS',
      buildings: [
        {
          name: 'Κατάστημα Χαλανδρίου',
          floors: [
            {
              name: 'Ισόγειο - Κατάστημα', level: 0,
              rooms: [
                { name: 'Sales Floor', type: 'Sales Floor', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                ]},
                { name: 'Ταμεία', type: 'Checkout Area', status: 'IN_PROGRESS', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'CONFIGURED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                ]},
                { name: 'Ψυγεία & Κατεψυγμένα', type: 'Cold Storage', status: 'COMPLETED', assets: [
                  { type: 'IP Camera', model: 'Dahua IPC-HDBW2431E-S', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                ]},
                { name: 'Αποθήκη Πίσω', type: 'Warehouse', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Dahua IPC-HDBW2431E-S', status: 'INSTALLED' },
                ]},
                { name: 'Γραφείο Διεύθυνσης', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Ubiquiti USW-Lite-16-PoE', status: 'CONFIGURED' },
                ]},
                { name: 'Server Room', type: 'Server Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-48-PoE', status: 'CONFIGURED' },
                  { type: 'Router', model: 'Ubiquiti UDM Pro', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 3000VA', status: 'VERIFIED' },
                  { type: 'NVR/DVR', model: 'Hikvision DS-7616NI-K2', status: 'CONFIGURED' },
                  { type: 'Server', model: 'Dell PowerEdge R650xs', status: 'CONFIGURED' },
                ]},
                { name: 'Security Room', type: 'Security Room', status: 'COMPLETED', assets: [
                  { type: 'Smart TV', model: 'Samsung HG55AU800', status: 'INSTALLED' },
                ]},
                { name: 'Loading Dock', type: 'Loading Dock', status: 'IN_PROGRESS', assets: [
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                ]},
              ],
            },
            {
              name: 'Υπόγειο - Parking', level: -1,
              rooms: [
                { name: 'Parking Πελατών', type: 'Parking', status: 'IN_PROGRESS', assets: [
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', status: 'INSTALLED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'INSTALLED' },
                ]},
              ],
            },
          ],
        },
      ],
      extraStock: [
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', count: 5 },
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', count: 3 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', count: 8 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', count: 4 },
        { type: 'Network Switch', model: 'Ubiquiti USW-Lite-16-PoE', count: 2 },
      ],
      plannedAssets: [
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', count: 2 },
        { type: 'Digital Signage', model: 'LG 55UH5J-H', count: 3 },
      ],
    },

    // ============================================
    // PROJECT 4: ΝΟΣΟΚΟΜΕΙΟ
    // ============================================
    {
      name: 'Νοσοκομείο "Υγεία" Πάτρας - Healthcare Network',
      clientName: 'Νοσοκομείο "Υγεία Πάτρας"',
      description: 'Healthcare-grade δίκτυο με redundancy, WiFi κάλυψη ασθενών/προσωπικού, CCTV και VoIP τηλεφωνία σε νοσοκομείο 200 κλινών',
      location: 'Κορίνθου 256, Πάτρα',
      status: 'IN_PROGRESS',
      buildings: [
        {
          name: 'Κεντρικό Κτίριο',
          floors: [
            {
              name: 'Υπόγειο - Τεχνικά', level: -1,
              rooms: [
                { name: 'Data Center', type: 'Server Room', status: 'COMPLETED', assets: [
                  { type: 'Server', model: 'Dell PowerEdge R750xs', status: 'CONFIGURED' },
                  { type: 'Server', model: 'Dell PowerEdge R750xs', status: 'CONFIGURED' },
                  { type: 'Server', model: 'HP ProLiant DL380 Gen10', status: 'CONFIGURED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9300-48P', status: 'CONFIGURED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9300-48P', status: 'CONFIGURED' },
                  { type: 'Firewall', model: 'Fortinet FortiGate 100F', status: 'CONFIGURED' },
                  { type: 'Firewall', model: 'Cisco Firepower 1010', status: 'CONFIGURED' },
                  { type: 'Router', model: 'Cisco ISR 4331', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 5000VA', status: 'VERIFIED' },
                  { type: 'UPS', model: 'APC Smart-UPS 5000VA', status: 'VERIFIED' },
                  { type: 'NVR/DVR', model: 'Hikvision DS-7732NI-K4', status: 'CONFIGURED' },
                  { type: 'NVR/DVR', model: 'Hikvision DS-7732NI-K4', status: 'CONFIGURED' },
                ]},
                { name: 'Μηχανοστάσιο', type: 'Mechanical Room', status: 'COMPLETED', assets: [
                  { type: 'IP Camera', model: 'Dahua IPC-HDBW2431E-S', status: 'INSTALLED' },
                ]},
              ],
            },
            {
              name: 'Ισόγειο', level: 0,
              rooms: [
                { name: 'Reception & Εισαγωγές', type: 'Reception', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR56', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                  { type: 'Digital Signage', model: 'Samsung QM55R', status: 'INSTALLED' },
                ]},
                { name: 'Φαρμακείο', type: 'Pharmacy', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                ]},
                { name: 'Ακτινολογικό', type: 'Lab', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'INSTALLED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                ]},
                { name: 'Εργαστήρια', type: 'Lab', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'INSTALLED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'INSTALLED' },
                ]},
                { name: 'IDF Ισογείου', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
              ],
            },
            {
              name: '1ος - Παθολογική', level: 1,
              rooms: [
                { name: 'Θάλαμος 101 (4κλινος)', type: 'Patient Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'VERIFIED' },
                  { type: 'Smart TV', model: 'LG 55UQ751C', status: 'INSTALLED' },
                ]},
                { name: 'Θάλαμος 102 (4κλινος)', type: 'Patient Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'VERIFIED' },
                  { type: 'Smart TV', model: 'LG 55UQ751C', status: 'INSTALLED' },
                ]},
                { name: 'Θάλαμος 103 (2κλινος)', type: 'Patient Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'INSTALLED' },
                ]},
                { name: 'Θάλαμος 104 (μονόκλινος)', type: 'Patient Room', status: 'NOT_STARTED', assets: [] },
                { name: 'Nursing Station', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                ]},
                { name: 'IDF 1ου Ορόφου', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
                { name: 'Διάδρομος 1ου', type: 'Corridor', status: 'COMPLETED', assets: [
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', status: 'INSTALLED' },
                ]},
              ],
            },
            {
              name: '2ος - Χειρουργική', level: 2,
              rooms: [
                { name: 'Χειρουργείο Α', type: 'Operating Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR56', status: 'INSTALLED' },
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'INSTALLED' },
                ]},
                { name: 'Χειρουργείο Β', type: 'Operating Room', status: 'NOT_STARTED', assets: [] },
                { name: 'Ανάνηψη', type: 'Patient Room', status: 'IN_PROGRESS', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'INSTALLED' },
                ]},
                { name: 'IDF 2ου Ορόφου', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'Eaton 5PX 1500', status: 'VERIFIED' },
                ]},
              ],
            },
          ],
        },
        {
          name: 'Πτέρυγα ΤΕΠ',
          floors: [
            {
              name: 'Ισόγειο - Επείγοντα', level: 0,
              rooms: [
                { name: 'Triage', type: 'Reception', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR56', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Hikvision DS-2CD2183G2-I', status: 'INSTALLED' },
                ]},
                { name: 'Εξεταστήριο 1', type: 'Patient Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'VERIFIED' },
                ]},
                { name: 'Εξεταστήριο 2', type: 'Patient Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Cisco Meraki MR46', status: 'VERIFIED' },
                ]},
                { name: 'IDF ΤΕΠ', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', status: 'CONFIGURED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
              ],
            },
          ],
        },
      ],
      extraStock: [
        { type: 'Access Point', model: 'Cisco Meraki MR46', count: 20 },
        { type: 'Access Point', model: 'Cisco Meraki MR56', count: 5 },
        { type: 'Network Switch', model: 'Cisco Catalyst 9200-24P', count: 6 },
        { type: 'Smart TV', model: 'LG 55UQ751C', count: 15 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', count: 12 },
        { type: 'UPS', model: 'APC Smart-UPS 1500VA', count: 4 },
        { type: 'VoIP Phone', model: 'Cisco Meraki MR46', count: 20 },
      ],
      plannedAssets: [
        { type: 'Access Point', model: 'Cisco Meraki MR46', count: 15 },
        { type: 'Smart TV', model: 'LG 55UQ751C', count: 10 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2143G2-I', count: 8 },
      ],
    },

    // ============================================
    // PROJECT 5: ΓΡΑΦΕΙΑ TECH
    // ============================================
    {
      name: 'TechSpace Hub - Smart Office Network',
      clientName: 'TechSpace Offices',
      description: 'High-density WiFi, καλωδίωση Cat6A, CCTV και access control σε σύγχρονο κτίριο γραφείων 6 ορόφων στο Μαρούσι',
      location: 'Λεωφ. Κηφισίας 44, Μαρούσι',
      status: 'COMPLETED',
      buildings: [
        {
          name: 'TechSpace Tower',
          floors: [
            {
              name: 'Ισόγειο', level: 0,
              rooms: [
                { name: 'Lobby & Reception', type: 'Reception', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Ubiquiti G4 Dome', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Ubiquiti G4 Dome', status: 'VERIFIED' },
                  { type: 'Digital Signage', model: 'Samsung QM55R', status: 'VERIFIED' },
                ]},
                { name: 'Καφετέρια', type: 'Restaurant', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                ]},
                { name: 'MDF Room', type: 'Server Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-48-PoE', status: 'VERIFIED' },
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-48-PoE', status: 'VERIFIED' },
                  { type: 'Router', model: 'Ubiquiti UDM Pro', status: 'VERIFIED' },
                  { type: 'UPS', model: 'APC Smart-UPS 3000VA', status: 'VERIFIED' },
                  { type: 'NVR/DVR', model: 'Dahua NVR4216-16P-4KS2', status: 'VERIFIED' },
                  { type: 'Server', model: 'Dell PowerEdge R650xs', status: 'VERIFIED' },
                ]},
              ],
            },
            {
              name: '1ος Όροφος - Open Plan', level: 1,
              rooms: [
                { name: 'Open Space A', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Ubiquiti G4 Dome', status: 'VERIFIED' },
                ]},
                { name: 'Meeting Room "Alpha"', type: 'Meeting Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'Smart TV', model: 'Samsung HG55AU800', status: 'VERIFIED' },
                ]},
                { name: 'Meeting Room "Beta"', type: 'Meeting Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'Smart TV', model: 'Samsung HG55AU800', status: 'VERIFIED' },
                ]},
                { name: 'Phone Booth 1', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', status: 'VERIFIED' },
                ]},
                { name: 'IDF 1ου', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'VERIFIED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
              ],
            },
            {
              name: '2ος Όροφος - Startup Hub', level: 2,
              rooms: [
                { name: 'Co-working Space', type: 'Office', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'VERIFIED' },
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Enterprise', status: 'VERIFIED' },
                  { type: 'IP Camera', model: 'Ubiquiti G4 Dome', status: 'VERIFIED' },
                ]},
                { name: 'Meeting Room "Gamma"', type: 'Meeting Room', status: 'COMPLETED', assets: [
                  { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', status: 'VERIFIED' },
                  { type: 'Smart TV', model: 'Samsung HG55AU800', status: 'VERIFIED' },
                ]},
                { name: 'IDF 2ου', type: 'Comms Room', status: 'COMPLETED', assets: [
                  { type: 'Network Switch', model: 'Ubiquiti USW-Pro-24-PoE', status: 'VERIFIED' },
                  { type: 'UPS', model: 'APC Smart-UPS 1500VA', status: 'VERIFIED' },
                ]},
              ],
            },
          ],
        },
      ],
      extraStock: [
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Pro', count: 5 },
        { type: 'Access Point', model: 'Ubiquiti UniFi U6 Lite', count: 5 },
        { type: 'IP Camera', model: 'Ubiquiti G4 Dome', count: 4 },
        { type: 'Network Switch', model: 'Ubiquiti USW-Lite-16-PoE', count: 3 },
      ],
      plannedAssets: [],
    },

    // ============================================
    // PROJECT 6: ΣΧΟΛΕΙΟ (ΔΗΜΟΣΙΟ)
    // ============================================
    {
      name: 'Δημοτικό Σχολείο Ηρακλείου - Ψηφιακή Αναβάθμιση',
      clientName: 'Δήμος Ηρακλείου',
      description: 'Εγκατάσταση WiFi δικτύου, interactive displays, CCTV εξωτερικών χώρων και δομημένη καλωδίωση σε σχολικό συγκρότημα',
      location: 'Αγ. Τίτου 1, Ηράκλειο Κρήτης',
      status: 'PLANNING',
      buildings: [
        {
          name: 'Κτίριο Α - Αίθουσες',
          floors: [
            {
              name: 'Ισόγειο', level: 0,
              rooms: [
                { name: 'Αίθουσα Α1', type: 'Classroom', status: 'NOT_STARTED', assets: [] },
                { name: 'Αίθουσα Α2', type: 'Classroom', status: 'NOT_STARTED', assets: [] },
                { name: 'Αίθουσα Α3', type: 'Classroom', status: 'NOT_STARTED', assets: [] },
                { name: 'Γραφείο Διεύθυνσης', type: 'Office', status: 'NOT_STARTED', assets: [] },
                { name: 'Server Room', type: 'Server Room', status: 'NOT_STARTED', assets: [] },
              ],
            },
            {
              name: '1ος Όροφος', level: 1,
              rooms: [
                { name: 'Αίθουσα Β1', type: 'Classroom', status: 'NOT_STARTED', assets: [] },
                { name: 'Αίθουσα Β2', type: 'Classroom', status: 'NOT_STARTED', assets: [] },
                { name: 'Αίθουσα Β3', type: 'Classroom', status: 'NOT_STARTED', assets: [] },
                { name: 'Εργαστήριο Πληροφορικής', type: 'Lab', status: 'NOT_STARTED', assets: [] },
                { name: 'Βιβλιοθήκη', type: 'Library', status: 'NOT_STARTED', assets: [] },
              ],
            },
          ],
        },
        {
          name: 'Κτίριο Β - Γυμναστήριο & Αίθουσα Εκδηλώσεων',
          floors: [
            {
              name: 'Κεντρικός Χώρος', level: 0,
              rooms: [
                { name: 'Γυμναστήριο', type: 'Gym', status: 'NOT_STARTED', assets: [] },
                { name: 'Αίθουσα Εκδηλώσεων', type: 'Auditorium', status: 'NOT_STARTED', assets: [] },
              ],
            },
          ],
        },
      ],
      extraStock: [
        { type: 'Access Point', model: 'TP-Link EAP670', count: 15 },
        { type: 'Network Switch', model: 'TP-Link TL-SG3428XMP', count: 4 },
        { type: 'IP Camera', model: 'Hikvision DS-2CD2347G2-L', count: 8 },
        { type: 'Router', model: 'MikroTik CCR2004', count: 1 },
        { type: 'UPS', model: 'APC Smart-UPS 1500VA', count: 2 },
        { type: 'NVR/DVR', model: 'Hikvision DS-7616NI-K2', count: 1 },
        { type: 'Server', model: 'Dell PowerEdge R650xs', count: 1 },
        { type: 'Digital Signage', model: 'LG 55UH5J-H', count: 12 },
      ],
      plannedAssets: [
        { type: 'Access Point', model: 'TP-Link EAP670', count: 5 },
        { type: 'Digital Signage', model: 'LG 55UH5J-H', count: 6 },
        { type: 'Network Switch', model: 'TP-Link TL-SG3428XMP', count: 2 },
      ],
    },
  ];

  // ============================================
  // CREATE PROJECTS
  // ============================================
  const modelsList = await prisma.lookupAssetModel.findMany({ include: { manufacturer: true } });

  for (let projIdx = 0; projIdx < projectDefs.length; projIdx++) {
    const projDef = projectDefs[projIdx];
    console.log(`\n🏗️  Creating project: ${projDef.name}...`);

    const project = await prisma.project.create({
      data: {
        name: projDef.name,
        clientName: projDef.clientName,
        clientId: clients[projDef.clientName]?.id,
        description: projDef.description,
        location: projDef.location,
        status: projDef.status,
        startDate: randomDate(180),
        endDate: projDef.status === 'COMPLETED' ? randomDate(15) : undefined,
      },
    });

    // Project members
    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: admin.id, role: 'ADMIN' },
        { projectId: project.id, userId: pm1.id, role: 'PM' },
        { projectId: project.id, userId: pm2.id, role: 'PM' },
        { projectId: project.id, userId: tech1.id, role: 'TECHNICIAN' },
        { projectId: project.id, userId: tech2.id, role: 'TECHNICIAN' },
        { projectId: project.id, userId: tech3.id, role: 'TECHNICIAN' },
        { projectId: project.id, userId: clientUser.id, role: 'CLIENT' },
      ],
    });

    // ============================================
    // INVENTORY MATERIALS
    // ============================================
    const materials = [
      { itemType: 'Cable', description: 'Cat6 UTP Cable', unit: 'm', quantityReceived: 5000, quantityUsed: Math.floor(Math.random() * 2500) },
      { itemType: 'Cable', description: 'Cat6A STP Cable', unit: 'm', quantityReceived: 2000, quantityUsed: Math.floor(Math.random() * 1000) },
      { itemType: 'Cable', description: 'Fiber OM4 Multimode', unit: 'm', quantityReceived: 500, quantityUsed: Math.floor(Math.random() * 200) },
      { itemType: 'Connector', description: 'RJ45 Cat6 Connectors', unit: 'pcs', quantityReceived: 1000, quantityUsed: Math.floor(Math.random() * 500) },
      { itemType: 'Connector', description: 'Keystone Jacks Cat6', unit: 'pcs', quantityReceived: 300, quantityUsed: Math.floor(Math.random() * 150) },
      { itemType: 'Connector', description: 'Fiber LC Connectors', unit: 'pcs', quantityReceived: 100, quantityUsed: Math.floor(Math.random() * 40) },
      { itemType: 'Patch Panel', description: 'Patch Panel 24-port Cat6', unit: 'pcs', quantityReceived: 12, quantityUsed: Math.floor(Math.random() * 8) },
      { itemType: 'Patch Panel', description: 'Patch Panel 48-port Cat6', unit: 'pcs', quantityReceived: 6, quantityUsed: Math.floor(Math.random() * 4) },
      { itemType: 'Mounting', description: 'AP Mounting Brackets', unit: 'pcs', quantityReceived: 80, quantityUsed: Math.floor(Math.random() * 40) },
      { itemType: 'Mounting', description: 'Camera Wall Mounts', unit: 'pcs', quantityReceived: 50, quantityUsed: Math.floor(Math.random() * 25) },
      { itemType: 'Mounting', description: 'TV Wall Brackets', unit: 'pcs', quantityReceived: 30, quantityUsed: Math.floor(Math.random() * 15) },
      { itemType: 'Rack', description: 'Server Rack 42U', unit: 'pcs', quantityReceived: 2, quantityUsed: Math.floor(Math.random() * 2) },
      { itemType: 'Rack', description: 'Wall Cabinet 12U', unit: 'pcs', quantityReceived: 8, quantityUsed: Math.floor(Math.random() * 5) },
      { itemType: 'Cable Management', description: 'Cable Ties (pack of 100)', unit: 'pack', quantityReceived: 30, quantityUsed: Math.floor(Math.random() * 15) },
      { itemType: 'Cable Management', description: 'Cable Tray 2m', unit: 'pcs', quantityReceived: 25, quantityUsed: Math.floor(Math.random() * 12) },
      { itemType: 'Labels', description: 'Cable Labels (roll)', unit: 'roll', quantityReceived: 10, quantityUsed: Math.floor(Math.random() * 5) },
      { itemType: 'Tools', description: 'Face Plates Single', unit: 'pcs', quantityReceived: 150, quantityUsed: Math.floor(Math.random() * 75) },
      { itemType: 'Cable', description: 'HDMI Cable 2m', unit: 'pcs', quantityReceived: 50, quantityUsed: Math.floor(Math.random() * 25) },
      { itemType: 'Cable', description: 'Power Extension 3m', unit: 'pcs', quantityReceived: 40, quantityUsed: Math.floor(Math.random() * 20) },
    ];

    for (const mat of materials) {
      await prisma.inventoryItem.create({ data: { projectId: project.id, ...mat } });
    }
    console.log('  📦 Inventory created');

    // ============================================
    // BUILDINGS → FLOORS → ROOMS → ASSETS
    // ============================================
    let assetCounter = 0;
    const projectPrefix = `P${String(projIdx + 1).padStart(2, '0')}`;
    let labelCounter = 0;

    for (const bldgDef of projDef.buildings) {
      const building = await prisma.building.create({
        data: { projectId: project.id, name: bldgDef.name },
      });

      for (const floorDef of bldgDef.floors) {
        const floor = await prisma.floor.create({
          data: { buildingId: building.id, name: floorDef.name, level: floorDef.level },
        });

        for (let roomIdx = 0; roomIdx < floorDef.rooms.length; roomIdx++) {
          const roomDef = floorDef.rooms[roomIdx];
          const room = await prisma.room.create({
            data: {
              floorId: floor.id,
              name: roomDef.name,
              type: roomDef.type,
              status: roomDef.status,
              pinX: 80 + (roomIdx % 4) * 160,
              pinY: 80 + Math.floor(roomIdx / 4) * 140,
            },
          });

          // Create assets for this room
          for (const assetDef of roomDef.assets) {
            assetCounter++;
            const modelKey = `${assetDef.model}`;
            const modelRecord = modelsList.find(m => `${m.manufacturer.name} ${m.name}` === modelKey);

            const asset = await prisma.asset.create({
              data: {
                projectId: project.id,
                roomId: room.id,
                name: `${assetDef.type} ${String(assetCounter).padStart(3, '0')}`,
                assetTypeId: assetTypes[assetDef.type]?.id,
                model: assetDef.model,
                serialNumber: generateSerial(),
                macAddress: generateMac(),
                ipAddress: generateIp('10.0.' + (projIdx + 1), assetCounter % 254 + 1),
                status: assetDef.status,
                installedById: randomFrom(techs).id,
                installedAt: randomDate(60),
                pinX: 50 + Math.random() * 250,
                pinY: 50 + Math.random() * 180,
              },
            });

            // Create label
            labelCounter++;
            const labelCode = `${projectPrefix}-AST-${String(labelCounter).padStart(4, '0')}`;
            await prisma.label.create({
              data: {
                projectId: project.id,
                code: labelCode,
                type: 'ASSET',
                status: 'ASSIGNED',
                assetId: asset.id,
                assignedAt: new Date(),
                printedAt: Math.random() > 0.2 ? new Date() : null,
              },
            });
            await prisma.asset.update({ where: { id: asset.id }, data: { labelCode } });

            // Create checklist for installed assets
            if (assetDef.status !== 'INSTALLED' || Math.random() > 0.3) {
              const template = await prisma.checklistTemplate.findFirst({
                where: { assetTypeId: assetTypes[assetDef.type]?.id, isDefault: true },
                include: { items: true },
              });

              if (template) {
                const clStatuses: ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED')[] =
                  assetDef.status === 'VERIFIED' ? ['COMPLETED'] :
                  assetDef.status === 'CONFIGURED' ? ['COMPLETED', 'IN_PROGRESS'] :
                  ['NOT_STARTED', 'IN_PROGRESS'];
                const clStatus = randomFrom(clStatuses);

                const checklist = await prisma.checklist.create({
                  data: {
                    assetId: asset.id,
                    type: 'EQUIPMENT',
                    status: clStatus,
                    templateId: template.id,
                    assignedToId: randomFrom(techs).id,
                    completedAt: clStatus === 'COMPLETED' ? new Date() : null,
                  },
                });

                for (const item of template.items) {
                  const completed = clStatus === 'COMPLETED' || (clStatus === 'IN_PROGRESS' && Math.random() > 0.4);
                  await prisma.checklistItem.create({
                    data: {
                      checklistId: checklist.id,
                      name: item.name,
                      description: item.description,
                      requiresPhoto: item.requiresPhoto,
                      isRequired: item.isRequired,
                      order: item.order,
                      sourceItemId: item.id,
                      completed,
                      completedById: completed ? randomFrom(techs).id : null,
                      completedAt: completed ? randomDate(30) : null,
                    },
                  });
                }
              }
            }
          }

          // Random issues for some rooms
          if (roomDef.status !== 'NOT_STARTED' && Math.random() > 0.75) {
            const issues = [
              { title: 'Χαμηλό σήμα WiFi', desc: 'Το σήμα WiFi στον χώρο είναι κάτω από -70dBm. Χρειάζεται επιπλέον AP ή αλλαγή θέσης.' },
              { title: 'Δεν λειτουργεί η κάμερα', desc: 'Η κάμερα δεν εμφανίζεται στο NVR. Πιθανό πρόβλημα με PoE ή καλώδιο.' },
              { title: 'Πρόβλημα PoE στο switch', desc: 'Τα ports 15-20 δεν παρέχουν PoE. Χρειάζεται έλεγχος firmware/hardware.' },
              { title: 'Κακή ποιότητα εικόνας κάμερας', desc: 'Η νυχτερινή λήψη έχει θόρυβο. Πρέπει να ελεγχθεί ο φωτισμός IR.' },
              { title: 'Καλώδιο δεν περνάει δοκιμή', desc: 'Το Cat6 καλώδιο στη θέση 23 αποτυγχάνει στο cable test. Χρειάζεται αντικατάσταση.' },
              { title: 'TV δεν συνδέεται στο δίκτυο', desc: 'Η Smart TV δεν λαμβάνει IP μέσω DHCP. Ελέγξτε VLAN configuration.' },
            ];
            const issue = randomFrom(issues);
            await prisma.issue.create({
              data: {
                projectId: project.id,
                roomId: room.id,
                title: issue.title,
                description: issue.desc,
                priority: randomFrom(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const),
                status: randomFrom(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const),
                createdById: randomFrom(techs).id,
                causedBy: randomFrom(issueCauses),
              },
            });
          }
        }
      }
    }
    console.log(`  🏢 Buildings/floors/rooms/assets created`);

    // ============================================
    // EXTRA STOCK (IN_STOCK - αποθέματα)
    // ============================================
    for (const stockDef of projDef.extraStock) {
      for (let i = 0; i < stockDef.count; i++) {
        assetCounter++;
        await prisma.asset.create({
          data: {
            projectId: project.id,
            name: `${stockDef.type} ${String(assetCounter).padStart(3, '0')}`,
            assetTypeId: assetTypes[stockDef.type]?.id,
            model: stockDef.model,
            serialNumber: generateSerial(),
            macAddress: generateMac(),
            status: 'IN_STOCK',
          },
        });
      }
    }
    console.log(`  📦 Extra stock created (${projDef.extraStock.reduce((s, e) => s + e.count, 0)} items)`);

    // ============================================
    // PLANNED ASSETS (παραγγελίες)
    // ============================================
    for (const plannedDef of projDef.plannedAssets) {
      for (let i = 0; i < plannedDef.count; i++) {
        assetCounter++;
        await prisma.asset.create({
          data: {
            projectId: project.id,
            name: `${plannedDef.type} ${String(assetCounter).padStart(3, '0')}`,
            assetTypeId: assetTypes[plannedDef.type]?.id,
            model: plannedDef.model,
            status: 'PLANNED',
            notes: 'Αναμένεται παράδοση',
          },
        });
      }
    }
    console.log(`  🚚 Planned assets created (${projDef.plannedAssets.reduce((s, e) => s + e.count, 0)} items)`);

    // ============================================
    // UNASSIGNED LABELS (for future)
    // ============================================
    const labelTypes: ('CABLE' | 'RACK' | 'ASSET')[] = ['ASSET', 'CABLE', 'RACK'];
    for (let i = 0; i < 30; i++) {
      labelCounter++;
      const lt = randomFrom(labelTypes);
      const prefix = lt === 'ASSET' ? 'AST' : lt === 'CABLE' ? 'CBL' : 'RCK';
      await prisma.label.create({
        data: {
          projectId: project.id,
          code: `${projectPrefix}-${prefix}-${String(labelCounter).padStart(4, '0')}`,
          type: lt,
          status: Math.random() > 0.5 ? 'PRINTED' : 'AVAILABLE',
          printedAt: Math.random() > 0.5 ? new Date() : null,
        },
      });
    }

    console.log(`  ✅ Project "${projDef.name}" completed`);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Demo seed completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Clients: ${await prisma.client.count()}`);
  console.log(`   - Projects: ${await prisma.project.count()}`);
  console.log(`   - Buildings: ${await prisma.building.count()}`);
  console.log(`   - Floors: ${await prisma.floor.count()}`);
  console.log(`   - Rooms: ${await prisma.room.count()}`);
  console.log(`   - Assets: ${await prisma.asset.count()}`);
  console.log(`   - Labels: ${await prisma.label.count()}`);
  console.log(`   - Checklist Templates: ${await prisma.checklistTemplate.count()}`);
  console.log(`   - Checklists: ${await prisma.checklist.count()}`);
  console.log(`   - Issues: ${await prisma.issue.count()}`);
  console.log(`   - Inventory Items: ${await prisma.inventoryItem.count()}`);
  console.log('');
  console.log('🔐 Test Accounts:');
  console.log('   - admin@synax.gr / admin123 (ADMIN)');
  console.log('   - pm@synax.gr / pm123456 (PM)');
  console.log('   - maria@synax.gr / pm123456 (PM)');
  console.log('   - tech1@synax.gr / tech123456 (TECHNICIAN)');
  console.log('   - tech2@synax.gr / tech123456 (TECHNICIAN)');
  console.log('   - tech3@synax.gr / tech123456 (TECHNICIAN)');
  console.log('   - client@demo.gr / client123 (CLIENT)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
