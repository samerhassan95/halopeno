-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'seasonal',
    "channels" TEXT[],
    "segment" TEXT,
    "goal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "budget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "spend" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
