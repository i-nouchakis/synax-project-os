-- AlterTable
ALTER TABLE "floors" ADD COLUMN     "pin_x" DOUBLE PRECISION,
ADD COLUMN     "pin_y" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "masterplan_type" TEXT,
ADD COLUMN     "masterplan_url" TEXT;
