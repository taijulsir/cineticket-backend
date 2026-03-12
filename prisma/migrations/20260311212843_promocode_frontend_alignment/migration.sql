-- AlterTable
ALTER TABLE "promocodes" ADD COLUMN     "description" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "starts_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "promocodes_expires_at_idx" ON "promocodes"("expires_at");
