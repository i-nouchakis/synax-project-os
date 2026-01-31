-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SUMMARY', 'CLIENT', 'INTERNAL', 'ASSETS');

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "generated_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
