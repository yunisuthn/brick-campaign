-- CreateEnum
CREATE TYPE "ContractorWorkType" AS ENUM ('transport', 'kiln_loading');

-- CreateTable
CREATE TABLE "contractor_works" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "kiln_batch_id" UUID NOT NULL,
    "type" "ContractorWorkType" NOT NULL,
    "contractor_name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractor_works_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contractor_works_campaign_id_contractor_name_idx" ON "contractor_works"("campaign_id", "contractor_name");

-- CreateIndex
CREATE INDEX "contractor_works_kiln_batch_id_idx" ON "contractor_works"("kiln_batch_id");

-- AddForeignKey
ALTER TABLE "contractor_works" ADD CONSTRAINT "contractor_works_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_works" ADD CONSTRAINT "contractor_works_kiln_batch_id_fkey" FOREIGN KEY ("kiln_batch_id") REFERENCES "kiln_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
