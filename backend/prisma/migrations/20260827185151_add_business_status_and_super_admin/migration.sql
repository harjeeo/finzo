-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE';
