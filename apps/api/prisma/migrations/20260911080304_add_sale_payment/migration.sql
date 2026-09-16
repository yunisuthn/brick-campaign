-- A sale is paid in instalments (reference document, section 10.5). The two columns it carried
-- become rows, so nothing entered before this migration is lost: each paid sale keeps its date
-- and its amount as its first instalment.

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_payments_sale_id_idx" ON "sale_payments"("sale_id");

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The payment each sale already held becomes its first instalment. The id is a v4 here rather
-- than the v7 the application generates: it names a row, nothing reads an order out of it.
INSERT INTO "sale_payments" ("id", "sale_id", "date", "amount", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", "paid_on", "amount_received", now(), now()
FROM "sales"
WHERE "paid_on" IS NOT NULL AND "amount_received" IS NOT NULL;

-- AlterTable: the sale stops holding a payment of its own. The CHECK that kept both columns
-- together goes with them.
ALTER TABLE "sales" DROP COLUMN "amount_received",
DROP COLUMN "paid_on";
