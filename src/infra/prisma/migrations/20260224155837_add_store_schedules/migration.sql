-- CreateTable
CREATE TABLE "store_schedules" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_schedules_storeId_idx" ON "store_schedules"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "store_schedules_storeId_date_key" ON "store_schedules"("storeId", "date");

-- AddForeignKey
ALTER TABLE "store_schedules" ADD CONSTRAINT "store_schedules_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
