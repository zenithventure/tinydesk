-- Migration: TD-0008 — Add ProductOwner join table and change User default role to VIEWER

-- 1. Create the ProductOwner join table
CREATE TABLE "ProductOwner" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOwner_pkey" PRIMARY KEY ("id")
);

-- 2. Add unique constraint and indexes
CREATE UNIQUE INDEX "ProductOwner_userId_productId_key" ON "ProductOwner"("userId", "productId");
CREATE INDEX "ProductOwner_userId_idx" ON "ProductOwner"("userId");
CREATE INDEX "ProductOwner_productId_idx" ON "ProductOwner"("productId");

-- 3. Add foreign key constraints
ALTER TABLE "ProductOwner" ADD CONSTRAINT "ProductOwner_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductOwner" ADD CONSTRAINT "ProductOwner_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Change the default role for new User rows from ADMIN to VIEWER
--    (Existing ADMIN rows are NOT changed — only affects future inserts)
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
