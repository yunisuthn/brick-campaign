-- AlterTable: a year can now hold more than one campaign (tranche 1, 2, 3…); existing campaigns
-- become tranche 1 of their year, and the uniqueness moves from the year alone to the pair.
ALTER TABLE "campaigns" ADD COLUMN "tranche" INTEGER NOT NULL DEFAULT 1;

DROP INDEX "campaigns_year_key";

CREATE UNIQUE INDEX "campaigns_year_tranche_key" ON "campaigns"("year", "tranche");
