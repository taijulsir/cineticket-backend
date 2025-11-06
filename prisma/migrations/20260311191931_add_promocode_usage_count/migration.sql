-- AlterTable
ALTER TABLE "promocodes" ADD COLUMN     "usage_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "promocodes_usage_count_idx" ON "promocodes"("usage_count");
