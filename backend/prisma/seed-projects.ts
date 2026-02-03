import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSerialNumber(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function generateMacAddress(): string {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16)));
}

function generateIP(base: string, lastOctet: number): string {
  return `${base}.${lastOctet}`;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Starting MEGA database seed with 4 large projects...\n');

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
  // STEP 2: Create Users (20+ users)
  // ============================================
  console.log('👤 Creating users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Admins
  const admin1 = await prisma.user.create({
    data: { email: 'admin@synax.app', passwordHash, name: 'Γιώργος Παπαδόπουλος', role: 'ADMIN' },
  });
  const admin2 = await prisma.user.create({
    data: { email: 'admin2@synax.app', passwordHash, name: 'Ελένη Δημητρίου', role: 'ADMIN' },
  });

  // Project Managers
  const pm1 = await prisma.user.create({
    data: { email: 'pm1@synax.app', passwordHash, name: 'Μαρία Κωνσταντίνου', role: 'PM' },
  });
  const pm2 = await prisma.user.create({
    data: { email: 'pm2@synax.app', passwordHash, name: 'Νίκος Αντωνίου', role: 'PM' },
  });
  const pm3 = await prisma.user.create({
    data: { email: 'pm3@synax.app', passwordHash, name: 'Κατερίνα Βασιλείου', role: 'PM' },
  });
  const pm4 = await prisma.user.create({
    data: { email: 'pm4@synax.app', passwordHash, name: 'Δημήτρης Παπανικολάου', role: 'PM' },
  });

  // Technicians (12)
  const techs = await Promise.all([
    prisma.user.create({ data: { email: 'tech1@synax.app', passwordHash, name: 'Αλέξανδρος Γεωργίου', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech2@synax.app', passwordHash, name: 'Σπύρος Μαυρίδης', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech3@synax.app', passwordHash, name: 'Κώστας Παπαδάκης', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech4@synax.app', passwordHash, name: 'Γιάννης Νικολάου', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech5@synax.app', passwordHash, name: 'Μιχάλης Αλεξίου', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech6@synax.app', passwordHash, name: 'Θανάσης Κυριακού', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech7@synax.app', passwordHash, name: 'Βασίλης Οικονόμου', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech8@synax.app', passwordHash, name: 'Πέτρος Χατζής', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech9@synax.app', passwordHash, name: 'Στέφανος Λιάκος', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech10@synax.app', passwordHash, name: 'Χρήστος Δέδες', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech11@synax.app', passwordHash, name: 'Λευτέρης Παππάς', role: 'TECHNICIAN' } }),
    prisma.user.create({ data: { email: 'tech12@synax.app', passwordHash, name: 'Αντώνης Σταύρου', role: 'TECHNICIAN' } }),
  ]);

  // Clients (4 - one per project)
  const clients = await Promise.all([
    prisma.user.create({ data: { email: 'client.hotel@example.gr', passwordHash, name: 'Ανδρέας Μεγαλόπουλος', role: 'CLIENT' } }),
    prisma.user.create({ data: { email: 'client.retail@example.gr', passwordHash, name: 'Σοφία Καραγιάννη', role: 'CLIENT' } }),
    prisma.user.create({ data: { email: 'client.office@example.gr', passwordHash, name: 'Παναγιώτης Ρήγας', role: 'CLIENT' } }),
    prisma.user.create({ data: { email: 'client.hospital@example.gr', passwordHash, name: 'Δρ. Ιωάννα Σταματίου', role: 'CLIENT' } }),
  ]);

  console.log(`✅ Created ${2 + 4 + techs.length + clients.length} users\n`);

  // ============================================
  // STEP 3: Create Asset Types (Extended)
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
            { name: 'Τερματισμός καλωδίου', requiresPhoto: true },
            { name: 'Έλεγχος PoE', requiresPhoto: false },
          ],
          equipment: [
            { name: 'Τοποθέτηση bracket', requiresPhoto: true },
            { name: 'Μοντάρισμα AP', requiresPhoto: true },
          ],
          config: [
            { name: 'Provisioning', requiresPhoto: false },
            { name: 'Ρύθμιση SSID', requiresPhoto: false },
            { name: 'Έλεγχος σήματος', requiresPhoto: true },
          ],
          documentation: [
            { name: 'Καταγραφή MAC', requiresPhoto: false },
            { name: 'Φωτογραφία εγκατάστασης', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Network Switch',
        icon: 'network',
        checklistTemplate: {
          cabling: [{ name: 'Uplink connection', requiresPhoto: false }, { name: 'Τερματισμοί', requiresPhoto: true }],
          equipment: [{ name: 'Rack mounting', requiresPhoto: true }, { name: 'Τροφοδοσία', requiresPhoto: false }],
          config: [{ name: 'VLANs', requiresPhoto: false }, { name: 'Management IP', requiresPhoto: false }],
          documentation: [{ name: 'Port mapping', requiresPhoto: false }, { name: 'Φωτογραφία', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'IP Camera',
        icon: 'camera',
        checklistTemplate: {
          cabling: [{ name: 'Καλωδίωση', requiresPhoto: false }, { name: 'Τερματισμός RJ45', requiresPhoto: true }],
          equipment: [{ name: 'Βάση κάμερας', requiresPhoto: true }, { name: 'Ρύθμιση γωνίας', requiresPhoto: true }],
          config: [{ name: 'NVR setup', requiresPhoto: false }, { name: 'Motion detection', requiresPhoto: false }],
          documentation: [{ name: 'Screenshot', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Router',
        icon: 'router',
        checklistTemplate: {
          cabling: [{ name: 'WAN connection', requiresPhoto: false }, { name: 'LAN connections', requiresPhoto: false }],
          equipment: [{ name: 'Rack mounting', requiresPhoto: true }],
          config: [{ name: 'WAN interface', requiresPhoto: false }, { name: 'Firewall rules', requiresPhoto: false }],
          documentation: [{ name: 'Network diagram', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: { name: 'Patch Panel', icon: 'server', checklistTemplate: { cabling: [{ name: 'Punch down', requiresPhoto: true }], equipment: [{ name: 'Rack mounting', requiresPhoto: true }], config: [], documentation: [{ name: 'Port mapping', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'UPS', icon: 'battery', checklistTemplate: { cabling: [{ name: 'Input power', requiresPhoto: false }], equipment: [{ name: 'Installation', requiresPhoto: true }], config: [{ name: 'Network card', requiresPhoto: false }], documentation: [{ name: 'Test αυτονομίας', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'Smart TV', icon: 'tv', checklistTemplate: { cabling: [{ name: 'HDMI/Ethernet', requiresPhoto: false }], equipment: [{ name: 'Wall mount', requiresPhoto: true }], config: [{ name: 'IPTV setup', requiresPhoto: false }], documentation: [{ name: 'Φωτογραφία', requiresPhoto: true }] } },
    }),
    prisma.assetType.create({
      data: { name: 'Digital Signage', icon: 'monitor', checklistTemplate: { cabling: [{ name: 'Network cable', requiresPhoto: false }], equipment: [{ name: 'Mount installation', requiresPhoto: true }], config: [{ name: 'CMS connection', requiresPhoto: false }], documentation: [{ name: 'Content test', requiresPhoto: true }] } },
    }),
    prisma.assetType.create({
      data: { name: 'VoIP Phone', icon: 'phone', checklistTemplate: { cabling: [{ name: 'PoE connection', requiresPhoto: false }], equipment: [{ name: 'Desk placement', requiresPhoto: true }], config: [{ name: 'Extension setup', requiresPhoto: false }], documentation: [{ name: 'Number assignment', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'POS Terminal', icon: 'credit-card', checklistTemplate: { cabling: [{ name: 'Network/Power', requiresPhoto: false }], equipment: [{ name: 'Counter mount', requiresPhoto: true }], config: [{ name: 'POS software', requiresPhoto: false }], documentation: [{ name: 'Test transaction', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'NVR/DVR', icon: 'hard-drive', checklistTemplate: { cabling: [{ name: 'Camera connections', requiresPhoto: false }], equipment: [{ name: 'Rack mounting', requiresPhoto: true }], config: [{ name: 'Recording setup', requiresPhoto: false }], documentation: [{ name: 'Storage test', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'Server', icon: 'server', checklistTemplate: { cabling: [{ name: 'Network connections', requiresPhoto: false }], equipment: [{ name: 'Rack mounting', requiresPhoto: true }], config: [{ name: 'OS installation', requiresPhoto: false }], documentation: [{ name: 'Configuration', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'Firewall', icon: 'shield', checklistTemplate: { cabling: [{ name: 'WAN/LAN', requiresPhoto: false }], equipment: [{ name: 'Rack mounting', requiresPhoto: true }], config: [{ name: 'Security rules', requiresPhoto: false }], documentation: [{ name: 'Rule documentation', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'Wireless Controller', icon: 'radio', checklistTemplate: { cabling: [{ name: 'Network connection', requiresPhoto: false }], equipment: [{ name: 'Installation', requiresPhoto: true }], config: [{ name: 'AP provisioning', requiresPhoto: false }], documentation: [{ name: 'AP list', requiresPhoto: false }] } },
    }),
    prisma.assetType.create({
      data: { name: 'Intercom Panel', icon: 'video', checklistTemplate: { cabling: [{ name: 'PoE connection', requiresPhoto: false }], equipment: [{ name: 'Wall mount', requiresPhoto: true }], config: [{ name: 'SIP setup', requiresPhoto: false }], documentation: [{ name: 'Test call', requiresPhoto: false }] } },
    }),
  ]);

  const typeMap: Record<string, typeof assetTypes[0]> = {};
  assetTypes.forEach(t => typeMap[t.name] = t);

  console.log(`✅ Created ${assetTypes.length} asset types\n`);

  // ============================================
  // STEP 4: Create Projects
  // ============================================
  console.log('🏗️  Creating 4 large projects...\n');

  // Project data will be generated in subsequent parts
  const projectConfigs = [
    {
      name: 'Grand Athena Resort - ICT Installation',
      description: 'Πλήρης εγκατάσταση ICT υποδομής για 5* ξενοδοχείο 250 δωματίων. WiFi, CCTV, IPTV, VoIP, δομημένη καλωδίωση.',
      clientName: 'Athena Hotels Group S.A.',
      location: 'Κέρκυρα, Ελλάδα',
      status: 'IN_PROGRESS' as const,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      pm: pm1,
      client: clients[0],
      techs: [techs[0], techs[1], techs[2]],
      floorCount: 8,
      type: 'hotel',
    },
    {
      name: 'MegaMart Central - Network Infrastructure',
      description: 'Εγκατάσταση δικτύου και συστημάτων ασφαλείας για μεγάλο supermarket 15.000 τ.μ. με αποθήκη.',
      clientName: 'MegaMart Retail S.A.',
      location: 'Μαρούσι, Αθήνα',
      status: 'IN_PROGRESS' as const,
      startDate: new Date('2025-10-15'),
      endDate: new Date('2026-04-30'),
      pm: pm2,
      client: clients[1],
      techs: [techs[3], techs[4], techs[5]],
      floorCount: 3,
      type: 'retail',
    },
    {
      name: 'Olympus Business Center - Smart Building',
      description: 'Υλοποίηση smart building για κτίριο γραφείων 10 ορόφων. WiFi, CCTV, access control, VoIP, digital signage.',
      clientName: 'Olympus Real Estate',
      location: 'Παλαιό Φάληρο, Αθήνα',
      status: 'IN_PROGRESS' as const,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-05-31'),
      pm: pm3,
      client: clients[2],
      techs: [techs[6], techs[7], techs[8]],
      floorCount: 10,
      type: 'office',
    },
    {
      name: 'Ιπποκράτειο Κλινική - Healthcare IT',
      description: 'Αναβάθμιση δικτυακής υποδομής κλινικής 200 κλινών. WiFi, CCTV, VoIP, nurse call, digital signage.',
      clientName: 'Ιπποκράτειο Κλινική Α.Ε.',
      location: 'Θεσσαλονίκη, Ελλάδα',
      status: 'IN_PROGRESS' as const,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-08-31'),
      pm: pm4,
      client: clients[3],
      techs: [techs[9], techs[10], techs[11]],
      floorCount: 7,
      type: 'hospital',
    },
  ];

  // Store all created data for summary
  let totalFloors = 0;
  let totalRooms = 0;
  let totalAssets = 0;
  let totalChecklists = 0;
  let totalItems = 0;
  let totalIssues = 0;
  let totalInventory = 0;
  let totalTimeEntries = 0;
  let totalSignatures = 0;

  for (const config of projectConfigs) {
    console.log(`\n📁 Creating project: ${config.name}`);

    const project = await prisma.project.create({
      data: {
        name: config.name,
        description: config.description,
        clientName: config.clientName,
        location: config.location,
        status: config.status,
        startDate: config.startDate,
        endDate: config.endDate,
        members: {
          create: [
            { userId: admin1.id, role: 'ADMIN' },
            { userId: config.pm.id, role: 'PM' },
            ...config.techs.map(t => ({ userId: t.id, role: 'TECHNICIAN' as const })),
            { userId: config.client.id, role: 'CLIENT' },
          ],
        },
      },
    });

    // Create floors based on project type
    const floors = await createFloorsForProject(project.id, config.type, config.floorCount);
    totalFloors += floors.length;

    // Create rooms for each floor
    const allRooms: any[] = [];
    for (const floor of floors) {
      const rooms = await createRoomsForFloor(floor.id, config.type, floor.level);
      allRooms.push(...rooms);
    }
    totalRooms += allRooms.length;

    // Create assets for each room
    const allAssets: any[] = [];
    for (const room of allRooms) {
      const assets = await createAssetsForRoom(room, config.type, typeMap, config.techs);
      allAssets.push(...assets);
    }
    totalAssets += allAssets.length;

    // Create checklists for assets
    for (const asset of allAssets) {
      const { checklists, items } = await createChecklistsForAsset(asset, config.techs);
      totalChecklists += checklists;
      totalItems += items;
    }

    // Create issues
    const issues = await createIssuesForProject(project.id, allRooms, config.techs, config.pm);
    totalIssues += issues.length;

    // Create inventory
    const inventory = await createInventoryForProject(project.id, config.type, config.techs, config.pm);
    totalInventory += inventory.length;

    // Create time entries
    const timeEntries = await createTimeEntriesForProject(project.id, allRooms, config.techs, config.pm);
    totalTimeEntries += timeEntries.length;

    // Create signatures
    const signatures = await createSignaturesForProject(project.id, allRooms, config.client, config.pm);
    totalSignatures += signatures.length;

    console.log(`   ✅ ${floors.length} floors, ${allRooms.length} rooms, ${allAssets.length} assets`);
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n═══════════════════════════════════════════');
  console.log('🎉 MEGA DATABASE SEED COMPLETED!');
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log(`   👤 Users: ${2 + 4 + techs.length + clients.length}`);
  console.log(`   📦 Asset Types: ${assetTypes.length}`);
  console.log(`   🏗️  Projects: ${projectConfigs.length}`);
  console.log(`   🏢 Floors: ${totalFloors}`);
  console.log(`   🚪 Rooms: ${totalRooms}`);
  console.log(`   📡 Assets: ${totalAssets}`);
  console.log(`   📋 Checklists: ${totalChecklists}`);
  console.log(`   ✅ Checklist Items: ${totalItems}`);
  console.log(`   ⚠️  Issues: ${totalIssues}`);
  console.log(`   📦 Inventory Items: ${totalInventory}`);
  console.log(`   ⏱️  Time Entries: ${totalTimeEntries}`);
  console.log(`   ✍️  Signatures: ${totalSignatures}`);
  console.log('');
  console.log('📧 Test Accounts (all passwords: password123):');
  console.log('   Admin:      admin@synax.app');
  console.log('   PM:         pm1@synax.app, pm2@synax.app, pm3@synax.app, pm4@synax.app');
  console.log('   Technician: tech1@synax.app ... tech12@synax.app');
  console.log('   Client:     client.hotel@example.gr, client.retail@example.gr, etc.');
  console.log('');
}

// ============================================
// HELPER: Create Floors
// ============================================
async function createFloorsForProject(projectId: string, type: string, count: number) {
  const floorNames: Record<string, (level: number) => string> = {
    hotel: (l) => {
      if (l === -1) return 'Υπόγειο (Τεχνικοί Χώροι & Parking)';
      if (l === 0) return 'Ισόγειο (Lobby, Reception, Restaurant)';
      if (l === 1) return '1ος Όροφος (Αίθουσες & Spa)';
      return `${l}ος Όροφος (Δωμάτια ${l}01-${l}30)`;
    },
    retail: (l) => {
      if (l === -1) return 'Υπόγειο (Αποθήκη & Logistics)';
      if (l === 0) return 'Ισόγειο (Sales Floor)';
      return `${l}ος Όροφος (Γραφεία & Αποθήκη)`;
    },
    office: (l) => {
      if (l === -1) return 'Υπόγειο (Parking & Τεχνικά)';
      if (l === 0) return 'Ισόγειο (Lobby & Reception)';
      if (l === 1) return '1ος Όροφος (Conference Center)';
      return `${l}ος Όροφος (Γραφεία)`;
    },
    hospital: (l) => {
      if (l === -1) return 'Υπόγειο (Αρχείο & Τεχνικά)';
      if (l === 0) return 'Ισόγειο (ΤΕΠ, Αναμονή, Γραμματεία)';
      if (l === 1) return '1ος Όροφος (Εργαστήρια & Ακτινολογικό)';
      if (l === 2) return '2ος Όροφος (Χειρουργεία & ΜΕΘ)';
      return `${l}ος Όροφος (Κλινική - Θάλαμοι ${l}01-${l}20)`;
    },
  };

  const floors = [];
  for (let i = -1; i < count - 1; i++) {
    const floor = await prisma.floor.create({
      data: {
        projectId,
        name: floorNames[type](i),
        level: i,
      },
    });
    floors.push(floor);
  }
  return floors;
}

// ============================================
// HELPER: Create Rooms
// ============================================
async function createRoomsForFloor(floorId: string, type: string, level: number) {
  const rooms: any[] = [];
  const statuses: ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED')[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];

  const roomConfigs: Record<string, Record<number, { name: string; type: string }[]>> = {
    hotel: {
      [-1]: [
        { name: 'Server Room (MDF)', type: 'server_room' },
        { name: 'UPS Room', type: 'technical' },
        { name: 'Security Room', type: 'security' },
        { name: 'IDF-B1', type: 'comms_room' },
        { name: 'Parking Area A', type: 'parking' },
        { name: 'Parking Area B', type: 'parking' },
      ],
      [0]: [
        { name: 'Main Lobby', type: 'lobby' },
        { name: 'Reception', type: 'reception' },
        { name: 'Restaurant Poseidon', type: 'restaurant' },
        { name: 'Bar Olympus', type: 'bar' },
        { name: 'Business Center', type: 'office' },
        { name: 'Gift Shop', type: 'retail' },
        { name: 'Concierge', type: 'office' },
        { name: 'Back Office', type: 'office' },
        { name: 'IDF-G1', type: 'comms_room' },
      ],
      [1]: [
        { name: 'Conference Room Alpha', type: 'conference' },
        { name: 'Conference Room Beta', type: 'conference' },
        { name: 'Board Room', type: 'conference' },
        { name: 'Spa Reception', type: 'reception' },
        { name: 'Spa Treatment 1', type: 'spa' },
        { name: 'Spa Treatment 2', type: 'spa' },
        { name: 'Gym', type: 'gym' },
        { name: 'Pool Area', type: 'pool' },
        { name: 'IDF-1A', type: 'comms_room' },
      ],
    },
    retail: {
      [-1]: [
        { name: 'Server Room', type: 'server_room' },
        { name: 'Αποθήκη Κεντρική', type: 'warehouse' },
        { name: 'Αποθήκη Ψυγείων', type: 'cold_storage' },
        { name: 'Αποθήκη Frozen', type: 'freezer' },
        { name: 'Loading Dock 1', type: 'loading' },
        { name: 'Loading Dock 2', type: 'loading' },
        { name: 'Break Room', type: 'staff' },
        { name: 'Locker Room', type: 'staff' },
      ],
      [0]: [
        { name: 'Είσοδος', type: 'entrance' },
        { name: 'Ταμεία Zone', type: 'checkout' },
        { name: 'Fresh Zone (Φρούτα/Λαχανικά)', type: 'fresh' },
        { name: 'Deli Counter', type: 'deli' },
        { name: 'Bakery', type: 'bakery' },
        { name: 'Κρεοπωλείο', type: 'butcher' },
        { name: 'Ιχθυοπωλείο', type: 'fish' },
        { name: 'Dairy Zone', type: 'dairy' },
        { name: 'Frozen Zone', type: 'frozen' },
        { name: 'Grocery Aisle 1-5', type: 'aisle' },
        { name: 'Grocery Aisle 6-10', type: 'aisle' },
        { name: 'Electronics Corner', type: 'electronics' },
        { name: 'Customer Service', type: 'service' },
        { name: 'Security Office', type: 'security' },
      ],
      [1]: [
        { name: 'Γραφεία Διεύθυνσης', type: 'office' },
        { name: 'HR Office', type: 'office' },
        { name: 'IT Office', type: 'office' },
        { name: 'Meeting Room', type: 'meeting' },
        { name: 'Training Room', type: 'training' },
        { name: 'Αποθήκη Εποχιακών', type: 'storage' },
      ],
    },
    office: {
      [-1]: [
        { name: 'MDF Room', type: 'server_room' },
        { name: 'Generator Room', type: 'technical' },
        { name: 'UPS Room', type: 'technical' },
        { name: 'Security Center', type: 'security' },
        { name: 'Parking Level -1', type: 'parking' },
      ],
      [0]: [
        { name: 'Main Lobby', type: 'lobby' },
        { name: 'Reception', type: 'reception' },
        { name: 'Waiting Area', type: 'waiting' },
        { name: 'Security Desk', type: 'security' },
        { name: 'Mail Room', type: 'service' },
        { name: 'IDF-G', type: 'comms_room' },
      ],
      [1]: [
        { name: 'Conference Room A', type: 'conference' },
        { name: 'Conference Room B', type: 'conference' },
        { name: 'Conference Room C', type: 'conference' },
        { name: 'Board Room', type: 'board' },
        { name: 'Executive Lounge', type: 'lounge' },
        { name: 'Catering Kitchen', type: 'kitchen' },
        { name: 'IDF-1', type: 'comms_room' },
      ],
    },
    hospital: {
      [-1]: [
        { name: 'Data Center', type: 'server_room' },
        { name: 'Medical Records Archive', type: 'archive' },
        { name: 'Laundry', type: 'service' },
        { name: 'Central Sterile', type: 'medical' },
        { name: 'Morgue', type: 'medical' },
        { name: 'Storage', type: 'storage' },
      ],
      [0]: [
        { name: 'Emergency Reception', type: 'er_reception' },
        { name: 'Triage', type: 'triage' },
        { name: 'ER Bay 1-4', type: 'er_bay' },
        { name: 'ER Bay 5-8', type: 'er_bay' },
        { name: 'Resuscitation Room', type: 'resus' },
        { name: 'Main Reception', type: 'reception' },
        { name: 'Waiting Area', type: 'waiting' },
        { name: 'Pharmacy', type: 'pharmacy' },
        { name: 'Admissions Office', type: 'office' },
        { name: 'Security Office', type: 'security' },
        { name: 'IDF-G', type: 'comms_room' },
      ],
      [1]: [
        { name: 'Lab Reception', type: 'reception' },
        { name: 'Hematology Lab', type: 'lab' },
        { name: 'Biochemistry Lab', type: 'lab' },
        { name: 'Microbiology Lab', type: 'lab' },
        { name: 'X-Ray Room 1', type: 'radiology' },
        { name: 'X-Ray Room 2', type: 'radiology' },
        { name: 'CT Scanner', type: 'radiology' },
        { name: 'MRI Suite', type: 'radiology' },
        { name: 'Ultrasound 1', type: 'radiology' },
        { name: 'Ultrasound 2', type: 'radiology' },
        { name: 'IDF-1', type: 'comms_room' },
      ],
      [2]: [
        { name: 'OR 1', type: 'operating' },
        { name: 'OR 2', type: 'operating' },
        { name: 'OR 3', type: 'operating' },
        { name: 'OR 4', type: 'operating' },
        { name: 'Pre-Op Holding', type: 'pre_op' },
        { name: 'PACU', type: 'recovery' },
        { name: 'ICU Bay 1-5', type: 'icu' },
        { name: 'ICU Bay 6-10', type: 'icu' },
        { name: 'ICU Nurses Station', type: 'nurses_station' },
        { name: 'IDF-2', type: 'comms_room' },
      ],
    },
  };

  // For hotel floors 2+, generate guest rooms
  if (type === 'hotel' && level >= 2) {
    for (let r = 1; r <= 30; r++) {
      const roomNum = level * 100 + r;
      const roomType = r <= 20 ? 'guest_room' : (r <= 28 ? 'suite' : 'presidential');
      rooms.push(await prisma.room.create({
        data: {
          floorId,
          name: `Room ${roomNum}`,
          type: roomType,
          status: randomFromArray(statuses.slice(0, 3)), // Exclude BLOCKED for most
          pinX: (r % 6) * 100 + 50,
          pinY: Math.floor(r / 6) * 80 + 50,
        },
      }));
    }
    // Add corridor and IDF
    rooms.push(await prisma.room.create({
      data: { floorId, name: `Corridor ${level}`, type: 'corridor', status: 'COMPLETED', pinX: 350, pinY: 300 },
    }));
    rooms.push(await prisma.room.create({
      data: { floorId, name: `IDF-${level}A`, type: 'comms_room', status: 'COMPLETED', pinX: 600, pinY: 300 },
    }));
    return rooms;
  }

  // For hospital floors 3+, generate patient rooms
  if (type === 'hospital' && level >= 3) {
    for (let r = 1; r <= 20; r++) {
      const roomNum = level * 100 + r;
      rooms.push(await prisma.room.create({
        data: {
          floorId,
          name: `Room ${roomNum}`,
          type: r <= 16 ? 'patient_room' : 'isolation',
          status: randomFromArray(statuses.slice(0, 3)),
          pinX: (r % 5) * 120 + 50,
          pinY: Math.floor(r / 5) * 100 + 50,
        },
      }));
    }
    rooms.push(await prisma.room.create({
      data: { floorId, name: `Nurses Station ${level}`, type: 'nurses_station', status: 'COMPLETED', pinX: 300, pinY: 400 },
    }));
    rooms.push(await prisma.room.create({
      data: { floorId, name: `IDF-${level}`, type: 'comms_room', status: 'COMPLETED', pinX: 550, pinY: 400 },
    }));
    return rooms;
  }

  // For office floors 2+, generate open office areas
  if (type === 'office' && level >= 2) {
    rooms.push(await prisma.room.create({
      data: { floorId, name: `Open Office ${level}A`, type: 'open_office', status: randomFromArray(statuses.slice(0, 3)), pinX: 150, pinY: 150 },
    }));
    rooms.push(await prisma.room.create({
      data: { floorId, name: `Open Office ${level}B`, type: 'open_office', status: randomFromArray(statuses.slice(0, 3)), pinX: 450, pinY: 150 },
    }));
    for (let m = 1; m <= 4; m++) {
      rooms.push(await prisma.room.create({
        data: { floorId, name: `Meeting Room ${level}.${m}`, type: 'meeting', status: randomFromArray(statuses.slice(0, 3)), pinX: m * 120, pinY: 350 },
      }));
    }
    rooms.push(await prisma.room.create({
      data: { floorId, name: `Manager Office ${level}`, type: 'office', status: randomFromArray(statuses.slice(0, 3)), pinX: 550, pinY: 350 },
    }));
    rooms.push(await prisma.room.create({
      data: { floorId, name: `Kitchen ${level}`, type: 'kitchen', status: 'COMPLETED', pinX: 300, pinY: 450 },
    }));
    rooms.push(await prisma.room.create({
      data: { floorId, name: `IDF-${level}`, type: 'comms_room', status: 'COMPLETED', pinX: 600, pinY: 450 },
    }));
    return rooms;
  }

  // Default: use predefined rooms
  const configs = roomConfigs[type]?.[level] || [];
  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    rooms.push(await prisma.room.create({
      data: {
        floorId,
        name: cfg.name,
        type: cfg.type,
        status: cfg.type === 'comms_room' || cfg.type === 'server_room' ? 'COMPLETED' : randomFromArray(statuses.slice(0, 3)),
        pinX: (i % 4) * 150 + 75,
        pinY: Math.floor(i / 4) * 120 + 75,
      },
    }));
  }

  return rooms;
}

// ============================================
// HELPER: Create Assets
// ============================================
async function createAssetsForRoom(room: any, projectType: string, typeMap: Record<string, any>, techs: any[]) {
  const assets: any[] = [];
  const assetStatuses: ('PLANNED' | 'IN_STOCK' | 'INSTALLED' | 'CONFIGURED' | 'VERIFIED' | 'FAULTY')[] =
    ['PLANNED', 'IN_STOCK', 'INSTALLED', 'CONFIGURED', 'VERIFIED'];

  // Determine what assets to create based on room type
  const roomAssets: { type: string; prefix: string; count: number }[] = [];

  switch (room.type) {
    case 'server_room':
    case 'comms_room':
      roomAssets.push({ type: 'Network Switch', prefix: 'SW', count: randomBetween(1, 3) });
      roomAssets.push({ type: 'Patch Panel', prefix: 'PP', count: randomBetween(1, 4) });
      if (room.type === 'server_room') {
        roomAssets.push({ type: 'Router', prefix: 'RTR', count: 1 });
        roomAssets.push({ type: 'Firewall', prefix: 'FW', count: 1 });
        roomAssets.push({ type: 'UPS', prefix: 'UPS', count: randomBetween(1, 2) });
        roomAssets.push({ type: 'Server', prefix: 'SRV', count: randomBetween(1, 3) });
        roomAssets.push({ type: 'NVR/DVR', prefix: 'NVR', count: 1 });
        roomAssets.push({ type: 'Wireless Controller', prefix: 'WLC', count: 1 });
      }
      break;
    case 'lobby':
    case 'reception':
    case 'waiting':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: randomBetween(2, 4) });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: randomBetween(2, 4) });
      roomAssets.push({ type: 'Digital Signage', prefix: 'DS', count: randomBetween(1, 3) });
      break;
    case 'guest_room':
    case 'patient_room':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: 1 });
      roomAssets.push({ type: 'Smart TV', prefix: 'TV', count: 1 });
      if (room.type === 'patient_room') {
        roomAssets.push({ type: 'VoIP Phone', prefix: 'PHONE', count: 1 });
        roomAssets.push({ type: 'Intercom Panel', prefix: 'ICP', count: 1 });
      }
      break;
    case 'suite':
    case 'presidential':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: 2 });
      roomAssets.push({ type: 'Smart TV', prefix: 'TV', count: randomBetween(2, 3) });
      roomAssets.push({ type: 'VoIP Phone', prefix: 'PHONE', count: 1 });
      break;
    case 'conference':
    case 'meeting':
    case 'board':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: randomBetween(1, 2) });
      roomAssets.push({ type: 'Smart TV', prefix: 'TV', count: 1 });
      roomAssets.push({ type: 'VoIP Phone', prefix: 'PHONE', count: 1 });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: 1 });
      break;
    case 'open_office':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: randomBetween(3, 5) });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: randomBetween(2, 4) });
      roomAssets.push({ type: 'VoIP Phone', prefix: 'PHONE', count: randomBetween(5, 15) });
      break;
    case 'restaurant':
    case 'bar':
    case 'gym':
    case 'pool':
    case 'spa':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: randomBetween(2, 4) });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: randomBetween(2, 4) });
      roomAssets.push({ type: 'Smart TV', prefix: 'TV', count: randomBetween(1, 4) });
      break;
    case 'checkout':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: randomBetween(2, 3) });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: randomBetween(4, 8) });
      roomAssets.push({ type: 'POS Terminal', prefix: 'POS', count: randomBetween(8, 15) });
      break;
    case 'security':
      roomAssets.push({ type: 'Network Switch', prefix: 'SW', count: 1 });
      roomAssets.push({ type: 'NVR/DVR', prefix: 'NVR', count: randomBetween(1, 2) });
      roomAssets.push({ type: 'Smart TV', prefix: 'MON', count: randomBetween(2, 4) });
      break;
    case 'warehouse':
    case 'cold_storage':
    case 'freezer':
    case 'loading':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: randomBetween(2, 4) });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: randomBetween(4, 8) });
      break;
    case 'operating':
    case 'icu':
    case 'radiology':
    case 'lab':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: 1 });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: randomBetween(1, 2) });
      roomAssets.push({ type: 'VoIP Phone', prefix: 'PHONE', count: 1 });
      roomAssets.push({ type: 'Intercom Panel', prefix: 'ICP', count: 1 });
      break;
    case 'corridor':
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: randomBetween(1, 3) });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: randomBetween(2, 4) });
      break;
    default:
      // Default: at least 1 AP and 1 camera
      roomAssets.push({ type: 'Access Point', prefix: 'AP', count: 1 });
      roomAssets.push({ type: 'IP Camera', prefix: 'CAM', count: 1 });
  }

  let assetIndex = 0;
  for (const config of roomAssets) {
    const assetType = typeMap[config.type];
    if (!assetType) continue;

    for (let i = 0; i < config.count; i++) {
      const status = randomFromArray(assetStatuses);
      const tech = randomFromArray(techs);

      const asset = await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: assetType.id,
          name: `${config.prefix}-${room.name.replace(/\s+/g, '-').substring(0, 10)}-${i + 1}`,
          model: getModelForType(config.type),
          serialNumber: generateSerialNumber(config.prefix),
          macAddress: ['Access Point', 'Network Switch', 'IP Camera', 'Router', 'Firewall'].includes(config.type) ? generateMacAddress() : null,
          ipAddress: ['Access Point', 'Network Switch', 'IP Camera', 'Router', 'Server', 'NVR/DVR'].includes(config.type) ? generateIP('192.168.1', randomBetween(10, 250)) : null,
          status,
          installedById: ['INSTALLED', 'CONFIGURED', 'VERIFIED'].includes(status) ? tech.id : null,
          installedAt: ['INSTALLED', 'CONFIGURED', 'VERIFIED'].includes(status) ? new Date(Date.now() - randomBetween(1, 60) * 24 * 60 * 60 * 1000) : null,
          pinX: (assetIndex % 4) * 80 + 50,
          pinY: Math.floor(assetIndex / 4) * 60 + 50,
        },
      });
      assets.push(asset);
      assetIndex++;
    }
  }

  return assets;
}

function getModelForType(type: string): string {
  const models: Record<string, string[]> = {
    'Access Point': ['Cisco Meraki MR46', 'Cisco Meraki MR36', 'Ubiquiti U6-Pro', 'Aruba AP-535'],
    'Network Switch': ['Cisco Catalyst 9200-24P', 'Cisco Catalyst 9200-48P', 'Cisco CBS350-24P', 'Aruba 2930F'],
    'IP Camera': ['Hikvision DS-2CD2386G2', 'Dahua IPC-HDW5442TM', 'Axis P3245-V', 'Hanwha XNV-8080R'],
    'Router': ['Cisco ISR 4451', 'Cisco ISR 4331', 'Fortinet FG-60F'],
    'Firewall': ['Fortinet FG-100F', 'Palo Alto PA-440', 'Cisco FPR-1120'],
    'UPS': ['APC Smart-UPS 3000VA', 'APC Smart-UPS 5000VA', 'Eaton 5PX 3000'],
    'Smart TV': ['Samsung QM55R', 'LG 55UN73006LA', 'Philips 55BFL2114', 'Sony KD-55X80K'],
    'Digital Signage': ['Samsung QB55R', 'LG 55UH5F-H', 'NEC V554Q'],
    'VoIP Phone': ['Cisco IP Phone 8845', 'Yealink T54W', 'Grandstream GRP2615'],
    'POS Terminal': ['Ingenico Lane/5000', 'Verifone MX925', 'PAX A920'],
    'NVR/DVR': ['Hikvision DS-7732NXI', 'Dahua NVR5432-16P-I', 'Synology DVA3221'],
    'Server': ['Dell PowerEdge R750', 'HPE ProLiant DL380', 'Lenovo ThinkSystem SR650'],
    'Patch Panel': ['Panduit CP48BLY', 'Panduit CP24BLY', 'CommScope 760162384'],
    'Wireless Controller': ['Cisco 9800-40', 'Aruba 7210', 'Cisco 3504'],
    'Intercom Panel': ['Hikvision DS-KH6320-WTE1', '2N IP Verso', 'Axis A8105-E'],
  };
  return randomFromArray(models[type] || ['Generic Model']);
}

// ============================================
// HELPER: Create Checklists
// ============================================
async function createChecklistsForAsset(asset: any, techs: any[]) {
  let checklistCount = 0;
  let itemCount = 0;

  const types: ('CABLING' | 'EQUIPMENT' | 'CONFIG' | 'DOCUMENTATION')[] = ['CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION'];

  for (const type of types) {
    const isCompleted = ['VERIFIED', 'CONFIGURED'].includes(asset.status);
    const isInProgress = ['INSTALLED'].includes(asset.status);

    let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
    if (isCompleted) status = 'COMPLETED';
    else if (isInProgress && (type === 'CABLING' || type === 'EQUIPMENT')) status = 'COMPLETED';
    else if (isInProgress && type === 'CONFIG') status = 'IN_PROGRESS';

    const checklist = await prisma.checklist.create({
      data: {
        assetId: asset.id,
        type,
        status,
        assignedToId: asset.installedById || randomFromArray(techs).id,
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
          completedById: completed ? (asset.installedById || randomFromArray(techs).id) : null,
          completedAt: completed ? new Date() : null,
          order: i,
        },
      });
      itemCount++;
    }
  }

  return { checklists: checklistCount, items: itemCount };
}

function getChecklistItems(type: string): { name: string; requiresPhoto?: boolean }[] {
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

// ============================================
// HELPER: Create Issues
// ============================================
async function createIssuesForProject(projectId: string, rooms: any[], techs: any[], pm: any) {
  const issues: any[] = [];
  const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const statuses: ('OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED')[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  const issueTemplates = [
    { title: 'Καθυστέρηση ηλεκτρολογικών εργασιών', causedBy: 'Electra Electric Co.', priority: 'CRITICAL' },
    { title: 'Ελλιπής ψευδοροφή', causedBy: 'BuildRight Construction', priority: 'HIGH' },
    { title: 'Λάθος mounting brackets', causedBy: 'NetEquip Supplies', priority: 'MEDIUM' },
    { title: 'Καθυστέρηση παράδοσης εξοπλισμού', causedBy: 'Cisco Hellas', priority: 'MEDIUM' },
    { title: 'Προβλήμα κλιματισμού server room', causedBy: 'CoolAir HVAC', priority: 'CRITICAL' },
    { title: 'Αναμονή για οριστικές κατόψεις', causedBy: 'Architekton Design', priority: 'HIGH' },
    { title: 'Πρόβλημα PoE switch', causedBy: null, priority: 'HIGH' },
    { title: 'Χαμηλό WiFi coverage', causedBy: null, priority: 'MEDIUM' },
    { title: 'Ελαττωματική κάμερα', causedBy: 'Hikvision Support', priority: 'LOW' },
    { title: 'Firmware update required', causedBy: null, priority: 'LOW' },
    { title: 'Καθυστέρηση υδραυλικών', causedBy: 'AquaFix Plumbing', priority: 'MEDIUM' },
    { title: 'Πρόβλημα grounding', causedBy: 'Electra Electric Co.', priority: 'HIGH' },
  ];

  // Create 8-12 issues per project
  const issueCount = randomBetween(8, 12);
  for (let i = 0; i < issueCount; i++) {
    const template = issueTemplates[i % issueTemplates.length];
    const status = randomFromArray(statuses);
    const room = randomFromArray(rooms);

    const issue = await prisma.issue.create({
      data: {
        projectId,
        roomId: room.id,
        title: template.title,
        description: `Περιγραφή προβλήματος: ${template.title}. Χρειάζεται άμεση επίλυση.`,
        causedBy: template.causedBy,
        priority: template.priority as any,
        status,
        createdById: randomFromArray([...techs, pm]).id,
        resolvedAt: ['RESOLVED', 'CLOSED'].includes(status) ? new Date() : null,
      },
    });
    issues.push(issue);

    // Add 1-3 comments
    const commentCount = randomBetween(1, 3);
    for (let c = 0; c < commentCount; c++) {
      await prisma.issueComment.create({
        data: {
          issueId: issue.id,
          userId: randomFromArray([...techs, pm]).id,
          comment: randomFromArray([
            'Επικοινώνησα με τον υπεύθυνο.',
            'Αναμένουμε απάντηση.',
            'Το πρόβλημα επιλύθηκε προσωρινά.',
            'Χρειάζεται follow-up.',
            'Κλείστηκε ραντεβού για επίσκεψη.',
          ]),
        },
      });
    }
  }

  return issues;
}

// ============================================
// HELPER: Create Inventory
// ============================================
async function createInventoryForProject(projectId: string, type: string, techs: any[], pm: any) {
  const inventoryTemplates = [
    { itemType: 'Cable - Cat6 UTP', description: 'Cat6 UTP Cable 305m Box - Blue', unit: 'box', received: 20, used: 12 },
    { itemType: 'Cable - Cat6 UTP', description: 'Cat6 UTP Cable 305m Box - Grey', unit: 'box', received: 15, used: 8 },
    { itemType: 'RJ45 Connectors', description: 'Cat6 RJ45 Connectors (100pcs)', unit: 'bag', received: 40, used: 28 },
    { itemType: 'Patch Panel 24-port', description: 'Panduit Cat6 24-port Patch Panel 1U', unit: 'pcs', received: 10, used: 6 },
    { itemType: 'Patch Panel 48-port', description: 'Panduit Cat6 48-port Patch Panel 2U', unit: 'pcs', received: 5, used: 3 },
    { itemType: 'Patch Cord 1m', description: 'Cat6 Patch Cord 1m Blue', unit: 'pcs', received: 300, used: 180 },
    { itemType: 'Patch Cord 2m', description: 'Cat6 Patch Cord 2m Blue', unit: 'pcs', received: 150, used: 85 },
    { itemType: 'Cable Ties', description: 'Velcro Cable Ties 200mm (100pcs)', unit: 'pack', received: 25, used: 18 },
    { itemType: 'Access Point', description: 'Cisco Meraki MR46', unit: 'pcs', received: 40, used: 25 },
    { itemType: 'Access Point', description: 'Cisco Meraki MR36', unit: 'pcs', received: 50, used: 30 },
    { itemType: 'IP Camera', description: 'Hikvision DS-2CD2386G2-IU', unit: 'pcs', received: 35, used: 22 },
    { itemType: 'Network Switch', description: 'Cisco Catalyst 9200-24P', unit: 'pcs', received: 8, used: 5 },
    { itemType: 'Network Switch', description: 'Cisco CBS350-24P', unit: 'pcs', received: 12, used: 7 },
    { itemType: 'UPS', description: 'APC Smart-UPS 3000VA', unit: 'pcs', received: 4, used: 2 },
    { itemType: 'Fiber Patch Cord', description: 'LC-LC OM4 5m', unit: 'pcs', received: 50, used: 30 },
    { itemType: 'Wall Mount', description: 'AP Wall Mount Bracket', unit: 'pcs', received: 60, used: 40 },
  ];

  const items: any[] = [];
  for (const template of inventoryTemplates) {
    const item = await prisma.inventoryItem.create({
      data: {
        projectId,
        itemType: template.itemType,
        description: template.description,
        unit: template.unit,
        quantityReceived: template.received,
        quantityUsed: template.used,
      },
    });
    items.push(item);

    // Create logs
    await prisma.inventoryLog.create({
      data: {
        itemId: item.id,
        action: 'RECEIVED',
        quantity: template.received,
        notes: 'Αρχική παραλαβή',
        userId: pm.id,
      },
    });

    if (template.used > 0) {
      await prisma.inventoryLog.create({
        data: {
          itemId: item.id,
          action: 'CONSUMED',
          quantity: template.used,
          notes: 'Χρήση για εγκαταστάσεις',
          userId: randomFromArray(techs).id,
        },
      });
    }
  }

  return items;
}

// ============================================
// HELPER: Create Time Entries
// ============================================
async function createTimeEntriesForProject(projectId: string, rooms: any[], techs: any[], pm: any) {
  const entries: any[] = [];
  const types: ('INSTALLATION' | 'CONFIGURATION' | 'TESTING' | 'TROUBLESHOOTING' | 'TRAVEL' | 'MEETING')[] =
    ['INSTALLATION', 'CONFIGURATION', 'TESTING', 'TROUBLESHOOTING', 'TRAVEL', 'MEETING'];

  // Create 30-50 time entries per project
  const entryCount = randomBetween(30, 50);
  for (let i = 0; i < entryCount; i++) {
    const tech = randomFromArray(techs);
    const type = randomFromArray(types);
    const room = type !== 'TRAVEL' && type !== 'MEETING' ? randomFromArray(rooms) : null;

    const entry = await prisma.timeEntry.create({
      data: {
        projectId,
        userId: type === 'MEETING' ? randomFromArray([pm, ...techs]).id : tech.id,
        roomId: room?.id || null,
        type,
        description: getTimeEntryDescription(type),
        date: new Date(Date.now() - randomBetween(1, 90) * 24 * 60 * 60 * 1000),
        hours: randomBetween(1, 8) + randomBetween(0, 1) * 0.5,
      },
    });
    entries.push(entry);
  }

  return entries;
}

function getTimeEntryDescription(type: string): string {
  const descriptions: Record<string, string[]> = {
    INSTALLATION: ['Εγκατάσταση εξοπλισμού', 'Τοποθέτηση APs', 'Εγκατάσταση καμερών', 'Rack mounting'],
    CONFIGURATION: ['Ρύθμιση VLANs', 'Παραμετροποίηση APs', 'Setup καμερών', 'Firewall rules'],
    TESTING: ['Connectivity testing', 'WiFi survey', 'CCTV testing', 'Performance testing'],
    TROUBLESHOOTING: ['Debugging network', 'Επίλυση connectivity', 'Troubleshooting PoE', 'Firmware issues'],
    TRAVEL: ['Μετάβαση στο εργοτάξιο', 'Επιστροφή από site', 'Μεταφορά εξοπλισμού'],
    MEETING: ['Weekly progress meeting', 'Coordination με πελάτη', 'Technical review', 'Planning session'],
  };
  return randomFromArray(descriptions[type] || ['Εργασία']);
}

// ============================================
// HELPER: Create Signatures
// ============================================
async function createSignaturesForProject(projectId: string, rooms: any[], client: any, pm: any) {
  const signatures: any[] = [];
  const dummySignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Create 5-10 signatures per project
  const completedRooms = rooms.filter(r => r.status === 'COMPLETED').slice(0, 10);
  for (const room of completedRooms.slice(0, randomBetween(3, 7))) {
    const sig = await prisma.signature.create({
      data: {
        projectId,
        roomId: room.id,
        type: 'ROOM_HANDOVER',
        signatureData: dummySignature,
        signedByName: client.name,
        signedById: client.id,
        signedAt: new Date(Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000),
      },
    });
    signatures.push(sig);
  }

  // Stage completion signature
  signatures.push(await prisma.signature.create({
    data: {
      projectId,
      type: 'STAGE_COMPLETION',
      signatureData: dummySignature,
      signedByName: pm.name,
      signedById: pm.id,
      signedAt: new Date(Date.now() - randomBetween(1, 60) * 24 * 60 * 60 * 1000),
    },
  }));

  return signatures;
}

// ============================================
// RUN
// ============================================
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
