-- CreateTable
CREATE TABLE "kiln_batches" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "loaded_on" DATE NOT NULL,
    "unloaded_on" DATE,
    "quantity" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kiln_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kiln_batches_campaign_id_idx" ON "kiln_batches"("campaign_id");

-- AddForeignKey
ALTER TABLE "kiln_batches" ADD CONSTRAINT "kiln_batches_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
