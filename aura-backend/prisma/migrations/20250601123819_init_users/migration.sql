-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT,
ALTER COLUMN "name" DROP NOT NULL;
