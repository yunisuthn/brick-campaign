-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "ordered_quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "paid_on" DATE,
    "amount_received" INTEGER,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_campaign_id_client_id_idx" ON "sales"("campaign_id", "client_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The client pays once, when everything is delivered: the payment date and the amount received are set together.
ALTER TABLE "sales" ADD CONSTRAINT "sales_payment_complete_check"
    CHECK (("paid_on" IS NULL) = ("amount_received" IS NULL));
