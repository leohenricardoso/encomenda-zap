-- CreateTable
CREATE TABLE "store_message_configs" (
    "storeId" TEXT NOT NULL,
    "approvalMessage" VARCHAR(500),
    "rejectionMessage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_message_configs_pkey" PRIMARY KEY ("storeId")
);

-- AddForeignKey
ALTER TABLE "store_message_configs" ADD CONSTRAINT "store_message_configs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
