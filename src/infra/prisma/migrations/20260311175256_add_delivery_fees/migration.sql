-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "store_cep_ranges" ADD COLUMN     "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "defaultDeliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;
