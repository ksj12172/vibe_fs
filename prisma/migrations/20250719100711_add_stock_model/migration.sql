-- CreateTable
CREATE TABLE "stocks" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_kor" VARCHAR(255),
    "name_eng" VARCHAR(255),
    "market" VARCHAR(10) NOT NULL,
    "exchange" VARCHAR(20),
    "sector" VARCHAR(100),
    "industry" VARCHAR(100),
    "description" TEXT,
    "logo" VARCHAR(500),
    "website" VARCHAR(255),
    "market_cap" BIGINT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KRW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stocks_symbol_key" ON "stocks"("symbol");

-- CreateIndex
CREATE INDEX "idx_stock_name" ON "stocks"("name");

-- CreateIndex
CREATE INDEX "idx_stock_name_kor" ON "stocks"("name_kor");

-- CreateIndex
CREATE INDEX "idx_stock_symbol" ON "stocks"("symbol");

-- CreateIndex
CREATE INDEX "idx_stock_market" ON "stocks"("market");

-- CreateIndex
CREATE INDEX "idx_stock_exchange" ON "stocks"("exchange");
