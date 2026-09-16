-- CreateTable
CREATE TABLE "moulders" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "member_count" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moulders_pkey" PRIMARY KEY ("id")
);
