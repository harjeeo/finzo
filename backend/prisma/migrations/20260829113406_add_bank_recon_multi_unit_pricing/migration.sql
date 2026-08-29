-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FLAT');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "isBankAccount" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "priceListId" TEXT;

-- AlterTable
ALTER TABLE "journal_entry_lines" ADD COLUMN     "isReconciled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reconciledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "purchase_bill_items" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unitConversionFactor" DECIMAL(14,4) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "sales_invoice_items" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unitConversionFactor" DECIMAL(14,4) NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_items" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_schemes" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "productId" TEXT,
    "minQuantity" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_units" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conversionFactor" DECIMAL(14,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_lists_businessId_idx" ON "price_lists"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_businessId_name_key" ON "price_lists"("businessId", "name");

-- CreateIndex
CREATE INDEX "price_list_items_priceListId_idx" ON "price_list_items"("priceListId");

-- CreateIndex
CREATE INDEX "price_list_items_productId_idx" ON "price_list_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_items_priceListId_productId_key" ON "price_list_items"("priceListId", "productId");

-- CreateIndex
CREATE INDEX "discount_schemes_businessId_idx" ON "discount_schemes"("businessId");

-- CreateIndex
CREATE INDEX "discount_schemes_productId_idx" ON "discount_schemes"("productId");

-- CreateIndex
CREATE INDEX "product_units_productId_idx" ON "product_units"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_units_productId_name_key" ON "product_units"("productId", "name");

-- CreateIndex
CREATE INDEX "customers_priceListId_idx" ON "customers"("priceListId");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_schemes" ADD CONSTRAINT "discount_schemes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_schemes" ADD CONSTRAINT "discount_schemes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_units" ADD CONSTRAINT "product_units_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing line items with their product's base unit (they were always base-unit quantities)
UPDATE "sales_invoice_items" si
SET "unit" = p."unit"
FROM "products" p
WHERE si."productId" = p.id;

UPDATE "purchase_bill_items" pi
SET "unit" = p."unit"
FROM "products" p
WHERE pi."productId" = p.id;

-- Mark the system Cash and Bank accounts as bank-reconcilable by default
UPDATE "accounts" SET "isBankAccount" = true WHERE "code" IN ('CASH', 'BANK');
