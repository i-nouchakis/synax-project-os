import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample floor plan images from Unsplash and other free sources
const FLOOR_PLAN_IMAGES = [
  // Hotel room layouts - using Unsplash architecture/blueprint images
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80', // architecture blueprint
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80', // apartment interior
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', // house interior
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', // modern interior
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80', // living room
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&q=80', // kitchen
];

// Random position generator for assets on floor plan
function randomPosition(imageWidth = 1200, imageHeight = 800): { x: number; y: number } {
  // Keep pins away from edges (20% margin)
  const marginX = imageWidth * 0.15;
  const marginY = imageHeight * 0.15;

  return {
    x: Math.round(marginX + Math.random() * (imageWidth - 2 * marginX)),
    y: Math.round(marginY + Math.random() * (imageHeight - 2 * marginY)),
  };
}

// Spread positions in a grid-like pattern for better visibility
function getGridPosition(index: number, total: number, width = 1200, height = 800): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);

  const col = index % cols;
  const row = Math.floor(index / cols);

  const cellWidth = (width * 0.7) / cols;
  const cellHeight = (height * 0.7) / rows;

  const startX = width * 0.15;
  const startY = height * 0.15;

  // Add some randomness within each cell
  const jitterX = (Math.random() - 0.5) * cellWidth * 0.4;
  const jitterY = (Math.random() - 0.5) * cellHeight * 0.4;

  return {
    x: Math.round(startX + col * cellWidth + cellWidth / 2 + jitterX),
    y: Math.round(startY + row * cellHeight + cellHeight / 2 + jitterY),
  };
}

async function addFloorPlansAndAssetPositions() {
  console.log('🏨 Adding floor plans and asset positions...\n');

  // Get all rooms with their assets
  const rooms = await prisma.room.findMany({
    include: {
      assets: true,
      floor: {
        include: {
          project: true,
        },
      },
    },
  });

  let roomsUpdated = 0;
  let assetsUpdated = 0;

  for (const room of rooms) {
    // Skip rooms that already have floor plans
    if (room.floorplanUrl) {
      console.log(`  ⏭️  ${room.name} - already has floor plan`);
      continue;
    }

    // Assign a random floor plan image
    const floorplanUrl = FLOOR_PLAN_IMAGES[Math.floor(Math.random() * FLOOR_PLAN_IMAGES.length)];

    // Update room with floor plan
    await prisma.room.update({
      where: { id: room.id },
      data: {
        floorplanUrl,
        floorplanType: 'IMAGE',
      },
    });

    roomsUpdated++;
    console.log(`  🗺️  ${room.floor?.project?.name} > ${room.floor?.name} > ${room.name} - floor plan added`);

    // Update assets with positions
    const assetsToUpdate = room.assets.filter(a => a.pinX === null || a.pinY === null);

    for (let i = 0; i < assetsToUpdate.length; i++) {
      const asset = assetsToUpdate[i];
      const position = getGridPosition(i, assetsToUpdate.length);

      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          pinX: position.x,
          pinY: position.y,
        },
      });

      assetsUpdated++;
    }

    if (assetsToUpdate.length > 0) {
      console.log(`    📍 Positioned ${assetsToUpdate.length} assets on floor plan`);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   - Rooms with floor plans: ${roomsUpdated}`);
  console.log(`   - Assets positioned: ${assetsUpdated}`);
}

async function main() {
  try {
    await addFloorPlansAndAssetPositions();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
