-- CreateTable
CREATE TABLE "lookup_room_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookup_room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_inventory_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookup_inventory_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_issue_causes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookup_issue_causes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_manufacturers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookup_manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_asset_models" (
    "id" TEXT NOT NULL,
    "manufacturer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asset_type_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lookup_asset_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lookup_room_types_name_key" ON "lookup_room_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_inventory_units_name_key" ON "lookup_inventory_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_inventory_units_abbreviation_key" ON "lookup_inventory_units"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_issue_causes_name_key" ON "lookup_issue_causes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_manufacturers_name_key" ON "lookup_manufacturers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_asset_models_manufacturer_id_name_key" ON "lookup_asset_models"("manufacturer_id", "name");

-- AddForeignKey
ALTER TABLE "lookup_asset_models" ADD CONSTRAINT "lookup_asset_models_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "lookup_manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup_asset_models" ADD CONSTRAINT "lookup_asset_models_asset_type_id_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "asset_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
