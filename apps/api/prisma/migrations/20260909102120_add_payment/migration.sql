-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('vatsy', 'advance', 'settlement');

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "moulder_id" UUID,
    "contractor_name" TEXT,
    "type" "PaymentType" NOT NULL,
    "date" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_campaign_id_moulder_id_idx" ON "payments"("campaign_id", "moulder_id");

-- CreateIndex
CREATE INDEX "payments_campaign_id_contractor_name_idx" ON "payments"("campaign_id", "contractor_name");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_moulder_id_fkey" FOREIGN KEY ("moulder_id") REFERENCES "moulders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one beneficiary per payment: a moulder or a free-text contractor name, never both, never neither.
ALTER TABLE "payments" ADD CONSTRAINT "payments_one_beneficiary_check"
    CHECK (("moulder_id" IS NULL) <> ("contractor_name" IS NULL));
