-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "moulding_rate" DROP NOT NULL,
ALTER COLUMN "transport_rate" DROP NOT NULL,
ALTER COLUMN "kiln_loading_rate" DROP NOT NULL;
