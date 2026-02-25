-- CreateTable
CREATE TABLE "store_cep_ranges" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "cepStart" TEXT NOT NULL,
    "cepEnd" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_cep_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_cep_ranges_storeId_key" ON "store_cep_ranges"("storeId");

-- AddForeignKey
ALTER TABLE "store_cep_ranges" ADD CONSTRAINT "store_cep_ranges_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
