// ==============================|| AUCTION DATA FETCHER SERVICE ||============================== //
// Handles fetching auction items and related data

import { AuctionItemStatus } from '@prisma/client';
import { prismaClient } from '../config/prisma-client.config';
import { logErrorMessage } from '../utils/logger.util';

// ==============================|| AUCTION ITEM INTERFACES ||============================== //

export interface AuctionItemData {
  id: string;
  itemTitle: string;
  itemDescription: string;
  startingPriceInDollars: number;
  currentHighestBidInDollars: number;
  minimumBidIncrementInDollars: number;
  auctionStartTimeTimestamp: Date;
  auctionEndTimeTimestamp: Date;
  itemImageUrl: string | null;
  currentStatus: AuctionItemStatus;
  createdAtTimestamp: Date;
  creatorUser: {
    userId: string;
    username: string;
    fullName: string;
  };
  winnerUser: {
    userId: string;
    username: string;
    fullName: string;
  } | null;
  totalBidCount: number;
  highestBidder: {
    userId: string;
    username: string;
  } | null;
}

export interface BidHistoryItem {
  bidId: string;
  bidAmountInDollars: number;
  placedAtTimestamp: Date;
  bidderUser: {
    userId: string;
    username: string;
  };
}

export interface CreateAuctionItemInput {
  itemTitle: string;
  itemDescription: string;
  startingPriceInDollars: number;
  minimumBidIncrementInDollars: number;
  auctionDurationInMinutes: number;
  itemImageUrl?: string | null;
  creatorUserId: string;
}

export interface CreateAuctionItemResult {
  wasCreationSuccessful: boolean;
  auctionItem: AuctionItemData | null;
  errorMessage: string | null;
}

// Sample images for auctions without provided images
const SAMPLE_AUCTION_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055uj?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=400&fit=crop'
];

function getRandomSampleImage(): string {
  return SAMPLE_AUCTION_IMAGES[Math.floor(Math.random() * SAMPLE_AUCTION_IMAGES.length)];
}

// ==============================|| CREATE AUCTION ITEM ||============================== //

export async function createAuctionItem(input: CreateAuctionItemInput): Promise<CreateAuctionItemResult> {
  try {
    // Validate input
    if (!input.itemTitle || input.itemTitle.trim().length < 3) {
      return {
        wasCreationSuccessful: false,
        auctionItem: null,
        errorMessage: 'Title must be at least 3 characters long'
      };
    }

    if (!input.itemDescription || input.itemDescription.trim().length < 10) {
      return {
        wasCreationSuccessful: false,
        auctionItem: null,
        errorMessage: 'Description must be at least 10 characters long'
      };
    }

    if (input.startingPriceInDollars < 0.01) {
      return {
        wasCreationSuccessful: false,
        auctionItem: null,
        errorMessage: 'Starting price must be at least $0.01'
      };
    }

    if (input.minimumBidIncrementInDollars < 0.01) {
      return {
        wasCreationSuccessful: false,
        auctionItem: null,
        errorMessage: 'Minimum bid increment must be at least $0.01'
      };
    }

    if (input.auctionDurationInMinutes < 1) {
      return {
        wasCreationSuccessful: false,
        auctionItem: null,
        errorMessage: 'Auction duration must be at least 1 minute'
      };
    }

    const now = new Date();
    const auctionEndTime = new Date(now.getTime() + input.auctionDurationInMinutes * 60 * 1000);

    // Use provided image or get a random sample image
    const imageUrl = input.itemImageUrl && input.itemImageUrl.trim() !== '' ? input.itemImageUrl.trim() : getRandomSampleImage();

    const createdAuction = await prismaClient.auctionItem.create({
      data: {
        itemTitle: input.itemTitle.trim(),
        itemDescription: input.itemDescription.trim(),
        startingPriceInDollars: input.startingPriceInDollars,
        currentHighestBidInDollars: input.startingPriceInDollars,
        minimumBidIncrementInDollars: input.minimumBidIncrementInDollars,
        auctionStartTimeTimestamp: now,
        auctionEndTimeTimestamp: auctionEndTime,
        itemImageUrl: imageUrl,
        currentStatus: 'ACTIVE',
        creatorUserId: input.creatorUserId
      },
      include: {
        creatorUser: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    return {
      wasCreationSuccessful: true,
      auctionItem: {
        id: createdAuction.id,
        itemTitle: createdAuction.itemTitle,
        itemDescription: createdAuction.itemDescription,
        startingPriceInDollars: createdAuction.startingPriceInDollars.toNumber(),
        currentHighestBidInDollars: createdAuction.currentHighestBidInDollars.toNumber(),
        minimumBidIncrementInDollars: createdAuction.minimumBidIncrementInDollars.toNumber(),
        auctionStartTimeTimestamp: createdAuction.auctionStartTimeTimestamp,
        auctionEndTimeTimestamp: createdAuction.auctionEndTimeTimestamp,
        itemImageUrl: createdAuction.itemImageUrl,
        currentStatus: createdAuction.currentStatus,
        createdAtTimestamp: createdAuction.createdAtTimestamp,
        creatorUser: {
          userId: createdAuction.creatorUser.id,
          username: createdAuction.creatorUser.username,
          fullName: createdAuction.creatorUser.fullName
        },
        winnerUser: null,
        totalBidCount: 0,
        highestBidder: null
      },
      errorMessage: null
    };
  } catch (error) {
    logErrorMessage('Error creating auction item', error);
    return {
      wasCreationSuccessful: false,
      auctionItem: null,
      errorMessage: 'Failed to create auction item'
    };
  }
}

// ==============================|| FETCH ALL ACTIVE AUCTIONS ||============================== //

export async function fetchAllActiveAuctionItems(): Promise<AuctionItemData[]> {
  try {
    const auctionItems = await prismaClient.auctionItem.findMany({
      where: {
        currentStatus: 'ACTIVE',
        auctionEndTimeTimestamp: {
          gt: new Date()
        }
      },
      include: {
        creatorUser: {
          select: { id: true, username: true, fullName: true }
        },
        winnerUser: {
          select: { id: true, username: true, fullName: true }
        },
        _count: {
          select: { allBidsOnItem: true }
        }
      },
      orderBy: {
        auctionEndTimeTimestamp: 'asc'
      }
    });

    // Get highest bidder for each auction
    const auctionItemsWithBidders = await Promise.all(
      auctionItems.map(async (item) => {
        const highestBid = await prismaClient.bid.findFirst({
          where: {
            auctionItemId: item.id,
            wasBidSuccessful: true
          },
          orderBy: {
            bidAmountInDollars: 'desc'
          },
          include: {
            bidderUser: {
              select: { id: true, username: true }
            }
          }
        });

        return {
          id: item.id,
          itemTitle: item.itemTitle,
          itemDescription: item.itemDescription,
          startingPriceInDollars: item.startingPriceInDollars.toNumber(),
          currentHighestBidInDollars: item.currentHighestBidInDollars.toNumber(),
          minimumBidIncrementInDollars: item.minimumBidIncrementInDollars.toNumber(),
          auctionStartTimeTimestamp: item.auctionStartTimeTimestamp,
          auctionEndTimeTimestamp: item.auctionEndTimeTimestamp,
          itemImageUrl: item.itemImageUrl,
          currentStatus: item.currentStatus,
          createdAtTimestamp: item.createdAtTimestamp,
          creatorUser: {
            userId: item.creatorUser.id,
            username: item.creatorUser.username,
            fullName: item.creatorUser.fullName
          },
          winnerUser: item.winnerUser
            ? {
                userId: item.winnerUser.id,
                username: item.winnerUser.username,
                fullName: item.winnerUser.fullName
              }
            : null,
          totalBidCount: item._count.allBidsOnItem,
          highestBidder: highestBid
            ? {
                userId: highestBid.bidderUser.id,
                username: highestBid.bidderUser.username
              }
            : null
        };
      })
    );

    return auctionItemsWithBidders;
  } catch (error) {
    logErrorMessage('Error fetching active auction items', error);
    return [];
  }
}

// ==============================|| FETCH SINGLE AUCTION ITEM ||============================== //

export async function fetchAuctionItemById(auctionItemId: string): Promise<AuctionItemData | null> {
  try {
    const auctionItem = await prismaClient.auctionItem.findUnique({
      where: { id: auctionItemId },
      include: {
        creatorUser: {
          select: { id: true, username: true, fullName: true }
        },
        winnerUser: {
          select: { id: true, username: true, fullName: true }
        },
        _count: {
          select: { allBidsOnItem: true }
        }
      }
    });

    if (!auctionItem) {
      return null;
    }

    const highestBid = await prismaClient.bid.findFirst({
      where: {
        auctionItemId: auctionItem.id,
        wasBidSuccessful: true
      },
      orderBy: {
        bidAmountInDollars: 'desc'
      },
      include: {
        bidderUser: {
          select: { id: true, username: true }
        }
      }
    });

    return {
      id: auctionItem.id,
      itemTitle: auctionItem.itemTitle,
      itemDescription: auctionItem.itemDescription,
      startingPriceInDollars: auctionItem.startingPriceInDollars.toNumber(),
      currentHighestBidInDollars: auctionItem.currentHighestBidInDollars.toNumber(),
      minimumBidIncrementInDollars: auctionItem.minimumBidIncrementInDollars.toNumber(),
      auctionStartTimeTimestamp: auctionItem.auctionStartTimeTimestamp,
      auctionEndTimeTimestamp: auctionItem.auctionEndTimeTimestamp,
      itemImageUrl: auctionItem.itemImageUrl,
      currentStatus: auctionItem.currentStatus,
      createdAtTimestamp: auctionItem.createdAtTimestamp,
      creatorUser: {
        userId: auctionItem.creatorUser.id,
        username: auctionItem.creatorUser.username,
        fullName: auctionItem.creatorUser.fullName
      },
      winnerUser: auctionItem.winnerUser
        ? {
            userId: auctionItem.winnerUser.id,
            username: auctionItem.winnerUser.username,
            fullName: auctionItem.winnerUser.fullName
          }
        : null,
      totalBidCount: auctionItem._count.allBidsOnItem,
      highestBidder: highestBid
        ? {
            userId: highestBid.bidderUser.id,
            username: highestBid.bidderUser.username
          }
        : null
    };
  } catch (error) {
    logErrorMessage('Error fetching auction item by id', error, { auctionItemId });
    return null;
  }
}

// ==============================|| FETCH BID HISTORY ||============================== //

export async function fetchBidHistoryForAuction(auctionItemId: string, limitNumberOfBids: number = 50): Promise<BidHistoryItem[]> {
  try {
    const bidHistory = await prismaClient.bid.findMany({
      where: {
        auctionItemId,
        wasBidSuccessful: true
      },
      include: {
        bidderUser: {
          select: { id: true, username: true }
        }
      },
      orderBy: {
        placedAtTimestamp: 'desc'
      },
      take: limitNumberOfBids
    });

    return bidHistory.map((bid) => ({
      bidId: bid.id,
      bidAmountInDollars: bid.bidAmountInDollars.toNumber(),
      placedAtTimestamp: bid.placedAtTimestamp,
      bidderUser: {
        userId: bid.bidderUser.id,
        username: bid.bidderUser.username
      }
    }));
  } catch (error) {
    logErrorMessage('Error fetching bid history', error, { auctionItemId });
    return [];
  }
}

// ==============================|| FETCH USER BID HISTORY ||============================== //

export async function fetchBidHistoryForUser(
  userId: string,
  limitNumberOfBids: number = 50
): Promise<Array<BidHistoryItem & { auctionTitle: string }>> {
  try {
    const userBids = await prismaClient.bid.findMany({
      where: {
        bidderUserId: userId
      },
      include: {
        bidderUser: {
          select: { id: true, username: true }
        },
        auctionItem: {
          select: { itemTitle: true }
        }
      },
      orderBy: {
        placedAtTimestamp: 'desc'
      },
      take: limitNumberOfBids
    });

    return userBids.map((bid) => ({
      bidId: bid.id,
      bidAmountInDollars: bid.bidAmountInDollars.toNumber(),
      placedAtTimestamp: bid.placedAtTimestamp,
      bidderUser: {
        userId: bid.bidderUser.id,
        username: bid.bidderUser.username
      },
      auctionTitle: bid.auctionItem.itemTitle
    }));
  } catch (error) {
    logErrorMessage('Error fetching user bid history', error, { userId });
    return [];
  }
}

// ==============================|| FETCH USER'S BIDS WITH AUCTION DETAILS ||============================== //

export interface UserBidWithAuctionData {
  bidId: string;
  bidAmountInDollars: number;
  placedAtTimestamp: Date;
  wasBidSuccessful: boolean;
  auctionItem: {
    id: string;
    itemTitle: string;
    itemDescription: string;
    itemImageUrl: string | null;
    currentHighestBidInDollars: number;
    auctionEndTimeTimestamp: Date;
    currentStatus: string;
  };
  isHighestBidder: boolean;
  isWinner: boolean;
}

export async function fetchUserBidsWithAuctionDetails(userId: string): Promise<UserBidWithAuctionData[]> {
  try {
    // Get all unique auctions the user has bid on
    const userBids = await prismaClient.bid.findMany({
      where: {
        bidderUserId: userId,
        wasBidSuccessful: true
      },
      include: {
        auctionItem: {
          include: {
            _count: {
              select: { allBidsOnItem: true }
            }
          }
        }
      },
      orderBy: {
        placedAtTimestamp: 'desc'
      }
    });

    // Group bids by auction and get the highest bid per auction
    const auctionBidsMap = new Map<string, (typeof userBids)[0]>();
    for (const bid of userBids) {
      const existingBid = auctionBidsMap.get(bid.auctionItemId);
      if (!existingBid || bid.bidAmountInDollars.toNumber() > existingBid.bidAmountInDollars.toNumber()) {
        auctionBidsMap.set(bid.auctionItemId, bid);
      }
    }

    const results: UserBidWithAuctionData[] = [];

    for (const [auctionId, userHighestBid] of auctionBidsMap) {
      // Check if user is the highest bidder for this auction
      const highestBidOnAuction = await prismaClient.bid.findFirst({
        where: {
          auctionItemId: auctionId,
          wasBidSuccessful: true
        },
        orderBy: {
          bidAmountInDollars: 'desc'
        }
      });

      const isHighestBidder = highestBidOnAuction?.bidderUserId === userId;
      const isWinner = userHighestBid.auctionItem.currentStatus === 'ENDED' && userHighestBid.auctionItem.winnerUserId === userId;

      results.push({
        bidId: userHighestBid.id,
        bidAmountInDollars: userHighestBid.bidAmountInDollars.toNumber(),
        placedAtTimestamp: userHighestBid.placedAtTimestamp,
        wasBidSuccessful: userHighestBid.wasBidSuccessful,
        auctionItem: {
          id: userHighestBid.auctionItem.id,
          itemTitle: userHighestBid.auctionItem.itemTitle,
          itemDescription: userHighestBid.auctionItem.itemDescription,
          itemImageUrl: userHighestBid.auctionItem.itemImageUrl,
          currentHighestBidInDollars: userHighestBid.auctionItem.currentHighestBidInDollars.toNumber(),
          auctionEndTimeTimestamp: userHighestBid.auctionItem.auctionEndTimeTimestamp,
          currentStatus: userHighestBid.auctionItem.currentStatus
        },
        isHighestBidder,
        isWinner
      });
    }

    // Sort by placed timestamp desc
    results.sort((a, b) => b.placedAtTimestamp.getTime() - a.placedAtTimestamp.getTime());

    return results;
  } catch (error) {
    logErrorMessage('Error fetching user bids with auction details', error, { userId });
    return [];
  }
}

// ==============================|| FETCH USER'S WON AUCTIONS ||============================== //

export interface WonAuctionData {
  id: string;
  itemTitle: string;
  itemDescription: string;
  itemImageUrl: string | null;
  winningBidAmountInDollars: number;
  auctionEndTimeTimestamp: Date;
  wonAtTimestamp: Date;
}

export async function fetchUserWonAuctions(userId: string): Promise<WonAuctionData[]> {
  try {
    const wonAuctions = await prismaClient.auctionItem.findMany({
      where: {
        winnerUserId: userId,
        currentStatus: 'ENDED'
      },
      orderBy: {
        auctionEndTimeTimestamp: 'desc'
      }
    });

    return wonAuctions.map((auction) => ({
      id: auction.id,
      itemTitle: auction.itemTitle,
      itemDescription: auction.itemDescription,
      itemImageUrl: auction.itemImageUrl,
      winningBidAmountInDollars: auction.currentHighestBidInDollars.toNumber(),
      auctionEndTimeTimestamp: auction.auctionEndTimeTimestamp,
      wonAtTimestamp: auction.auctionEndTimeTimestamp
    }));
  } catch (error) {
    logErrorMessage('Error fetching user won auctions', error, { userId });
    return [];
  }
}

// ==============================|| END EXPIRED AUCTIONS ||============================== //

export async function markExpiredAuctionsAsEnded(): Promise<number> {
  try {
    const result = await prismaClient.auctionItem.updateMany({
      where: {
        currentStatus: 'ACTIVE',
        auctionEndTimeTimestamp: {
          lte: new Date()
        }
      },
      data: {
        currentStatus: 'ENDED'
      }
    });

    // For each ended auction, set the winner
    const endedAuctions = await prismaClient.auctionItem.findMany({
      where: {
        currentStatus: 'ENDED',
        winnerUserId: null
      }
    });

    for (const auction of endedAuctions) {
      const highestBid = await prismaClient.bid.findFirst({
        where: {
          auctionItemId: auction.id,
          wasBidSuccessful: true
        },
        orderBy: {
          bidAmountInDollars: 'desc'
        }
      });

      if (highestBid) {
        await prismaClient.auctionItem.update({
          where: { id: auction.id },
          data: { winnerUserId: highestBid.bidderUserId }
        });
      }
    }

    return result.count;
  } catch (error) {
    logErrorMessage('Error marking expired auctions as ended', error);
    return 0;
  }
}
