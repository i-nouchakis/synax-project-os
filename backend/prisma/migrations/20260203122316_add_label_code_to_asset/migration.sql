-- AlterTable
ALTER TABLE "assets" ADD COLUMN "label_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "assets_label_code_key" ON "assets"("label_code");
