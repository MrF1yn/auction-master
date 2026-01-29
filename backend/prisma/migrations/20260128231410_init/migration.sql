-- CreateEnum
CREATE TYPE "AuctionItemStatus" AS ENUM ('ACTIVE', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starting_price" DECIMAL(12,2) NOT NULL,
    "current_bid" DECIMAL(12,2) NOT NULL,
    "minimum_bid_increment" DECIMAL(12,2) NOT NULL,
    "auction_start_time" TIMESTAMP(3) NOT NULL,
    "auction_end_time" TIMESTAMP(3) NOT NULL,
    "image_url" TEXT,
    "status" "AuctionItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_user_id" TEXT NOT NULL,
    "winner_user_id" TEXT,

    CONSTRAINT "auction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "bid_amount" DECIMAL(12,2) NOT NULL,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "was_successful" BOOLEAN NOT NULL DEFAULT true,
    "processing_time_ms" INTEGER,
    "auction_item_id" TEXT NOT NULL,
    "bidder_user_id" TEXT NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklisted_tokens" (
    "id" TEXT NOT NULL,
    "token_string" TEXT NOT NULL,
    "blacklisted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklisted_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_address_key" ON "users"("email_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "auction_items_status_idx" ON "auction_items"("status");

-- CreateIndex
CREATE INDEX "auction_items_auction_end_time_idx" ON "auction_items"("auction_end_time");

-- CreateIndex
CREATE INDEX "auction_items_creator_user_id_idx" ON "auction_items"("creator_user_id");

-- CreateIndex
CREATE INDEX "auction_items_winner_user_id_idx" ON "auction_items"("winner_user_id");

-- CreateIndex
CREATE INDEX "bids_auction_item_id_idx" ON "bids"("auction_item_id");

-- CreateIndex
CREATE INDEX "bids_bidder_user_id_idx" ON "bids"("bidder_user_id");

-- CreateIndex
CREATE INDEX "bids_placed_at_idx" ON "bids"("placed_at");

-- CreateIndex
CREATE UNIQUE INDEX "blacklisted_tokens_token_string_key" ON "blacklisted_tokens"("token_string");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_token_string_idx" ON "blacklisted_tokens"("token_string");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_expires_at_idx" ON "blacklisted_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "auction_items" ADD CONSTRAINT "auction_items_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_items" ADD CONSTRAINT "auction_items_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_item_id_fkey" FOREIGN KEY ("auction_item_id") REFERENCES "auction_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_user_id_fkey" FOREIGN KEY ("bidder_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
