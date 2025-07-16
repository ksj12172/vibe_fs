-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "description" TEXT,
ADD COLUMN     "founded" VARCHAR(20),
ADD COLUMN     "headquarters" VARCHAR(255),
ADD COLUMN     "industry" VARCHAR(100),
ADD COLUMN     "logo" VARCHAR(500),
ADD COLUMN     "sector" VARCHAR(100),
ADD COLUMN     "website" VARCHAR(255);
