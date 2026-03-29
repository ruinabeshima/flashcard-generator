/*
  Warnings:

  - Added the required column `key` to the `TailoredResume` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TailoredResume" ADD COLUMN     "key" TEXT NOT NULL;
