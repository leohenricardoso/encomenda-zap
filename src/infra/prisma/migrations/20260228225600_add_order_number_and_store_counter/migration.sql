-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "orderNumber" INTEGER;

-- CreateTable
CREATE TABLE "store_order_counters" (
    "storeId" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "store_order_counters_pkey" PRIMARY KEY ("storeId")
);

-- AddForeignKey
ALTER TABLE "store_order_counters" ADD CONSTRAINT "store_order_counters_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
