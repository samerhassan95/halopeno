-- AlterTable
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
