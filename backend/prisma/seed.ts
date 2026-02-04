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
  await prisma.building.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.assetType.deleteMany();
  await prisma.user.deleteMany();

  // Clean lookup tables
  await prisma.lookupAssetModel.deleteMany();
  await prisma.lookupManufacturer.deleteMany();
  await prisma.lookupIssueCause.deleteMany();
  await prisma.lookupInventoryUnit.deleteMany();
  await prisma.lookupRoomType.deleteMany();

  console.log('✅ Data cleaned\n');

  // ============================================
  // STEP 2: Create Lookup Tables
  // ============================================
  console.log('📋 Creating lookup tables...');

  // Room Types
  const roomTypes = await Promise.all([
    prisma.lookupRoomType.create({ data: { name: 'Server Room', icon: 'server', order: 1 } }),
    prisma.lookupRoomType.create({ data: { name: 'Network Closet', icon: 'network', order: 2 } }),
    prisma.lookupRoomType.create({ data: { name: 'Guest Room', icon: 'bed', order: 3 } }),
    prisma.lookupRoomType.create({ data: { name: 'Suite', icon: 'home', order: 4 } }),
    prisma.lookupRoomType.create({ data: { name: 'Conference Room', icon: 'users', order: 5 } }),
    prisma.lookupRoomType.create({ data: { name: 'Office', icon: 'briefcase', order: 6 } }),
    prisma.lookupRoomType.create({ data: { name: 'Reception', icon: 'building', order: 7 } }),
    prisma.lookupRoomType.create({ data: { name: 'Lobby', icon: 'door-open', order: 8 } }),
    prisma.lookupRoomType.create({ data: { name: 'Restaurant', icon: 'utensils', order: 9 } }),
    prisma.lookupRoomType.create({ data: { name: 'Bar', icon: 'wine', order: 10 } }),
    prisma.lookupRoomType.create({ data: { name: 'Pool Area', icon: 'waves', order: 11 } }),
    prisma.lookupRoomType.create({ data: { name: 'Gym', icon: 'dumbbell', order: 12 } }),
    prisma.lookupRoomType.create({ data: { name: 'Spa', icon: 'sparkles', order: 13 } }),
    prisma.lookupRoomType.create({ data: { name: 'Corridor', icon: 'move-horizontal', order: 14 } }),
    prisma.lookupRoomType.create({ data: { name: 'Parking', icon: 'car', order: 15 } }),
    prisma.lookupRoomType.create({ data: { name: 'Storage', icon: 'archive', order: 16 } }),
    prisma.lookupRoomType.create({ data: { name: 'Security Room', icon: 'shield', order: 17 } }),
    prisma.lookupRoomType.create({ data: { name: 'Kitchen', icon: 'utensils', order: 18 } }),
    prisma.lookupRoomType.create({ data: { name: 'Laundry', icon: 'box', order: 19 } }),
    prisma.lookupRoomType.create({ data: { name: 'Outdoor', icon: 'circle', order: 20 } }),
  ]);
  console.log(`   ✓ Created ${roomTypes.length} room types`);

  // Inventory Units
  const inventoryUnits = await Promise.all([
    prisma.lookupInventoryUnit.create({ data: { name: 'Pieces', abbreviation: 'pcs', order: 1 } }),
    prisma.lookupInventoryUnit.create({ data: { name: 'Meters', abbreviation: 'm', order: 2 } }),
    prisma.lookupInventoryUnit.create({ data: { name: 'Boxes', abbreviation: 'box', order: 3 } }),
    prisma.lookupInventoryUnit.create({ data: { name: 'Rolls', abbreviation: 'roll', order: 4 } }),
    prisma.lookupInventoryUnit.create({ data: { name: 'Packs', abbreviation: 'pack', order: 5 } }),
    prisma.lookupInventoryUnit.create({ data: { name: 'Sets', abbreviation: 'set', order: 6 } }),
    prisma.lookupInventoryUnit.create({ data: { name: 'Bags', abbreviation: 'bag', order: 7 } }),
    prisma.lookupInventoryUnit.create({ data: { name: 'Pairs', abbreviation: 'pair', order: 8 } }),
  ]);
  console.log(`   ✓ Created ${inventoryUnits.length} inventory units`);

  // Issue Causes
  const issueCauses = await Promise.all([
    prisma.lookupIssueCause.create({ data: { name: 'Electrical Contractor', order: 1 } }),
    prisma.lookupIssueCause.create({ data: { name: 'HVAC Contractor', order: 2 } }),
    prisma.lookupIssueCause.create({ data: { name: 'General Contractor', order: 3 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Plumbing', order: 4 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Architect', order: 5 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Client Request', order: 6 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Design Change', order: 7 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Material Delay', order: 8 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Equipment Failure', order: 9 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Weather', order: 10 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Access Issue', order: 11 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Safety', order: 12 } }),
    prisma.lookupIssueCause.create({ data: { name: 'Other', order: 99 } }),
  ]);
  console.log(`   ✓ Created ${issueCauses.length} issue causes`);

  // Manufacturers
  const manufacturers = await Promise.all([
    prisma.lookupManufacturer.create({ data: { name: 'Cisco', website: 'https://www.cisco.com', order: 1 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Ubiquiti', website: 'https://www.ui.com', order: 2 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Hikvision', website: 'https://www.hikvision.com', order: 3 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Dahua', website: 'https://www.dahuasecurity.com', order: 4 } }),
    prisma.lookupManufacturer.create({ data: { name: 'APC', website: 'https://www.apc.com', order: 5 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Eaton', website: 'https://www.eaton.com', order: 6 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Samsung', website: 'https://www.samsung.com', order: 7 } }),
    prisma.lookupManufacturer.create({ data: { name: 'LG', website: 'https://www.lg.com', order: 8 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Panduit', website: 'https://www.panduit.com', order: 9 } }),
    prisma.lookupManufacturer.create({ data: { name: 'CommScope', website: 'https://www.commscope.com', order: 10 } }),
    prisma.lookupManufacturer.create({ data: { name: 'MikroTik', website: 'https://mikrotik.com', order: 11 } }),
    prisma.lookupManufacturer.create({ data: { name: 'TP-Link', website: 'https://www.tp-link.com', order: 12 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Aruba', website: 'https://www.arubanetworks.com', order: 13 } }),
    prisma.lookupManufacturer.create({ data: { name: 'Fortinet', website: 'https://www.fortinet.com', order: 14 } }),
  ]);
  const cisco = manufacturers.find(m => m.name === 'Cisco')!;
  const ubiquiti = manufacturers.find(m => m.name === 'Ubiquiti')!;
  const hikvision = manufacturers.find(m => m.name === 'Hikvision')!;
  const dahua = manufacturers.find(m => m.name === 'Dahua')!;
  const apc = manufacturers.find(m => m.name === 'APC')!;
  const samsung = manufacturers.find(m => m.name === 'Samsung')!;
  const lg = manufacturers.find(m => m.name === 'LG')!;
  const panduit = manufacturers.find(m => m.name === 'Panduit')!;
  const mikrotik = manufacturers.find(m => m.name === 'MikroTik')!;
  const aruba = manufacturers.find(m => m.name === 'Aruba')!;
  console.log(`   ✓ Created ${manufacturers.length} manufacturers`);

  console.log('✅ Lookup tables created\n');

  // ============================================
  // STEP 3: Create Users
  // ============================================
  console.log('👤 Creating users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const pmPassword = await bcrypt.hash('pm123456', 10);
  const techPassword = await bcrypt.hash('tech123456', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@synax.gr',
      passwordHash: adminPassword,
      name: 'Γιώργος Παπαδόπουλος',
      role: 'ADMIN',
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'maria@synax.gr',
      passwordHash: pmPassword,
      name: 'Μαρία Κωνσταντίνου',
      role: 'PM',
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'kostas@synax.gr',
      passwordHash: pmPassword,
      name: 'Κώστας Δημητρίου',
      role: 'PM',
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      email: 'nikos@synax.gr',
      passwordHash: techPassword,
      name: 'Νίκος Αλεξίου',
      role: 'TECHNICIAN',
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      email: 'dimitris@synax.gr',
      passwordHash: techPassword,
      name: 'Δημήτρης Γεωργίου',
      role: 'TECHNICIAN',
    },
  });

  const tech3 = await prisma.user.create({
    data: {
      email: 'giannis@synax.gr',
      passwordHash: techPassword,
      name: 'Γιάννης Παππάς',
      role: 'TECHNICIAN',
    },
  });

  const tech4 = await prisma.user.create({
    data: {
      email: 'andreas@synax.gr',
      passwordHash: techPassword,
      name: 'Ανδρέας Νικολάου',
      role: 'TECHNICIAN',
    },
  });

  const client1 = await prisma.user.create({
    data: {
      email: 'alexandros@poseidon-hotels.gr',
      passwordHash: clientPassword,
      name: 'Αλέξανδρος Μαρίνος',
      role: 'CLIENT',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'elena@aegean-resorts.gr',
      passwordHash: clientPassword,
      name: 'Έλενα Θεοδωρίδου',
      role: 'CLIENT',
    },
  });

  console.log(`✅ Created 9 users\n`);

  // ============================================
  // STEP 4: Create Asset Types
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
            { name: 'Provisioning στο controller', requiresPhoto: false },
            { name: 'Ρύθμιση SSID', requiresPhoto: false },
            { name: 'Έλεγχος σήματος', requiresPhoto: true },
          ],
          documentation: [
            { name: 'Καταγραφή MAC address', requiresPhoto: false },
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
          cabling: [
            { name: 'Uplink σύνδεση', requiresPhoto: false },
            { name: 'Τερματισμοί patch panel', requiresPhoto: true },
          ],
          equipment: [
            { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
            { name: 'Σύνδεση τροφοδοσίας', requiresPhoto: false },
          ],
          config: [
            { name: 'Ρύθμιση VLANs', requiresPhoto: false },
            { name: 'Management IP', requiresPhoto: false },
          ],
          documentation: [
            { name: 'Port mapping', requiresPhoto: false },
            { name: 'Φωτογραφία', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'IP Camera',
        icon: 'camera',
        checklistTemplate: {
          cabling: [
            { name: 'Καλωδίωση', requiresPhoto: false },
            { name: 'Τερματισμός RJ45', requiresPhoto: true },
          ],
          equipment: [
            { name: 'Τοποθέτηση βάσης', requiresPhoto: true },
            { name: 'Ρύθμιση γωνίας', requiresPhoto: true },
          ],
          config: [
            { name: 'Προσθήκη στο NVR', requiresPhoto: false },
            { name: 'Ρύθμιση ανάλυσης', requiresPhoto: false },
          ],
          documentation: [
            { name: 'Screenshot εικόνας', requiresPhoto: true },
          ],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'Router',
        icon: 'router',
        checklistTemplate: {
          cabling: [{ name: 'WAN connection', requiresPhoto: false }],
          equipment: [{ name: 'Τοποθέτηση σε rack', requiresPhoto: true }],
          config: [
            { name: 'Ρύθμιση WAN', requiresPhoto: false },
            { name: 'Ρύθμιση routing', requiresPhoto: false },
            { name: 'Ρύθμιση firewall', requiresPhoto: false },
          ],
          documentation: [{ name: 'Φωτογραφία', requiresPhoto: true }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'UPS',
        icon: 'battery',
        checklistTemplate: {
          cabling: [{ name: 'Σύνδεση ρεύματος', requiresPhoto: false }],
          equipment: [
            { name: 'Τοποθέτηση UPS', requiresPhoto: true },
            { name: 'Εγκατάσταση μπαταριών', requiresPhoto: true },
          ],
          config: [{ name: 'Ρύθμιση alerts', requiresPhoto: false }],
          documentation: [{ name: 'Test αυτονομίας', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'TV Display',
        icon: 'tv',
        checklistTemplate: {
          equipment: [
            { name: 'Τοποθέτηση βάσης', requiresPhoto: true },
            { name: 'Μοντάρισμα TV', requiresPhoto: true },
          ],
          config: [{ name: 'Ρύθμιση IPTV', requiresPhoto: false }],
          documentation: [{ name: 'Φωτογραφία', requiresPhoto: true }],
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
            { name: 'Ετικέτες', requiresPhoto: true },
          ],
          documentation: [{ name: 'Port mapping', requiresPhoto: false }],
        },
      },
    }),
    prisma.assetType.create({
      data: {
        name: 'NVR',
        icon: 'hard-drive',
        checklistTemplate: {
          equipment: [
            { name: 'Τοποθέτηση σε rack', requiresPhoto: true },
            { name: 'Σύνδεση HDD', requiresPhoto: false },
          ],
          config: [
            { name: 'Ρύθμιση recording', requiresPhoto: false },
            { name: 'Προσθήκη καμερών', requiresPhoto: false },
          ],
          documentation: [{ name: 'Screenshot', requiresPhoto: true }],
        },
      },
    }),
  ]);

  const apType = assetTypes.find(t => t.name === 'Access Point')!;
  const switchType = assetTypes.find(t => t.name === 'Network Switch')!;
  const cameraType = assetTypes.find(t => t.name === 'IP Camera')!;
  const routerType = assetTypes.find(t => t.name === 'Router')!;
  const upsType = assetTypes.find(t => t.name === 'UPS')!;
  const tvType = assetTypes.find(t => t.name === 'TV Display')!;
  const patchPanelType = assetTypes.find(t => t.name === 'Patch Panel')!;
  const nvrType = assetTypes.find(t => t.name === 'NVR')!;

  console.log(`✅ Created ${assetTypes.length} asset types\n`);

  // ============================================
  // STEP 5: Create Asset Models (linked to types!)
  // ============================================
  console.log('🔧 Creating asset models...');

  const assetModels = await Promise.all([
    // Access Points
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'Meraki MR46', icon: 'wifi', assetTypeId: apType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'Meraki MR36', icon: 'wifi', assetTypeId: apType.id, order: 2 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'Meraki MR56', icon: 'wifi', assetTypeId: apType.id, order: 3 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: ubiquiti.id, name: 'UniFi 6 Pro', icon: 'wifi', assetTypeId: apType.id, order: 4 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: ubiquiti.id, name: 'UniFi 6 LR', icon: 'wifi', assetTypeId: apType.id, order: 5 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: ubiquiti.id, name: 'UniFi 6 Lite', icon: 'wifi', assetTypeId: apType.id, order: 6 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: aruba.id, name: 'AP-515', icon: 'wifi', assetTypeId: apType.id, order: 7 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: aruba.id, name: 'AP-535', icon: 'wifi', assetTypeId: apType.id, order: 8 } }),

    // Network Switches
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'Catalyst 9300-48P', icon: 'network', assetTypeId: switchType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'Catalyst 9200-24P', icon: 'network', assetTypeId: switchType.id, order: 2 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'CBS350-24P', icon: 'network', assetTypeId: switchType.id, order: 3 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: ubiquiti.id, name: 'USW-Pro-24-PoE', icon: 'network', assetTypeId: switchType.id, order: 4 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: ubiquiti.id, name: 'USW-Pro-48-PoE', icon: 'network', assetTypeId: switchType.id, order: 5 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: mikrotik.id, name: 'CRS326-24G-2S+', icon: 'network', assetTypeId: switchType.id, order: 6 } }),

    // IP Cameras
    prisma.lookupAssetModel.create({ data: { manufacturerId: hikvision.id, name: 'DS-2CD2143G2-I', icon: 'camera', assetTypeId: cameraType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: hikvision.id, name: 'DS-2CD2386G2-IU', icon: 'camera', assetTypeId: cameraType.id, order: 2 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: hikvision.id, name: 'DS-2CD2T47G2-L', icon: 'camera', assetTypeId: cameraType.id, order: 3 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: dahua.id, name: 'IPC-HDBW2431E-S', icon: 'camera', assetTypeId: cameraType.id, order: 4 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: dahua.id, name: 'IPC-HFW2831S-S', icon: 'camera', assetTypeId: cameraType.id, order: 5 } }),

    // Routers
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'ISR 4451-X', icon: 'router', assetTypeId: routerType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: cisco.id, name: 'ISR 4331', icon: 'router', assetTypeId: routerType.id, order: 2 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: mikrotik.id, name: 'CCR2004-1G-12S+2XS', icon: 'router', assetTypeId: routerType.id, order: 3 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: ubiquiti.id, name: 'Dream Machine Pro', icon: 'router', assetTypeId: routerType.id, order: 4 } }),

    // UPS
    prisma.lookupAssetModel.create({ data: { manufacturerId: apc.id, name: 'Smart-UPS 1500VA', icon: 'plug', assetTypeId: upsType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: apc.id, name: 'Smart-UPS 3000VA', icon: 'plug', assetTypeId: upsType.id, order: 2 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: apc.id, name: 'Smart-UPS 5000VA', icon: 'plug', assetTypeId: upsType.id, order: 3 } }),

    // TVs
    prisma.lookupAssetModel.create({ data: { manufacturerId: samsung.id, name: 'HG55AU800', icon: 'monitor', assetTypeId: tvType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: samsung.id, name: 'QM55R', icon: 'monitor', assetTypeId: tvType.id, order: 2 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: lg.id, name: '55UN73006LA', icon: 'monitor', assetTypeId: tvType.id, order: 3 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: lg.id, name: '55UM7600PLB', icon: 'monitor', assetTypeId: tvType.id, order: 4 } }),

    // Patch Panels
    prisma.lookupAssetModel.create({ data: { manufacturerId: panduit.id, name: 'CP24BLY', icon: 'server', assetTypeId: patchPanelType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: panduit.id, name: 'CP48BLY', icon: 'server', assetTypeId: patchPanelType.id, order: 2 } }),

    // NVRs
    prisma.lookupAssetModel.create({ data: { manufacturerId: hikvision.id, name: 'DS-7616NI-K2/16P', icon: 'hard-drive', assetTypeId: nvrType.id, order: 1 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: hikvision.id, name: 'DS-7732NI-K4/16P', icon: 'hard-drive', assetTypeId: nvrType.id, order: 2 } }),
    prisma.lookupAssetModel.create({ data: { manufacturerId: dahua.id, name: 'NVR5216-16P-4KS2E', icon: 'hard-drive', assetTypeId: nvrType.id, order: 3 } }),
  ]);

  console.log(`✅ Created ${assetModels.length} asset models\n`);

  // ============================================
  // STEP 6: Create Projects
  // ============================================
  console.log('🏗️  Creating projects...');

  // Project 1: Hotel in Santorini
  const project1 = await prisma.project.create({
    data: {
      name: 'Poseidon Luxury Suites',
      description: 'Εγκατάσταση ICT υποδομής σε luxury boutique hotel. WiFi, CCTV, IPTV και δομημένη καλωδίωση.',
      clientName: 'Poseidon Hotels S.A.',
      location: 'Σαντορίνη, Οία',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-04-30'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: pm1.id, role: 'PM' },
          { userId: tech1.id, role: 'TECHNICIAN' },
          { userId: tech2.id, role: 'TECHNICIAN' },
          { userId: client1.id, role: 'CLIENT' },
        ],
      },
    },
  });

  // Project 2: Resort in Crete
  const project2 = await prisma.project.create({
    data: {
      name: 'Aegean Beach Resort',
      description: 'Αναβάθμιση δικτυακής υποδομής και συστήματος CCTV σε all-inclusive resort.',
      clientName: 'Aegean Resorts Group',
      location: 'Κρήτη, Ρέθυμνο',
      status: 'IN_PROGRESS',
      startDate: new Date('2025-11-15'),
      endDate: new Date('2026-03-15'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: pm2.id, role: 'PM' },
          { userId: tech3.id, role: 'TECHNICIAN' },
          { userId: tech4.id, role: 'TECHNICIAN' },
          { userId: client2.id, role: 'CLIENT' },
        ],
      },
    },
  });

  // Project 3: Office Building in Athens
  const project3 = await prisma.project.create({
    data: {
      name: 'Alpha Business Center',
      description: 'Νέα εγκατάσταση δικτύου σε κτίριο γραφείων 8 ορόφων. Δομημένη καλωδίωση & WiFi.',
      clientName: 'Alpha Real Estate',
      location: 'Αθήνα, Μαρούσι',
      status: 'PLANNING',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-06-30'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: pm1.id, role: 'PM' },
          { userId: tech1.id, role: 'TECHNICIAN' },
        ],
      },
    },
  });

  // Project 4: Completed Hotel in Mykonos
  const project4 = await prisma.project.create({
    data: {
      name: 'Myconian Paradise',
      description: 'Ολοκληρωμένη εγκατάσταση ICT σε πολυτελές ξενοδοχείο.',
      clientName: 'Myconian Hotels',
      location: 'Μύκονος',
      status: 'COMPLETED',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-09-30'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: pm2.id, role: 'PM' },
          { userId: tech2.id, role: 'TECHNICIAN' },
        ],
      },
    },
  });

  // Project 5: Hospital in Thessaloniki
  const project5 = await prisma.project.create({
    data: {
      name: 'Ιατρικό Κέντρο Θεσσαλονίκης',
      description: 'Εγκατάσταση δικτύου και WiFi σε νέα πτέρυγα νοσοκομείου.',
      clientName: 'ΓΝΘ Ιπποκράτειο',
      location: 'Θεσσαλονίκη',
      status: 'ON_HOLD',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-08-31'),
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: pm1.id, role: 'PM' },
        ],
      },
    },
  });

  console.log(`✅ Created 5 projects\n`);

  // ============================================
  // STEP 7: Create Buildings and Floors for Project 1 (Santorini)
  // ============================================
  console.log('🏢 Creating buildings and floors for Poseidon Luxury Suites...');

  // Create building for Project 1
  const p1Building = await prisma.building.create({
    data: { projectId: project1.id, name: 'Main Building', description: 'Κύριο κτίριο ξενοδοχείου' },
  });

  const p1Floors = await Promise.all([
    prisma.floor.create({ data: { buildingId: p1Building.id, name: 'Υπόγειο (Τεχνικός Χώρος)', level: -1 } }),
    prisma.floor.create({ data: { buildingId: p1Building.id, name: 'Ισόγειο (Reception & Pool)', level: 0 } }),
    prisma.floor.create({ data: { buildingId: p1Building.id, name: '1ος Όροφος (Suites 101-108)', level: 1 } }),
    prisma.floor.create({ data: { buildingId: p1Building.id, name: '2ος Όροφος (Suites 201-208)', level: 2 } }),
    prisma.floor.create({ data: { buildingId: p1Building.id, name: 'Rooftop (Bar & Restaurant)', level: 3 } }),
  ]);

  // Rooms for Project 1
  const p1Basement = p1Floors[0];
  const p1Ground = p1Floors[1];
  const p1Floor1 = p1Floors[2];
  const p1Floor2 = p1Floors[3];
  const p1Rooftop = p1Floors[4];

  // Basement rooms
  const p1ServerRoom = await prisma.room.create({
    data: { floorId: p1Basement.id, name: 'Server Room', type: 'server_room', status: 'IN_PROGRESS' },
  });
  const p1SecurityRoom = await prisma.room.create({
    data: { floorId: p1Basement.id, name: 'Security Room', type: 'security_room', status: 'IN_PROGRESS' },
  });

  // Ground floor rooms
  const p1Reception = await prisma.room.create({
    data: { floorId: p1Ground.id, name: 'Reception', type: 'office', status: 'COMPLETED' },
  });
  const p1Lobby = await prisma.room.create({
    data: { floorId: p1Ground.id, name: 'Lobby', type: 'common_area', status: 'COMPLETED' },
  });
  const p1Pool = await prisma.room.create({
    data: { floorId: p1Ground.id, name: 'Pool Area', type: 'outdoor', status: 'IN_PROGRESS' },
  });

  // Floor 1 rooms
  const p1Rooms1 = await Promise.all([
    prisma.room.create({ data: { floorId: p1Floor1.id, name: 'Suite 101', type: 'suite', status: 'COMPLETED' } }),
    prisma.room.create({ data: { floorId: p1Floor1.id, name: 'Suite 102', type: 'suite', status: 'COMPLETED' } }),
    prisma.room.create({ data: { floorId: p1Floor1.id, name: 'Suite 103', type: 'suite', status: 'IN_PROGRESS' } }),
    prisma.room.create({ data: { floorId: p1Floor1.id, name: 'Suite 104', type: 'suite', status: 'IN_PROGRESS' } }),
    prisma.room.create({ data: { floorId: p1Floor1.id, name: 'Corridor 1A', type: 'corridor', status: 'COMPLETED' } }),
    prisma.room.create({ data: { floorId: p1Floor1.id, name: 'IDF-1', type: 'comms_room', status: 'COMPLETED' } }),
  ]);

  // Floor 2 rooms
  const p1Rooms2 = await Promise.all([
    prisma.room.create({ data: { floorId: p1Floor2.id, name: 'Suite 201', type: 'suite', status: 'NOT_STARTED' } }),
    prisma.room.create({ data: { floorId: p1Floor2.id, name: 'Suite 202', type: 'suite', status: 'NOT_STARTED' } }),
    prisma.room.create({ data: { floorId: p1Floor2.id, name: 'Presidential Suite', type: 'suite', status: 'NOT_STARTED' } }),
    prisma.room.create({ data: { floorId: p1Floor2.id, name: 'IDF-2', type: 'comms_room', status: 'NOT_STARTED' } }),
  ]);

  // Rooftop rooms
  const p1RooftopBar = await prisma.room.create({
    data: { floorId: p1Rooftop.id, name: 'Sunset Bar', type: 'bar', status: 'NOT_STARTED' },
  });
  const p1RooftopRestaurant = await prisma.room.create({
    data: { floorId: p1Rooftop.id, name: 'Caldera Restaurant', type: 'restaurant', status: 'NOT_STARTED' },
  });

  console.log('   ✓ Created floors and rooms for Project 1');

  // ============================================
  // STEP 8: Create Buildings and Floors for Project 2 (Crete)
  // ============================================
  console.log('🏢 Creating buildings and floors for Aegean Beach Resort...');

  // Create buildings for Project 2
  const p2BuildingA = await prisma.building.create({
    data: { projectId: project2.id, name: 'Κτίριο A', description: 'Κτίριο δωματίων και τεχνικός χώρος' },
  });
  const p2BuildingB = await prisma.building.create({
    data: { projectId: project2.id, name: 'Κτίριο B', description: 'Reception & Spa' },
  });
  const p2BuildingC = await prisma.building.create({
    data: { projectId: project2.id, name: 'Κτίριο C', description: 'Restaurant & Bar' },
  });
  const p2Outdoor = await prisma.building.create({
    data: { projectId: project2.id, name: 'Εξωτερικοί Χώροι', description: 'Pool Area & Beach' },
  });

  const p2Floors = await Promise.all([
    prisma.floor.create({ data: { buildingId: p2BuildingA.id, name: 'Τεχνικός Χώρος', level: 0 } }),
    prisma.floor.create({ data: { buildingId: p2BuildingA.id, name: 'Δωμάτια 1-20', level: 1 } }),
    prisma.floor.create({ data: { buildingId: p2BuildingB.id, name: 'Reception & Spa', level: 0 } }),
    prisma.floor.create({ data: { buildingId: p2BuildingC.id, name: 'Restaurant & Bar', level: 0 } }),
    prisma.floor.create({ data: { buildingId: p2Outdoor.id, name: 'Pool Area & Beach', level: 0 } }),
  ]);

  // Rooms for Project 2
  const p2Rooms = await Promise.all([
    // Building A Tech
    prisma.room.create({ data: { floorId: p2Floors[0].id, name: 'MDF Room', type: 'server_room', status: 'COMPLETED' } }),
    prisma.room.create({ data: { floorId: p2Floors[0].id, name: 'Security Center', type: 'security_room', status: 'IN_PROGRESS' } }),
    // Building A Rooms
    prisma.room.create({ data: { floorId: p2Floors[1].id, name: 'Room 101', type: 'guest_room', status: 'COMPLETED' } }),
    prisma.room.create({ data: { floorId: p2Floors[1].id, name: 'Room 102', type: 'guest_room', status: 'COMPLETED' } }),
    prisma.room.create({ data: { floorId: p2Floors[1].id, name: 'Room 103', type: 'guest_room', status: 'IN_PROGRESS' } }),
    prisma.room.create({ data: { floorId: p2Floors[1].id, name: 'Corridor A1', type: 'corridor', status: 'COMPLETED' } }),
    // Building B
    prisma.room.create({ data: { floorId: p2Floors[2].id, name: 'Main Reception', type: 'reception', status: 'COMPLETED' } }),
    prisma.room.create({ data: { floorId: p2Floors[2].id, name: 'Spa Center', type: 'spa', status: 'IN_PROGRESS' } }),
    prisma.room.create({ data: { floorId: p2Floors[2].id, name: 'Gym', type: 'gym', status: 'NOT_STARTED' } }),
    // Building C
    prisma.room.create({ data: { floorId: p2Floors[3].id, name: 'Main Restaurant', type: 'restaurant', status: 'IN_PROGRESS' } }),
    prisma.room.create({ data: { floorId: p2Floors[3].id, name: 'Beach Bar', type: 'bar', status: 'NOT_STARTED' } }),
    // Pool Area
    prisma.room.create({ data: { floorId: p2Floors[4].id, name: 'Main Pool', type: 'outdoor', status: 'NOT_STARTED' } }),
    prisma.room.create({ data: { floorId: p2Floors[4].id, name: 'Beach Zone', type: 'outdoor', status: 'NOT_STARTED' } }),
  ]);

  console.log('   ✓ Created floors and rooms for Project 2');

  // ============================================
  // STEP 9: Create Assets for Projects
  // ============================================
  console.log('📡 Creating assets...');

  const assets: any[] = [];

  // Project 1 - Server Room Assets
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: p1ServerRoom.id, assetTypeId: routerType.id, name: 'Core Router',
        model: 'Cisco ISR 4451-X', serialNumber: 'FJC2412L0HV', status: 'CONFIGURED',
        installedById: tech1.id, installedAt: new Date('2025-12-15'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p1ServerRoom.id, assetTypeId: switchType.id, name: 'Core Switch 01',
        model: 'Cisco Catalyst 9300-48P', serialNumber: 'FCW2345L0AB', status: 'VERIFIED',
        installedById: tech1.id, installedAt: new Date('2025-12-10'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p1ServerRoom.id, assetTypeId: upsType.id, name: 'UPS Main',
        model: 'APC Smart-UPS 3000VA', serialNumber: 'AS2401234567', status: 'INSTALLED',
        installedById: tech2.id, installedAt: new Date('2025-12-08'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p1ServerRoom.id, assetTypeId: patchPanelType.id, name: 'Patch Panel MDF-01',
        model: 'Panduit CP48BLY', serialNumber: 'PP-MDF-001', status: 'VERIFIED',
        installedById: tech2.id, installedAt: new Date('2025-12-05'),
      },
    })
  );

  // Project 1 - Reception & Lobby
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: p1Reception.id, assetTypeId: apType.id, name: 'AP-RECEPTION',
        model: 'Cisco Meraki MR46', serialNumber: 'Q2QN-XXXX-1001', status: 'VERIFIED',
        installedById: tech1.id, installedAt: new Date('2025-12-20'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p1Lobby.id, assetTypeId: apType.id, name: 'AP-LOBBY-01',
        model: 'Cisco Meraki MR46', serialNumber: 'Q2QN-XXXX-1002', status: 'VERIFIED',
        installedById: tech1.id, installedAt: new Date('2025-12-20'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p1Lobby.id, assetTypeId: cameraType.id, name: 'CAM-LOBBY-01',
        model: 'Hikvision DS-2CD2143G2-I', serialNumber: 'HKV20241201001', status: 'VERIFIED',
        installedById: tech2.id, installedAt: new Date('2025-12-22'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p1Lobby.id, assetTypeId: tvType.id, name: 'TV-LOBBY-INFO',
        model: 'Samsung QM55R', serialNumber: 'SAM55R20240001', status: 'INSTALLED',
      },
    })
  );

  // Project 1 - Suite rooms
  const suite101 = p1Rooms1[0];
  const suite102 = p1Rooms1[1];
  assets.push(
    await prisma.asset.create({
      data: {
        roomId: suite101.id, assetTypeId: apType.id, name: 'AP-101',
        model: 'Cisco Meraki MR36', serialNumber: 'Q2QN-XXXX-2101', status: 'VERIFIED',
        installedById: tech2.id, installedAt: new Date('2026-01-10'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: suite101.id, assetTypeId: tvType.id, name: 'TV-101',
        model: 'Samsung HG55AU800', serialNumber: 'SAM55AU2024001', status: 'VERIFIED',
        installedById: tech2.id, installedAt: new Date('2026-01-12'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: suite102.id, assetTypeId: apType.id, name: 'AP-102',
        model: 'Cisco Meraki MR36', serialNumber: 'Q2QN-XXXX-2102', status: 'VERIFIED',
        installedById: tech2.id, installedAt: new Date('2026-01-11'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: suite102.id, assetTypeId: tvType.id, name: 'TV-102',
        model: 'Samsung HG55AU800', serialNumber: 'SAM55AU2024002', status: 'INSTALLED',
      },
    })
  );

  // Project 2 - MDF Room
  const p2Mdf = p2Rooms[0];
  const p2Security = p2Rooms[1];
  const p2Reception = p2Rooms[6];

  assets.push(
    await prisma.asset.create({
      data: {
        roomId: p2Mdf.id, assetTypeId: switchType.id, name: 'Core Switch',
        model: 'Ubiquiti USW-Pro-48-PoE', serialNumber: 'USW48-001', status: 'VERIFIED',
        installedById: tech3.id, installedAt: new Date('2025-12-01'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p2Mdf.id, assetTypeId: routerType.id, name: 'Edge Router',
        model: 'Ubiquiti Dream Machine Pro', serialNumber: 'UDM-001', status: 'CONFIGURED',
        installedById: tech3.id, installedAt: new Date('2025-12-01'),
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p2Security.id, assetTypeId: nvrType.id, name: 'NVR Main',
        model: 'Hikvision DS-7732NI-K4/16P', serialNumber: 'NVR-001', status: 'IN_STOCK',
      },
    }),
    await prisma.asset.create({
      data: {
        roomId: p2Reception.id, assetTypeId: apType.id, name: 'AP-RECEPTION',
        model: 'Ubiquiti UniFi 6 Pro', serialNumber: 'U6P-001', status: 'VERIFIED',
        installedById: tech4.id, installedAt: new Date('2025-12-15'),
      },
    })
  );

  console.log(`✅ Created ${assets.length} assets\n`);

  // ============================================
  // STEP 10: Create Issues
  // ============================================
  console.log('⚠️  Creating issues...');

  const issues = await Promise.all([
    prisma.issue.create({
      data: {
        projectId: project1.id, roomId: p1ServerRoom.id,
        title: 'Κλιματισμός Server Room',
        description: 'Το κλιματιστικό δεν διατηρεί σταθερή θερμοκρασία. Χρειάζεται έλεγχος από HVAC.',
        causedBy: 'HVAC Contractor', priority: 'CRITICAL', status: 'OPEN',
        createdById: tech1.id,
      },
    }),
    prisma.issue.create({
      data: {
        projectId: project1.id, roomId: p1Pool.id,
        title: 'Καθυστέρηση outdoor APs',
        description: 'Τα outdoor APs για την πισίνα έχουν καθυστέρηση παράδοσης 2 εβδομάδες.',
        causedBy: 'Material Delay', priority: 'HIGH', status: 'IN_PROGRESS',
        createdById: pm1.id,
      },
    }),
    prisma.issue.create({
      data: {
        projectId: project1.id,
        title: 'Αναμονή σχεδίων από αρχιτέκτονα',
        description: 'Λείπουν τα as-built σχέδια του 2ου ορόφου.',
        causedBy: 'Architect', priority: 'MEDIUM', status: 'OPEN',
        createdById: pm1.id,
      },
    }),
    prisma.issue.create({
      data: {
        projectId: project2.id, roomId: p2Rooms[9].id, // Main Restaurant
        title: 'Ψευδοροφή εστιατορίου',
        description: 'Δεν έχει ολοκληρωθεί η ψευδοροφή. Αδυνατούμε να τοποθετήσουμε APs.',
        causedBy: 'General Contractor', priority: 'HIGH', status: 'OPEN',
        createdById: tech3.id,
      },
    }),
    prisma.issue.create({
      data: {
        projectId: project2.id,
        title: 'Ηλεκτρολογική παροχή Spa',
        description: 'Δεν υπάρχει παροχή ρεύματος στο rack του Spa.',
        causedBy: 'Electrical Contractor', priority: 'CRITICAL', status: 'IN_PROGRESS',
        createdById: tech4.id,
      },
    }),
  ]);

  // Add comments
  await prisma.issueComment.createMany({
    data: [
      { issueId: issues[0].id, userId: pm1.id, comment: 'Επικοινώνησα με το συνεργείο. Θα έρθουν αύριο.' },
      { issueId: issues[0].id, userId: tech1.id, comment: 'Έβαλα προσωρινό portable AC.' },
      { issueId: issues[1].id, userId: pm1.id, comment: 'Νέα ημερομηνία παράδοσης: 15/02.' },
    ],
  });

  console.log(`✅ Created ${issues.length} issues\n`);

  // ============================================
  // STEP 11: Create Time Entries
  // ============================================
  console.log('⏱️  Creating time entries...');

  await Promise.all([
    prisma.timeEntry.create({
      data: {
        projectId: project1.id, userId: tech1.id, roomId: p1ServerRoom.id,
        type: 'INSTALLATION', description: 'Εγκατάσταση core equipment',
        date: new Date('2025-12-10'), hours: 8,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project1.id, userId: tech1.id,
        type: 'CONFIGURATION', description: 'Παραμετροποίηση VLANs',
        date: new Date('2025-12-11'), hours: 6,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project1.id, userId: tech2.id, roomId: p1Lobby.id,
        type: 'INSTALLATION', description: 'Εγκατάσταση APs & κάμερες Lobby',
        date: new Date('2025-12-22'), hours: 5,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project2.id, userId: tech3.id, roomId: p2Mdf.id,
        type: 'INSTALLATION', description: 'Εγκατάσταση MDF equipment',
        date: new Date('2025-12-01'), hours: 8,
      },
    }),
    prisma.timeEntry.create({
      data: {
        projectId: project2.id, userId: tech4.id,
        type: 'INSTALLATION', description: 'Καλωδίωση κτιρίου B',
        date: new Date('2025-12-10'), hours: 10,
      },
    }),
  ]);

  console.log('✅ Created time entries\n');

  // ============================================
  // STEP 12: Create Inventory Items
  // ============================================
  console.log('📦 Creating inventory...');

  await Promise.all([
    prisma.inventoryItem.create({
      data: {
        projectId: project1.id, itemType: 'Cable - Cat6 UTP',
        description: 'Cat6 UTP Cable 305m Box - Blue', unit: 'box',
        quantityReceived: 10, quantityUsed: 6,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project1.id, itemType: 'RJ45 Connectors',
        description: 'Cat6 RJ45 Connectors (100pcs)', unit: 'bag',
        quantityReceived: 20, quantityUsed: 12,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project1.id, itemType: 'Access Point',
        description: 'Cisco Meraki MR46', unit: 'pcs',
        quantityReceived: 15, quantityUsed: 8,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project2.id, itemType: 'Cable - Cat6 UTP',
        description: 'Cat6 UTP Cable 305m Box - Grey', unit: 'box',
        quantityReceived: 15, quantityUsed: 5,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        projectId: project2.id, itemType: 'Access Point',
        description: 'Ubiquiti UniFi 6 Pro', unit: 'pcs',
        quantityReceived: 25, quantityUsed: 10,
      },
    }),
  ]);

  console.log('✅ Created inventory items\n');

  // ============================================
  // Summary
  // ============================================
  console.log('═══════════════════════════════════════════');
  console.log('🎉 DATABASE SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log('   👤 Users: 9 (1 admin, 2 PMs, 4 technicians, 2 clients)');
  console.log('   📋 Lookups:');
  console.log(`      - Room Types: ${roomTypes.length}`);
  console.log(`      - Inventory Units: ${inventoryUnits.length}`);
  console.log(`      - Issue Causes: ${issueCauses.length}`);
  console.log(`      - Manufacturers: ${manufacturers.length}`);
  console.log(`      - Asset Models: ${assetModels.length} (linked to types!)`);
  console.log(`   📦 Asset Types: ${assetTypes.length}`);
  console.log('   🏗️  Projects: 5');
  console.log(`   📡 Assets: ${assets.length}`);
  console.log(`   ⚠️  Issues: ${issues.length}`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   Admin:      admin@synax.gr / admin123');
  console.log('   PM:         maria@synax.gr / pm123456');
  console.log('   PM:         kostas@synax.gr / pm123456');
  console.log('   Technician: nikos@synax.gr / tech123456');
  console.log('   Technician: dimitris@synax.gr / tech123456');
  console.log('   Technician: giannis@synax.gr / tech123456');
  console.log('   Technician: andreas@synax.gr / tech123456');
  console.log('   Client:     alexandros@poseidon-hotels.gr / client123');
  console.log('   Client:     elena@aegean-resorts.gr / client123');
  console.log('');
  console.log('📍 Projects:');
  console.log('   1. Poseidon Luxury Suites (Σαντορίνη) - IN_PROGRESS');
  console.log('   2. Aegean Beach Resort (Κρήτη) - IN_PROGRESS');
  console.log('   3. Alpha Business Center (Αθήνα) - PLANNING');
  console.log('   4. Myconian Paradise (Μύκονος) - COMPLETED');
  console.log('   5. Ιατρικό Κέντρο Θεσσαλονίκης - ON_HOLD');
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
