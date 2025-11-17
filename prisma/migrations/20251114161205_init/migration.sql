-- DropForeignKey
ALTER TABLE "Day" DROP CONSTRAINT "Day_projectId_fkey";

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Project.name_unique" RENAME TO "Project_name_key";
