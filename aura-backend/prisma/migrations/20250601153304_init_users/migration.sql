/*
  Warnings:

  - You are about to drop the column `type` on the `Measurement` table. All the data in the column will be lost.
  - Added the required column `roomState` to the `Measurement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Measurement" DROP COLUMN "type",
ADD COLUMN     "roomState" TEXT NOT NULL;
