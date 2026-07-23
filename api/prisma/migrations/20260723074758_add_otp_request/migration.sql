-- CreateTable
CREATE TABLE "OtpRequest" (
    "id" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'SMS',
    "destination" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "country" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id")
);
