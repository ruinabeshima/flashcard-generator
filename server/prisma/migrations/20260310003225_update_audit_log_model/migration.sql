/*
  Warnings:

  - Changed the type of `event` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "entityType" TEXT,
DROP COLUMN "event",
ADD COLUMN     "event" "AuditEvent" NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_event_idx" ON "AuditLog"("event");
