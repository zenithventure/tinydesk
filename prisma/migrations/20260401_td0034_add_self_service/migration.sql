-- AlterTable
ALTER TABLE "Product" ADD COLUMN "selfService" BOOLEAN NOT NULL DEFAULT false;

-- Mark TinyDesk as self-service so all users can submit tickets for it
UPDATE "Product" SET "selfService" = true WHERE "slug" = 'tinydesk';
