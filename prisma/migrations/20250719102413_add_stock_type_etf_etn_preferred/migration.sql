-- AlterTable
ALTER TABLE "stocks" ADD COLUMN     "type" VARCHAR(10) NOT NULL DEFAULT 'STOCK';

-- CreateIndex
CREATE INDEX "idx_stock_type" ON "stocks"("type");
