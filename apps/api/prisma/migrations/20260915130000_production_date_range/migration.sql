-- AlterTable: a production entry can now span more than one day
ALTER TABLE "productions" RENAME COLUMN "date" TO "started_on";
ALTER TABLE "productions" ADD COLUMN "ended_on" DATE;

-- Backfill: every existing entry was implicitly a single day, so start equals end exactly
UPDATE "productions" SET "ended_on" = "started_on";
