import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning existing data (keeping users)...');

  // Delete in correct order due to foreign keys
  await prisma.issuePhoto.deleteMany();
  await prisma.issueComment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.checklistPhoto.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.assetType.deleteMany();

  console.log('✅ Data cleaned!');

  // ============================================
  // USERS
  // ============================================
  console.log('👥 Creating users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Project Managers
  const pmGiannis = await prisma.user.upsert({
    where: { email: 'giannis.papadopoulos@synax.gr' },
    update: {},
    create: {
      email: 'giannis.papadopoulos@synax.gr',
      passwordHash,
      name: 'Γιάννης Παπαδόπουλος',
      role: 'PM',
    },
  });

  const pmMaria = await prisma.user.upsert({
    where: { email: 'maria.konstantinou@synax.gr' },
    update: {},
    create: {
      email: 'maria.konstantinou@synax.gr',
      passwordHash,
      name: 'Μαρία Κωνσταντίνου',
      role: 'PM',
    },
  });

  // Technicians
  const techNikos = await prisma.user.upsert({
    where: { email: 'nikos.alexiou@synax.gr' },
    update: {},
    create: {
      email: 'nikos.alexiou@synax.gr',
      passwordHash,
      name: 'Νίκος Αλεξίου',
      role: 'TECHNICIAN',
    },
  });

  const techDimitris = await prisma.user.upsert({
    where: { email: 'dimitris.georgiou@synax.gr' },
    update: {},
    create: {
      email: 'dimitris.georgiou@synax.gr',
      passwordHash,
      name: 'Δημήτρης Γεωργίου',
      role: 'TECHNICIAN',
    },
  });

  const techKostas = await prisma.user.upsert({
    where: { email: 'kostas.nikolaou@synax.gr' },
    update: {},
    create: {
      email: 'kostas.nikolaou@synax.gr',
      passwordHash,
      name: 'Κώστας Νικολάου',
      role: 'TECHNICIAN',
    },
  });

  const techEleni = await prisma.user.upsert({
    where: { email: 'eleni.vasileiou@synax.gr' },
    update: {},
    create: {
      email: 'eleni.vasileiou@synax.gr',
      passwordHash,
      name: 'Ελένη Βασιλείου',
      role: 'TECHNICIAN',
    },
  });

  const techPetros = await prisma.user.upsert({
    where: { email: 'petros.antoniou@synax.gr' },
    update: {},
    create: {
      email: 'petros.antoniou@synax.gr',
      passwordHash,
      name: 'Πέτρος Αντωνίου',
      role: 'TECHNICIAN',
    },
  });

  // Clients
  const clientSantorini = await prisma.user.upsert({
    where: { email: 'info@santoriniluxury.gr' },
    update: {},
    create: {
      email: 'info@santoriniluxury.gr',
      passwordHash,
      name: 'Αντώνης Καλλέργης',
      role: 'CLIENT',
    },
  });

  const clientMykonos = await prisma.user.upsert({
    where: { email: 'management@mykonosbeach.gr' },
    update: {},
    create: {
      email: 'management@mykonosbeach.gr',
      passwordHash,
      name: 'Σοφία Μαυροματάκη',
      role: 'CLIENT',
    },
  });

  const clientLidl = await prisma.user.upsert({
    where: { email: 'it@lidl.gr' },
    update: {},
    create: {
      email: 'it@lidl.gr',
      passwordHash,
      name: 'Lidl Hellas IT',
      role: 'CLIENT',
    },
  });

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  // ============================================
  // ASSET TYPES
  // ============================================
  console.log('📦 Creating asset types...');

  const apType = await prisma.assetType.create({
    data: {
      name: 'Access Point',
      icon: 'wifi',
      checklistTemplate: [
        { type: 'CABLING', items: ['Ethernet καλώδιο συνδεδεμένο', 'PoE ενεργό', 'Καλώδιο ετικετοποιημένο'] },
        { type: 'EQUIPMENT', items: ['AP τοποθετημένο στη σωστή θέση', 'Στερέωση ασφαλής', 'LED indicators OK'] },
        { type: 'CONFIG', items: ['SSID ρυθμισμένο', 'VLAN configuration', 'Controller registered', 'Firmware updated'] },
        { type: 'DOCUMENTATION', items: ['Φωτογραφία εγκατάστασης', 'MAC address καταγεγραμμένη', 'Signal test complete'] },
      ],
    },
  });

  const switchType = await prisma.assetType.create({
    data: {
      name: 'Network Switch',
      icon: 'server',
      checklistTemplate: [
        { type: 'CABLING', items: ['Uplink συνδεδεμένο', 'Patch cables οργανωμένα', 'Power cable connected'] },
        { type: 'EQUIPMENT', items: ['Switch τοποθετημένο σε rack', 'Ventilation OK', 'Labeling complete'] },
        { type: 'CONFIG', items: ['VLANs configured', 'Port security enabled', 'SNMP configured', 'Firmware updated'] },
        { type: 'DOCUMENTATION', items: ['Port mapping documented', 'Config backup taken', 'Photos uploaded'] },
      ],
    },
  });

  const tvType = await prisma.assetType.create({
    data: {
      name: 'Smart TV',
      icon: 'tv',
      checklistTemplate: [
        { type: 'CABLING', items: ['HDMI καλώδιο', 'Ethernet/WiFi connected', 'Power connected'] },
        { type: 'EQUIPMENT', items: ['TV τοποθετημένη', 'Bracket secure', 'Remote paired'] },
        { type: 'CONFIG', items: ['Hotel TV mode enabled', 'Channels configured', 'Welcome screen set', 'Volume limits set'] },
        { type: 'DOCUMENTATION', items: ['Serial number recorded', 'Room assignment logged', 'Test photo taken'] },
      ],
    },
  });

  const cameraType = await prisma.assetType.create({
    data: {
      name: 'IP Camera',
      icon: 'camera',
      checklistTemplate: [
        { type: 'CABLING', items: ['Ethernet PoE connected', 'Cable routed properly', 'Weatherproof connections'] },
        { type: 'EQUIPMENT', items: ['Camera mounted', 'Angle adjusted', 'Focus set'] },
        { type: 'CONFIG', items: ['NVR registered', 'Motion detection zones', 'Recording schedule set', 'Remote access tested'] },
        { type: 'DOCUMENTATION', items: ['Coverage area documented', 'IP address logged', 'Test recording verified'] },
      ],
    },
  });

  const phoneType = await prisma.assetType.create({
    data: {
      name: 'VoIP Phone',
      icon: 'phone',
      checklistTemplate: [
        { type: 'CABLING', items: ['Ethernet connected', 'Handset connected', 'Power adapter if needed'] },
        { type: 'EQUIPMENT', items: ['Phone placed on desk', 'Wall mount if applicable', 'Display working'] },
        { type: 'CONFIG', items: ['Extension assigned', 'PBX registered', 'Voicemail configured', 'Speed dials set'] },
        { type: 'DOCUMENTATION', items: ['Extension number documented', 'User guide provided', 'Test call made'] },
      ],
    },
  });

  const posType = await prisma.assetType.create({
    data: {
      name: 'POS Terminal',
      icon: 'credit-card',
      checklistTemplate: [
        { type: 'CABLING', items: ['Ethernet/WiFi connected', 'Power connected', 'Printer cable if applicable'] },
        { type: 'EQUIPMENT', items: ['Terminal secured', 'Receipt printer loaded', 'Card reader clean'] },
        { type: 'CONFIG', items: ['Merchant ID configured', 'Bank connection tested', 'Receipt format set'] },
        { type: 'DOCUMENTATION', items: ['Terminal ID recorded', 'Test transaction done', 'Staff training complete'] },
      ],
    },
  });

  const signageType = await prisma.assetType.create({
    data: {
      name: 'Digital Signage',
      icon: 'monitor',
      checklistTemplate: [
        { type: 'CABLING', items: ['HDMI/Network connected', 'Power connected', 'Cable management done'] },
        { type: 'EQUIPMENT', items: ['Display mounted', 'Media player connected', 'Ventilation adequate'] },
        { type: 'CONFIG', items: ['CMS registered', 'Content scheduled', 'Auto-on/off configured'] },
        { type: 'DOCUMENTATION', items: ['Location documented', 'Content requirements noted', 'Maintenance access info'] },
      ],
    },
  });

  const routerType = await prisma.assetType.create({
    data: {
      name: 'Router',
      icon: 'router',
      checklistTemplate: [
        { type: 'CABLING', items: ['WAN connected', 'LAN ports connected', 'Power connected'] },
        { type: 'EQUIPMENT', items: ['Router mounted/placed', 'Antennas attached', 'Cooling adequate'] },
        { type: 'CONFIG', items: ['WAN configured', 'DHCP/NAT set', 'Firewall rules applied', 'VPN if needed'] },
        { type: 'DOCUMENTATION', items: ['IP scheme documented', 'Admin credentials stored', 'Config backup taken'] },
      ],
    },
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const randomAssetStatus = () => {
    const statuses = ['PLANNED', 'IN_STOCK', 'INSTALLED', 'CONFIGURED', 'VERIFIED'] as const;
    const weights = [0.05, 0.1, 0.25, 0.25, 0.35];
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) return statuses[i];
    }
    return 'VERIFIED';
  };

  const randomRoomStatus = () => {
    const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
    const weights = [0.1, 0.25, 0.65];
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) return statuses[i];
    }
    return 'COMPLETED';
  };

  const generateMAC = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
    return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
  };

  const generateSerial = (prefix: string) => {
    return `${prefix}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  };

  // ============================================
  // PROJECT 1: SANTORINI LUXURY SUITES
  // ============================================
  console.log('🏨 Creating Santorini Luxury Suites...');

  const santoriniProject = await prisma.project.create({
    data: {
      name: 'Santorini Luxury Suites',
      clientName: 'Καλλέργης Hospitality Group',
      location: 'Οία, Σαντορίνη',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-06-15'),
      description: 'Πλήρης εγκατάσταση ICT υποδομής σε boutique ξενοδοχείο 5 αστέρων με 24 σουίτες και caldera view. Περιλαμβάνει high-speed WiFi, Smart TVs, IP τηλεφωνία και σύστημα ασφαλείας.',
      members: {
        create: [
          { userId: pmGiannis.id, role: 'PM' },
          { userId: techNikos.id, role: 'TECHNICIAN' },
          { userId: techDimitris.id, role: 'TECHNICIAN' },
          { userId: clientSantorini.id, role: 'CLIENT' },
        ],
      },
    },
  });

  // Santorini Floors
  const santoriniFloors = await Promise.all([
    prisma.floor.create({
      data: { name: 'Υπόγειο - Τεχνικός Χώρος', level: -1, projectId: santoriniProject.id },
    }),
    prisma.floor.create({
      data: { name: 'Ισόγειο - Reception & Εστιατόριο', level: 0, projectId: santoriniProject.id },
    }),
    prisma.floor.create({
      data: { name: '1ος Όροφος - Σουίτες 101-108', level: 1, projectId: santoriniProject.id },
    }),
    prisma.floor.create({
      data: { name: '2ος Όροφος - Σουίτες 201-208', level: 2, projectId: santoriniProject.id },
    }),
    prisma.floor.create({
      data: { name: '3ος Όροφος - Premium Suites', level: 3, projectId: santoriniProject.id },
    }),
  ]);

  // Santorini Basement Rooms
  const santoriniBasementRooms = await Promise.all([
    prisma.room.create({
      data: { name: 'Server Room', type: 'TECHNICAL', status: 'COMPLETED', floorId: santoriniFloors[0].id, pinX: 150, pinY: 100 },
    }),
    prisma.room.create({
      data: { name: 'UPS Room', type: 'TECHNICAL', status: 'COMPLETED', floorId: santoriniFloors[0].id, pinX: 300, pinY: 100 },
    }),
    prisma.room.create({
      data: { name: 'CCTV Control', type: 'TECHNICAL', status: 'COMPLETED', floorId: santoriniFloors[0].id, pinX: 450, pinY: 100 },
    }),
  ]);

  // Santorini Ground Floor Rooms
  const santoriniGroundRooms = await Promise.all([
    prisma.room.create({
      data: { name: 'Reception', type: 'COMMON', status: 'COMPLETED', floorId: santoriniFloors[1].id, pinX: 200, pinY: 150 },
    }),
    prisma.room.create({
      data: { name: 'Lobby Lounge', type: 'COMMON', status: 'COMPLETED', floorId: santoriniFloors[1].id, pinX: 400, pinY: 150 },
    }),
    prisma.room.create({
      data: { name: 'Εστιατόριο Ambrosia', type: 'COMMON', status: 'COMPLETED', floorId: santoriniFloors[1].id, pinX: 300, pinY: 300 },
    }),
    prisma.room.create({
      data: { name: 'Pool Bar', type: 'COMMON', status: 'IN_PROGRESS', floorId: santoriniFloors[1].id, pinX: 500, pinY: 300 },
    }),
    prisma.room.create({
      data: { name: 'Back Office', type: 'OFFICE', status: 'COMPLETED', floorId: santoriniFloors[1].id, pinX: 100, pinY: 250 },
    }),
  ]);

  // Santorini Floor 1 - Suites 101-108
  const santoriniFloor1Rooms = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.room.create({
        data: {
          name: `Suite ${101 + i}`,
          type: 'ROOM',
          status: randomRoomStatus(),
          floorId: santoriniFloors[2].id,
          pinX: 100 + (i % 4) * 150,
          pinY: 100 + Math.floor(i / 4) * 200,
        },
      })
    )
  );

  // Santorini Floor 2 - Suites 201-208
  const santoriniFloor2Rooms = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.room.create({
        data: {
          name: `Suite ${201 + i}`,
          type: 'ROOM',
          status: randomRoomStatus(),
          floorId: santoriniFloors[3].id,
          pinX: 100 + (i % 4) * 150,
          pinY: 100 + Math.floor(i / 4) * 200,
        },
      })
    )
  );

  // Santorini Floor 3 - Premium Suites
  const santoriniFloor3Rooms = await Promise.all([
    prisma.room.create({
      data: { name: 'Caldera Grand Suite', type: 'ROOM', status: 'COMPLETED', floorId: santoriniFloors[4].id, pinX: 150, pinY: 150 },
    }),
    prisma.room.create({
      data: { name: 'Sunset Honeymoon Suite', type: 'ROOM', status: 'COMPLETED', floorId: santoriniFloors[4].id, pinX: 400, pinY: 150 },
    }),
    prisma.room.create({
      data: { name: 'Presidential Suite', type: 'ROOM', status: 'COMPLETED', floorId: santoriniFloors[4].id, pinX: 275, pinY: 300 },
    }),
    prisma.room.create({
      data: { name: 'Roof Terrace', type: 'COMMON', status: 'IN_PROGRESS', floorId: santoriniFloors[4].id, pinX: 275, pinY: 450 },
    }),
  ]);

  // Create assets for Santorini
  console.log('   📡 Adding Santorini assets...');

  // Server Room Assets
  await prisma.asset.create({
    data: {
      name: 'Core Switch',
      serialNumber: generateSerial('SW-SANT-'),
      macAddress: generateMAC(),
      status: 'VERIFIED',
      roomId: santoriniBasementRooms[0].id,
      assetTypeId: switchType.id,
      notes: 'Cisco Catalyst 9300 - Core distribution switch',
    },
  });

  await prisma.asset.create({
    data: {
      name: 'Main Router',
      serialNumber: generateSerial('RT-SANT-'),
      macAddress: generateMAC(),
      status: 'VERIFIED',
      roomId: santoriniBasementRooms[0].id,
      assetTypeId: routerType.id,
      notes: 'Cisco ISR 4331 - Primary internet router',
    },
  });

  // Reception Assets
  await prisma.asset.create({
    data: {
      name: 'Reception AP',
      serialNumber: generateSerial('AP-'),
      macAddress: generateMAC(),
      status: 'VERIFIED',
      roomId: santoriniGroundRooms[0].id,
      assetTypeId: apType.id,
    },
  });

  await prisma.asset.create({
    data: {
      name: 'Reception Phone 1',
      serialNumber: generateSerial('PH-'),
      macAddress: generateMAC(),
      status: 'VERIFIED',
      roomId: santoriniGroundRooms[0].id,
      assetTypeId: phoneType.id,
    },
  });

  await prisma.asset.create({
    data: {
      name: 'Lobby Display',
      serialNumber: generateSerial('DS-'),
      macAddress: generateMAC(),
      status: 'CONFIGURED',
      roomId: santoriniGroundRooms[1].id,
      assetTypeId: signageType.id,
    },
  });

  // Create assets for each suite
  const allSantoriniSuites = [...santoriniFloor1Rooms, ...santoriniFloor2Rooms, ...santoriniFloor3Rooms.slice(0, 3)];

  for (const suite of allSantoriniSuites) {
    await prisma.asset.create({
      data: {
        name: `${suite.name} - Smart TV`,
        serialNumber: generateSerial('TV-'),
        macAddress: generateMAC(),
        status: randomAssetStatus(),
        roomId: suite.id,
        assetTypeId: tvType.id,
      },
    });

    await prisma.asset.create({
      data: {
        name: `${suite.name} - AP`,
        serialNumber: generateSerial('AP-'),
        macAddress: generateMAC(),
        status: randomAssetStatus(),
        roomId: suite.id,
        assetTypeId: apType.id,
      },
    });

    await prisma.asset.create({
      data: {
        name: `${suite.name} - VoIP Phone`,
        serialNumber: generateSerial('PH-'),
        macAddress: generateMAC(),
        status: randomAssetStatus(),
        roomId: suite.id,
        assetTypeId: phoneType.id,
      },
    });
  }

  // ============================================
  // PROJECT 2: MYKONOS BEACH RESORT
  // ============================================
  console.log('🏨 Creating Mykonos Beach Resort...');

  const mykonosProject = await prisma.project.create({
    data: {
      name: 'Mykonos Beach Resort',
      clientName: 'Mavromati Hotels & Resorts',
      location: 'Ψαρού, Μύκονος',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-05-30'),
      description: 'Αναβάθμιση δικτυακής υποδομής σε 5-star beach resort με 45 δωμάτια, beach club και spa. Focus σε outdoor WiFi coverage και entertainment systems.',
      members: {
        create: [
          { userId: pmMaria.id, role: 'PM' },
          { userId: techKostas.id, role: 'TECHNICIAN' },
          { userId: techEleni.id, role: 'TECHNICIAN' },
          { userId: clientMykonos.id, role: 'CLIENT' },
        ],
      },
    },
  });

  // Mykonos Floors
  const mykonosFloors = await Promise.all([
    prisma.floor.create({ data: { name: 'Basement - Technical', level: -1, projectId: mykonosProject.id } }),
    prisma.floor.create({ data: { name: 'Ground - Lobby & Beach Club', level: 0, projectId: mykonosProject.id } }),
    prisma.floor.create({ data: { name: 'Floor 1 - Rooms 101-115', level: 1, projectId: mykonosProject.id } }),
    prisma.floor.create({ data: { name: 'Floor 2 - Rooms 201-215', level: 2, projectId: mykonosProject.id } }),
    prisma.floor.create({ data: { name: 'Floor 3 - Rooms 301-315', level: 3, projectId: mykonosProject.id } }),
  ]);

  // Mykonos Ground Floor
  await Promise.all([
    prisma.room.create({ data: { name: 'Main Reception', type: 'COMMON', status: 'COMPLETED', floorId: mykonosFloors[1].id, pinX: 200, pinY: 100 } }),
    prisma.room.create({ data: { name: 'Beach Club Bar', type: 'COMMON', status: 'COMPLETED', floorId: mykonosFloors[1].id, pinX: 400, pinY: 100 } }),
    prisma.room.create({ data: { name: 'Pool Area', type: 'COMMON', status: 'IN_PROGRESS', floorId: mykonosFloors[1].id, pinX: 300, pinY: 250 } }),
    prisma.room.create({ data: { name: 'Spa Reception', type: 'COMMON', status: 'COMPLETED', floorId: mykonosFloors[1].id, pinX: 500, pinY: 250 } }),
    prisma.room.create({ data: { name: 'Restaurant Aegean', type: 'COMMON', status: 'COMPLETED', floorId: mykonosFloors[1].id, pinX: 100, pinY: 250 } }),
  ]);

  // Mykonos Rooms per floor
  for (let floor = 0; floor < 3; floor++) {
    for (let room = 1; room <= 15; room++) {
      const roomNum = (floor + 1) * 100 + room;
      await prisma.room.create({
        data: {
          name: `Room ${roomNum}`,
          type: 'ROOM',
          status: randomRoomStatus(),
          floorId: mykonosFloors[2 + floor].id,
          pinX: 50 + ((room - 1) % 5) * 120,
          pinY: 80 + Math.floor((room - 1) / 5) * 150,
        },
      });
    }
  }

  // ============================================
  // PROJECT 3: RHODES PALACE HOTEL
  // ============================================
  console.log('🏨 Creating Rhodes Palace Hotel...');

  const rhodesProject = await prisma.project.create({
    data: {
      name: 'Rhodes Palace Hotel',
      clientName: 'Dodecanese Hospitality SA',
      location: 'Ιξιά, Ρόδος',
      status: 'PLANNING',
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-09-30'),
      description: 'Νέα εγκατάσταση σε μεγάλο resort 200 δωματίων. Πλήρης ICT υποδομή με emphasis σε conference facilities και MICE tourism.',
      members: {
        create: [
          { userId: pmGiannis.id, role: 'PM' },
          { userId: techPetros.id, role: 'TECHNICIAN' },
          { userId: techNikos.id, role: 'TECHNICIAN' },
        ],
      },
    },
  });

  // Rhodes Floors (larger hotel)
  const rhodesFloors = await Promise.all([
    prisma.floor.create({ data: { name: 'Basement - Technical & Storage', level: -1, projectId: rhodesProject.id } }),
    prisma.floor.create({ data: { name: 'Ground - Lobby & Conference', level: 0, projectId: rhodesProject.id } }),
    prisma.floor.create({ data: { name: 'Floor 1 - Standard Rooms', level: 1, projectId: rhodesProject.id } }),
    prisma.floor.create({ data: { name: 'Floor 2 - Standard Rooms', level: 2, projectId: rhodesProject.id } }),
    prisma.floor.create({ data: { name: 'Floor 3 - Superior Rooms', level: 3, projectId: rhodesProject.id } }),
    prisma.floor.create({ data: { name: 'Floor 4 - Suites', level: 4, projectId: rhodesProject.id } }),
  ]);

  // Rhodes Conference rooms
  await Promise.all([
    prisma.room.create({ data: { name: 'Conference Hall A', type: 'COMMON', status: 'NOT_STARTED', floorId: rhodesFloors[1].id, pinX: 150, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Conference Hall B', type: 'COMMON', status: 'NOT_STARTED', floorId: rhodesFloors[1].id, pinX: 350, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Meeting Room 1', type: 'OFFICE', status: 'NOT_STARTED', floorId: rhodesFloors[1].id, pinX: 550, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Main Lobby', type: 'COMMON', status: 'NOT_STARTED', floorId: rhodesFloors[1].id, pinX: 350, pinY: 100 } }),
  ]);

  // ============================================
  // PROJECT 4: CRETE GRAND HOTEL
  // ============================================
  console.log('🏨 Creating Crete Grand Hotel...');

  const creteProject = await prisma.project.create({
    data: {
      name: 'Crete Grand Hotel',
      clientName: 'Minoan Hotels Group',
      location: 'Αμμουδάρα, Ηράκλειο',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-04-30'),
      description: 'Αναβάθμιση δικτύου σε established 4-star hotel. Αντικατάσταση legacy συστημάτων με modern IP-based infrastructure.',
      members: {
        create: [
          { userId: pmMaria.id, role: 'PM' },
          { userId: techDimitris.id, role: 'TECHNICIAN' },
          { userId: techEleni.id, role: 'TECHNICIAN' },
        ],
      },
    },
  });

  // Crete Floors
  const creteFloors = await Promise.all([
    prisma.floor.create({ data: { name: 'Technical Basement', level: -1, projectId: creteProject.id } }),
    prisma.floor.create({ data: { name: 'Ground Floor', level: 0, projectId: creteProject.id } }),
    prisma.floor.create({ data: { name: '1st Floor - Rooms', level: 1, projectId: creteProject.id } }),
    prisma.floor.create({ data: { name: '2nd Floor - Rooms', level: 2, projectId: creteProject.id } }),
  ]);

  // Crete rooms
  for (let floor = 0; floor < 2; floor++) {
    for (let room = 1; room <= 20; room++) {
      const roomNum = (floor + 1) * 100 + room;
      await prisma.room.create({
        data: {
          name: `Room ${roomNum}`,
          type: 'ROOM',
          status: randomRoomStatus(),
          floorId: creteFloors[2 + floor].id,
          pinX: 40 + ((room - 1) % 5) * 110,
          pinY: 60 + Math.floor((room - 1) / 5) * 120,
        },
      });
    }
  }

  // ============================================
  // PROJECT 5: CORFU BAY RESORT
  // ============================================
  console.log('🏨 Creating Corfu Bay Resort...');

  const corfuProject = await prisma.project.create({
    data: {
      name: 'Corfu Bay Resort',
      clientName: 'Ionian Leisure Properties',
      location: 'Γουβιά, Κέρκυρα',
      status: 'COMPLETED',
      startDate: new Date('2023-10-01'),
      endDate: new Date('2024-01-15'),
      description: 'Ολοκληρωμένο project σε family resort. Εγκατάσταση ολοκληρώθηκε επιτυχώς. Υπό maintenance contract.',
      members: {
        create: [
          { userId: pmGiannis.id, role: 'PM' },
          { userId: techKostas.id, role: 'TECHNICIAN' },
        ],
      },
    },
  });

  // Corfu Floors
  const corfuFloors = await Promise.all([
    prisma.floor.create({ data: { name: 'Ground Floor', level: 0, projectId: corfuProject.id } }),
    prisma.floor.create({ data: { name: '1st Floor', level: 1, projectId: corfuProject.id } }),
    prisma.floor.create({ data: { name: '2nd Floor', level: 2, projectId: corfuProject.id } }),
  ]);

  // Corfu rooms - all completed since project is complete
  for (let floor = 0; floor < 3; floor++) {
    for (let room = 1; room <= 12; room++) {
      const roomNum = floor * 100 + room;
      await prisma.room.create({
        data: {
          name: floor === 0 ? `Ground ${room}` : `Room ${roomNum}`,
          type: 'ROOM',
          status: 'COMPLETED',
          floorId: corfuFloors[floor].id,
          pinX: 50 + ((room - 1) % 4) * 140,
          pinY: 80 + Math.floor((room - 1) / 4) * 150,
        },
      });
    }
  }

  // ============================================
  // PROJECT 6: LIDL MAROUSSI
  // ============================================
  console.log('🛒 Creating Lidl Maroussi...');

  const lidlMaroussiProject = await prisma.project.create({
    data: {
      name: 'Lidl Μαρούσι',
      clientName: 'Lidl Hellas',
      location: 'Λεωφ. Κηφισίας 120, Μαρούσι',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-15'),
      description: 'Νέο κατάστημα Lidl - Εγκατάσταση δικτύου, POS συστημάτων, ψηφιακής σήμανσης και συστήματος ασφαλείας.',
      members: {
        create: [
          { userId: pmGiannis.id, role: 'PM' },
          { userId: techPetros.id, role: 'TECHNICIAN' },
          { userId: techNikos.id, role: 'TECHNICIAN' },
          { userId: clientLidl.id, role: 'CLIENT' },
        ],
      },
    },
  });

  // Lidl Maroussi Floors
  const lidlMaroussiFloors = await Promise.all([
    prisma.floor.create({ data: { name: 'Αποθήκη & Τεχνικός Χώρος', level: -1, projectId: lidlMaroussiProject.id } }),
    prisma.floor.create({ data: { name: 'Κατάστημα', level: 0, projectId: lidlMaroussiProject.id } }),
  ]);

  // Lidl Maroussi Store Areas
  const lidlMaroussiRooms = await Promise.all([
    // Basement
    prisma.room.create({ data: { name: 'Server Room', type: 'TECHNICAL', status: 'COMPLETED', floorId: lidlMaroussiFloors[0].id, pinX: 100, pinY: 100 } }),
    prisma.room.create({ data: { name: 'Αποθήκη Κεντρική', type: 'STORAGE', status: 'COMPLETED', floorId: lidlMaroussiFloors[0].id, pinX: 300, pinY: 100 } }),
    prisma.room.create({ data: { name: 'Ψυκτικοί Θάλαμοι', type: 'STORAGE', status: 'COMPLETED', floorId: lidlMaroussiFloors[0].id, pinX: 500, pinY: 100 } }),
    // Store Floor
    prisma.room.create({ data: { name: 'Είσοδος / Ταμεία', type: 'COMMON', status: 'IN_PROGRESS', floorId: lidlMaroussiFloors[1].id, pinX: 150, pinY: 80 } }),
    prisma.room.create({ data: { name: 'Διάδρομος 1 - Τρόφιμα', type: 'COMMON', status: 'COMPLETED', floorId: lidlMaroussiFloors[1].id, pinX: 150, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Διάδρομος 2 - Γαλακτοκομικά', type: 'COMMON', status: 'COMPLETED', floorId: lidlMaroussiFloors[1].id, pinX: 300, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Διάδρομος 3 - Κατεψυγμένα', type: 'COMMON', status: 'IN_PROGRESS', floorId: lidlMaroussiFloors[1].id, pinX: 450, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Διάδρομος 4 - Non-Food', type: 'COMMON', status: 'IN_PROGRESS', floorId: lidlMaroussiFloors[1].id, pinX: 600, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Ψωμί & Αρτοποιείο', type: 'COMMON', status: 'COMPLETED', floorId: lidlMaroussiFloors[1].id, pinX: 300, pinY: 350 } }),
    prisma.room.create({ data: { name: 'Γραφείο Διευθυντή', type: 'OFFICE', status: 'COMPLETED', floorId: lidlMaroussiFloors[1].id, pinX: 550, pinY: 80 } }),
  ]);

  // Lidl Assets
  // POS Terminals at checkout
  for (let i = 1; i <= 6; i++) {
    await prisma.asset.create({
      data: {
        name: `POS Terminal ${i}`,
        serialNumber: generateSerial('POS-LM-'),
        macAddress: generateMAC(),
        status: i <= 4 ? 'VERIFIED' : 'INSTALLED',
        roomId: lidlMaroussiRooms[3].id,
        assetTypeId: posType.id,
        notes: `Ταμείο ${i}`,
      },
    });
  }

  // Digital Signage
  await prisma.asset.create({
    data: {
      name: 'Entrance Display',
      serialNumber: generateSerial('DS-LM-'),
      macAddress: generateMAC(),
      status: 'CONFIGURED',
      roomId: lidlMaroussiRooms[3].id,
      assetTypeId: signageType.id,
      notes: 'Οθόνη προσφορών εισόδου',
    },
  });

  // WiFi APs throughout store
  const storeAreas = [lidlMaroussiRooms[4], lidlMaroussiRooms[5], lidlMaroussiRooms[6], lidlMaroussiRooms[7]];
  for (let i = 0; i < storeAreas.length; i++) {
    await prisma.asset.create({
      data: {
        name: `Store AP ${i + 1}`,
        serialNumber: generateSerial('AP-LM-'),
        macAddress: generateMAC(),
        status: randomAssetStatus(),
        roomId: storeAreas[i].id,
        assetTypeId: apType.id,
      },
    });
  }

  // IP Cameras
  const cameraLocations = ['Είσοδος', 'Ταμεία', 'Αποθήκη', 'Ψυγεία', 'Non-Food'];
  for (const loc of cameraLocations) {
    await prisma.asset.create({
      data: {
        name: `Camera ${loc}`,
        serialNumber: generateSerial('CAM-LM-'),
        macAddress: generateMAC(),
        status: randomAssetStatus(),
        roomId: lidlMaroussiRooms[0].id, // Controlled from server room
        assetTypeId: cameraType.id,
        notes: `Κάμερα περιοχής: ${loc}`,
      },
    });
  }

  // ============================================
  // PROJECT 7: LIDL PYLAIA
  // ============================================
  console.log('🛒 Creating Lidl Pylaia...');

  const lidlPylaiaProject = await prisma.project.create({
    data: {
      name: 'Lidl Πυλαία Θεσσαλονίκης',
      clientName: 'Lidl Hellas',
      location: 'Mediterranean Cosmos, Πυλαία',
      status: 'COMPLETED',
      startDate: new Date('2023-11-01'),
      endDate: new Date('2024-01-10'),
      description: 'Ανακαίνιση υφιστάμενου καταστήματος με αναβάθμιση όλων των ICT συστημάτων. Self-checkout installation.',
      members: {
        create: [
          { userId: pmMaria.id, role: 'PM' },
          { userId: techEleni.id, role: 'TECHNICIAN' },
          { userId: techDimitris.id, role: 'TECHNICIAN' },
          { userId: clientLidl.id, role: 'CLIENT' },
        ],
      },
    },
  });

  // Lidl Pylaia Floors
  const lidlPylaiaFloors = await Promise.all([
    prisma.floor.create({ data: { name: 'Αποθήκη', level: -1, projectId: lidlPylaiaProject.id } }),
    prisma.floor.create({ data: { name: 'Κατάστημα', level: 0, projectId: lidlPylaiaProject.id } }),
  ]);

  // Lidl Pylaia Rooms - all completed since complete
  await Promise.all([
    prisma.room.create({ data: { name: 'Server Room', type: 'TECHNICAL', status: 'COMPLETED', floorId: lidlPylaiaFloors[0].id, pinX: 100, pinY: 100 } }),
    prisma.room.create({ data: { name: 'Αποθήκη', type: 'STORAGE', status: 'COMPLETED', floorId: lidlPylaiaFloors[0].id, pinX: 300, pinY: 100 } }),
    prisma.room.create({ data: { name: 'Ταμεία & Self-Checkout', type: 'COMMON', status: 'COMPLETED', floorId: lidlPylaiaFloors[1].id, pinX: 150, pinY: 100 } }),
    prisma.room.create({ data: { name: 'Χώρος Πώλησης', type: 'COMMON', status: 'COMPLETED', floorId: lidlPylaiaFloors[1].id, pinX: 350, pinY: 200 } }),
    prisma.room.create({ data: { name: 'Αρτοποιείο', type: 'COMMON', status: 'COMPLETED', floorId: lidlPylaiaFloors[1].id, pinX: 550, pinY: 200 } }),
  ]);

  // ============================================
  // INVENTORY ITEMS
  // ============================================
  console.log('📦 Creating inventory...');

  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        itemType: 'Cisco Access Point',
        description: 'Cisco Catalyst 9120AX WiFi 6 AP',
        quantityReceived: 50,
        quantityUsed: 35,
        unit: 'τεμάχια',
        projectId: santoriniProject.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        itemType: 'CAT6A Cable',
        description: 'Καλώδιο δικτύου CAT6A S/FTP 305m',
        quantityReceived: 15,
        quantityUsed: 10,
        unit: 'κουτιά',
        projectId: santoriniProject.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        itemType: 'RJ45 Connectors',
        description: 'CAT6A Shielded RJ45 βύσματα',
        quantityReceived: 600,
        quantityUsed: 420,
        unit: 'τεμάχια',
        projectId: santoriniProject.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        itemType: 'LG Smart TV 55"',
        description: 'LG 55UN73006 Hotel Mode TV',
        quantityReceived: 25,
        quantityUsed: 19,
        unit: 'τεμάχια',
        projectId: santoriniProject.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        itemType: 'PoE Injector',
        description: 'TP-Link TL-PoE160S 802.3at',
        quantityReceived: 30,
        quantityUsed: 22,
        unit: 'τεμάχια',
        projectId: mykonosProject.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        itemType: 'Patch Panel 24-port',
        description: 'CAT6A 24-port Shielded Patch Panel',
        quantityReceived: 8,
        quantityUsed: 5,
        unit: 'τεμάχια',
        projectId: mykonosProject.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        itemType: 'Ingenico POS',
        description: 'Ingenico Move 5000 4G',
        quantityReceived: 8,
        quantityUsed: 6,
        unit: 'τεμάχια',
        projectId: lidlMaroussiProject.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        itemType: 'Outdoor AP',
        description: 'Ubiquiti UniFi UAP-AC-M-PRO',
        quantityReceived: 5,
        quantityUsed: 3,
        unit: 'τεμάχια',
        projectId: mykonosProject.id,
      },
    }),
  ]);

  // Add inventory logs
  for (const item of inventoryItems) {
    await prisma.inventoryLog.create({
      data: {
        itemId: item.id,
        action: 'RECEIVED',
        quantity: item.quantityReceived,
        userId: admin?.id || pmGiannis.id,
        notes: 'Αρχική παραλαβή υλικών',
      },
    });

    if (item.quantityUsed > 0) {
      await prisma.inventoryLog.create({
        data: {
          itemId: item.id,
          action: 'CONSUMED',
          quantity: item.quantityUsed,
          userId: techNikos.id,
          notes: 'Χρήση σε εγκατάσταση',
        },
      });
    }
  }

  // ============================================
  // ISSUES
  // ============================================
  console.log('🚨 Creating issues...');

  await prisma.issue.create({
    data: {
      title: 'Αδύνατη σύνδεση AP στο δωμάτιο 205',
      description: 'Το Access Point στο δωμάτιο 205 δεν παίρνει IP από τον DHCP server. Έγινε έλεγχος καλωδίωσης και είναι OK. Πιθανό πρόβλημα με το switch port.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: santoriniProject.id,
      createdById: techNikos.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: 'Χαμηλό WiFi signal στο Pool Bar',
      description: 'Οι πελάτες παραπονούνται για αργό internet στην περιοχή της πισίνας. Χρειάζεται επιπλέον outdoor AP.',
      status: 'OPEN',
      priority: 'MEDIUM',
      projectId: santoriniProject.id,
      createdById: clientSantorini.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: 'TV δεν εμφανίζει welcome screen',
      description: 'Η τηλεόραση στη Suite 103 δεν φορτώνει το hotel welcome screen. Δείχνει μόνο κανάλια.',
      status: 'RESOLVED',
      priority: 'LOW',
      projectId: santoriniProject.id,
      createdById: techNikos.id,
      resolvedAt: new Date(),
    },
  });

  await prisma.issue.create({
    data: {
      title: 'POS Terminal 3 - Printer jam',
      description: 'Ο εκτυπωτής αποδείξεων στο ταμείο 3 έχει κολλήσει. Χρειάζεται επισκευή/αντικατάσταση.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      projectId: lidlMaroussiProject.id,
      createdById: clientLidl.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: 'Κάμερα αποθήκης offline',
      description: 'Η IP κάμερα στην αποθήκη δεν επικοινωνεί με το NVR εδώ και 2 ημέρες.',
      status: 'OPEN',
      priority: 'HIGH',
      projectId: lidlMaroussiProject.id,
      createdById: clientLidl.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: 'Slow network στο Beach Club',
      description: 'Bandwidth issues κατά τις ώρες αιχμής (18:00-22:00). Πιθανό bottleneck στο uplink.',
      status: 'OPEN',
      priority: 'MEDIUM',
      projectId: mykonosProject.id,
      createdById: techKostas.id,
    },
  });

  await prisma.issue.create({
    data: {
      title: 'VoIP τηλέφωνο χωρίς ήχο',
      description: 'Το τηλέφωνο στο Room 112 δεν έχει ήχο κλήσης. Ακούγεται μόνο ο συνομιλητής.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      projectId: mykonosProject.id,
      createdById: techEleni.id,
      resolvedAt: new Date(),
    },
  });

  // ============================================
  // GENERATE CHECKLISTS FOR SOME ASSETS
  // ============================================
  console.log('✅ Creating checklists...');

  const assets = await prisma.asset.findMany({
    take: 30,
    include: { assetType: true },
  });

  for (const asset of assets) {
    if (!asset.assetType?.checklistTemplate) continue;

    const checklistItems = asset.assetType.checklistTemplate as Array<{ type: string; items: string[] }>;

    for (const checklistDef of checklistItems) {
      const checklist = await prisma.checklist.create({
        data: {
          type: checklistDef.type as 'CABLING' | 'EQUIPMENT' | 'CONFIG' | 'DOCUMENTATION',
          assetId: asset.id,
        },
      });

      for (let i = 0; i < checklistDef.items.length; i++) {
        const isCompleted = Math.random() > 0.3;
        await prisma.checklistItem.create({
          data: {
            checklistId: checklist.id,
            name: checklistDef.items[i],
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null,
            completedById: isCompleted ? techNikos.id : null,
            order: i,
          },
        });
      }
    }
  }

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   - 7 Projects (5 Hotels + 2 Lidl stores)');
  console.log('   - Multiple users (PMs, Technicians, Clients)');
  console.log('   - Floors with rooms and pin positions');
  console.log('   - Assets with serial numbers and MAC addresses');
  console.log('   - Checklists with progress');
  console.log('   - Issues with various statuses');
  console.log('   - Inventory items with logs');
  console.log('');
  console.log('🔐 Test accounts (password: password123):');
  console.log('   - giannis.papadopoulos@synax.gr (PM)');
  console.log('   - maria.konstantinou@synax.gr (PM)');
  console.log('   - nikos.alexiou@synax.gr (Technician)');
  console.log('   - dimitris.georgiou@synax.gr (Technician)');
  console.log('   - admin@synax.app (Admin) - if exists');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
