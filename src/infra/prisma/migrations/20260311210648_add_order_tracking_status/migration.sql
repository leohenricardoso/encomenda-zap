-- CreateEnum
CREATE TYPE "OrderTrackingStatus" AS ENUM ('PENDING', 'PAID', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "orderStatus" "OrderTrackingStatus";
