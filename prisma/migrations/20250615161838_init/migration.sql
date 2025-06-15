-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "corp_code" VARCHAR(8) NOT NULL,
    "corp_name" VARCHAR(255) NOT NULL,
    "corp_eng_name" VARCHAR(255),
    "stock_code" VARCHAR(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_corp_code_key" ON "companies"("corp_code");

-- CreateIndex
CREATE INDEX "idx_corp_name" ON "companies"("corp_name");

-- CreateIndex
CREATE INDEX "idx_corp_code" ON "companies"("corp_code");

-- CreateIndex
CREATE INDEX "idx_stock_code" ON "companies"("stock_code");
