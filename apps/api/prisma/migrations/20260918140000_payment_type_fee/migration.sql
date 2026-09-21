-- AlterEnum: a fee withheld from a moulder for material/tools, capped at one per campaign
-- rather than one per day like vatsy and an advance.
ALTER TYPE "PaymentType" ADD VALUE 'fee';
