/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `employee_invites` table. All the data in the column will be lost.
  - You are about to drop the column `employee_id` on the `employee_invites` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `employee_invites` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `employee_invites` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expires_at` to the `employee_invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invited_by_id` to the `employee_invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `employee_invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `employee_invites` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "employee_invites" DROP CONSTRAINT "employee_invites_employee_id_fkey";

-- DropIndex
DROP INDEX "employee_invites_employee_id_idx";

-- AlterTable
ALTER TABLE "employee_invites" DROP COLUMN "deleted_at",
DROP COLUMN "employee_id",
DROP COLUMN "level",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "invited_by_id" UUID NOT NULL,
ADD COLUMN     "role" "EmployeeRole" NOT NULL,
ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employee_role" "EmployeeRole" NOT NULL DEFAULT 'STAFF',
ADD COLUMN     "invited_by_id" UUID,
ADD COLUMN     "is_employee" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'INVITED',
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employee_invites_token_key" ON "employee_invites"("token");

-- CreateIndex
CREATE INDEX "employee_invites_invited_by_id_idx" ON "employee_invites"("invited_by_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_invites" ADD CONSTRAINT "employee_invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
