-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_ownerId_fkey";

-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
