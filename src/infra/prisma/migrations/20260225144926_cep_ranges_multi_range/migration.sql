-- DropIndex
DROP INDEX "store_cep_ranges_storeId_key";

-- CreateIndex
CREATE INDEX "store_cep_ranges_storeId_idx" ON "store_cep_ranges"("storeId");
