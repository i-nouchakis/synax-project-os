-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "pin_x" DOUBLE PRECISION,
ADD COLUMN     "pin_y" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "floorplan_type" TEXT,
ADD COLUMN     "floorplan_url" TEXT;
