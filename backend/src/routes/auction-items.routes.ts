// Auction items API routes

import { Router, Response } from "express";
import {
  fetchAllActiveAuctionItems,
  fetchAuctionItemById,
  fetchBidHistoryForAuction,
  createAuctionItem,
} from "../services/auction-data-fetcher.service";
import {
  requireJwtAuthentication,
  AuthenticatedRequest,
} from "../middleware/authentication.middleware";
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
} from "../constants/error-codes.constants";

const auctionItemsRouter = Router();

// Create auction
auctionItemsRouter.post(
  "/",
  requireJwtAuthentication as any,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const userId = request.authenticatedUser?.userId;

      if (!userId) {
        response.status(401).json({
          success: false,
          errorCode: "AUTH_ERROR",
          errorMessage: "User not authenticated",
        });
        return;
      }

      const {
        title,
        description,
        startingPrice,
        minimumBidIncrement,
        durationInSeconds,
        imageUrl,
      } = request.body;

      if (
        !title ||
        !description ||
        startingPrice === undefined ||
        durationInSeconds === undefined
      ) {
        response.status(HTTP_STATUS_BAD_REQUEST).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          errorMessage:
            "Title, description, starting price, and duration are required",
        });
        return;
      }

      const result = await createAuctionItem({
        itemTitle: title,
        itemDescription: description,
        startingPriceInDollars: parseFloat(startingPrice),
        minimumBidIncrementInDollars: parseFloat(minimumBidIncrement) || 1.0,
        auctionDurationInSeconds: parseInt(durationInSeconds, 10),
        itemImageUrl: imageUrl || null,
        creatorUserId: userId,
      });

      if (!result.wasCreationSuccessful) {
        response.status(HTTP_STATUS_BAD_REQUEST).json({
          success: false,
          errorCode: "CREATION_ERROR",
          errorMessage: result.errorMessage,
        });
        return;
      }

      response.status(HTTP_STATUS_CREATED).json({
        success: true,
        data: { auctionItem: result.auctionItem },
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        errorMessage: "Failed to create auction item",
      });
    }
  },
);

// Get all active auctions
auctionItemsRouter.get(
  "/",
  requireJwtAuthentication as any,
  async (_request: AuthenticatedRequest, response: Response) => {
    try {
      const activeAuctionItems = await fetchAllActiveAuctionItems();

      response.status(HTTP_STATUS_OK).json({
        success: true,
        data: {
          auctionItems: activeAuctionItems,
          totalCount: activeAuctionItems.length,
        },
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        errorMessage: "Failed to fetch auction items",
      });
    }
  },
);

// Get single auction
auctionItemsRouter.get(
  "/:auctionItemId",
  requireJwtAuthentication as any,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const auctionItemId = request.params.auctionItemId as string;
      const auctionItem = await fetchAuctionItemById(auctionItemId);

      if (!auctionItem) {
        response.status(HTTP_STATUS_NOT_FOUND).json({
          success: false,
          errorCode: "AUCTION_NOT_FOUND",
          errorMessage: "Auction item not found",
        });
        return;
      }

      response.status(HTTP_STATUS_OK).json({
        success: true,
        data: { auctionItem },
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        errorMessage: "Failed to fetch auction item",
      });
    }
  },
);

// Get bid history
auctionItemsRouter.get(
  "/:auctionItemId/bid-history",
  requireJwtAuthentication as any,
  async (request: AuthenticatedRequest, response: Response) => {
    try {
      const auctionItemId = request.params.auctionItemId as string;
      const limitParam = request.query.limit;
      const limit =
        typeof limitParam === "string" ? parseInt(limitParam, 10) : 50;

      const bidHistory = await fetchBidHistoryForAuction(auctionItemId, limit);

      response.status(HTTP_STATUS_OK).json({
        success: true,
        data: {
          bidHistory,
          totalCount: bidHistory.length,
        },
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        errorMessage: "Failed to fetch bid history",
      });
    }
  },
);

export default auctionItemsRouter;
