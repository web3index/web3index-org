/*
  Warnings:

  - Added the required column `lastImportedId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Day" ALTER COLUMN "revenue" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "lastImportedId" TEXT NOT NULL;
