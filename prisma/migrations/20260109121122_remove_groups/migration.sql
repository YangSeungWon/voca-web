-- DropForeignKey
ALTER TABLE "Vocabulary" DROP CONSTRAINT IF EXISTS "Vocabulary_groupId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Vocabulary_groupId_idx";

-- AlterTable
ALTER TABLE "Vocabulary" DROP COLUMN IF EXISTS "groupId";

-- DropTable
DROP TABLE IF EXISTS "Group";
