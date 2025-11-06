-- AlterEnum
ALTER TYPE "OrderState" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "state" SET DEFAULT 'PENDING';
