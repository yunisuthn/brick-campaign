-- CreateTable
CREATE TABLE "productions" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "moulder_id" UUID NOT NULL,
    "rice_field_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productions_campaign_id_moulder_id_idx" ON "productions"("campaign_id", "moulder_id");

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_moulder_id_fkey" FOREIGN KEY ("moulder_id") REFERENCES "moulders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_rice_field_id_fkey" FOREIGN KEY ("rice_field_id") REFERENCES "rice_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
