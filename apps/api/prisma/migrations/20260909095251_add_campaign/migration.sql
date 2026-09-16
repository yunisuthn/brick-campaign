-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "started_on" DATE NOT NULL,
    "closed_on" DATE,
    "moulding_rate" INTEGER NOT NULL,
    "transport_rate" INTEGER NOT NULL,
    "kiln_loading_rate" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_year_key" ON "campaigns"("year");
