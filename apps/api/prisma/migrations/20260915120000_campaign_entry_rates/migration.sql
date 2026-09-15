-- AlterTable: campaigns now offer a list of moulding/transport prices instead of a single one
ALTER TABLE "campaigns" ADD COLUMN "moulding_rates" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "transport_rates" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- AlterTable: the price picked at entry time is frozen on the row itself
ALTER TABLE "productions" ADD COLUMN "rate" INTEGER;
ALTER TABLE "contractor_works" ADD COLUMN "rate" INTEGER;

-- Backfill: carry the old single campaign rate into the new price list and onto existing rows
UPDATE "campaigns" SET "moulding_rates" = ARRAY["moulding_rate"] WHERE "moulding_rate" IS NOT NULL;
UPDATE "campaigns" SET "transport_rates" = ARRAY["transport_rate"] WHERE "transport_rate" IS NOT NULL;

UPDATE "productions" p SET "rate" = c."moulding_rate"
FROM "campaigns" c WHERE c."id" = p."campaign_id";

UPDATE "contractor_works" w SET "rate" = c."transport_rate"
FROM "campaigns" c WHERE c."id" = w."campaign_id" AND w."type" = 'transport';

-- AlterTable: drop the old single-rate columns, now replaced by the price lists above
ALTER TABLE "campaigns" DROP COLUMN "moulding_rate",
DROP COLUMN "transport_rate";
