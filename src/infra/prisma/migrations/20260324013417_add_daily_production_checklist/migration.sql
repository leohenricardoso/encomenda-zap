-- CreateTable
CREATE TABLE "daily_production_checklist_items" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "producedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_production_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_production_checklist_items_storeId_date_idx" ON "daily_production_checklist_items"("storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_production_checklist_items_storeId_date_itemKey_key" ON "daily_production_checklist_items"("storeId", "date", "itemKey");

-- AddForeignKey
ALTER TABLE "daily_production_checklist_items" ADD CONSTRAINT "daily_production_checklist_items_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
