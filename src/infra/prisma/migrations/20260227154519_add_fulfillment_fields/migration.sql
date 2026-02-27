-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryCep" TEXT,
ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryNeighborhood" TEXT,
ADD COLUMN     "deliveryNumber" TEXT,
ADD COLUMN     "deliveryStreet" TEXT,
ADD COLUMN     "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'PICKUP',
ADD COLUMN     "pickupSlotId" TEXT,
ADD COLUMN     "pickupTime" TEXT;
