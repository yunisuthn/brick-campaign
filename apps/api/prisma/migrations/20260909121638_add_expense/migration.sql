-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('rice_field', 'akofa', 'tai_charbon', 'fuel', 'repair', 'food', 'other');

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "kiln_batch_id" UUID,
    "rice_field_id" UUID,
    "date" DATE NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_campaign_id_category_idx" ON "expenses"("campaign_id", "category");

-- CreateIndex
CREATE INDEX "expenses_kiln_batch_id_idx" ON "expenses"("kiln_batch_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_kiln_batch_id_fkey" FOREIGN KEY ("kiln_batch_id") REFERENCES "kiln_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rice_field_id_fkey" FOREIGN KEY ("rice_field_id") REFERENCES "rice_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;
