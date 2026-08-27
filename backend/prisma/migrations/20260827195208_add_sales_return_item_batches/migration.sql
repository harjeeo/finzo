-- CreateTable
CREATE TABLE "sales_return_item_batches" (
    "id" TEXT NOT NULL,
    "salesReturnItemId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "sales_return_item_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_return_item_batches_salesReturnItemId_idx" ON "sales_return_item_batches"("salesReturnItemId");

-- AddForeignKey
ALTER TABLE "sales_return_item_batches" ADD CONSTRAINT "sales_return_item_batches_salesReturnItemId_fkey" FOREIGN KEY ("salesReturnItemId") REFERENCES "sales_return_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_item_batches" ADD CONSTRAINT "sales_return_item_batches_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
