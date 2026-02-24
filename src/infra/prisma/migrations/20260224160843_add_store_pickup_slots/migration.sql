-- CreateTable
CREATE TABLE "store_pickup_slots" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pickup_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_pickup_slots_storeId_dayOfWeek_idx" ON "store_pickup_slots"("storeId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "store_pickup_slots" ADD CONSTRAINT "store_pickup_slots_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
