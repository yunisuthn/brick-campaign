-- CreateEnum
CREATE TYPE "RiceFieldContract" AS ENUM ('durable', 'seasonal');

-- CreateTable
CREATE TABLE "rice_fields" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "surface_m2" INTEGER,
    "contract_type" "RiceFieldContract" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rice_fields_pkey" PRIMARY KEY ("id")
);
