// ==============================|| USER AUCTIONS ROUTES ||============================== //
// Defines routes for user's bids and won auctions

import { Router, Response } from 'express';
import { fetchUserBidsWithAuctionDetails, fetchUserWonAuctions } from '../services/auction-data-fetcher.service';
import { requireJwtAuthentication, AuthenticatedRequest } from '../middleware/authentication.middleware';
import { HTTP_STATUS_OK } from '../constants/error-codes.constants';

const userAuctionsRouter = Router();

// ==============================|| GET USER'S BIDS ||============================== //

userAuctionsRouter.get('/my-bids', requireJwtAuthentication as any, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const userId = request.authenticatedUser?.userId;

    if (!userId) {
      response.status(401).json({
        success: false,
        errorCode: 'AUTH_ERROR',
        errorMessage: 'User not authenticated'
      });
      return;
    }

    const userBids = await fetchUserBidsWithAuctionDetails(userId);

    response.status(HTTP_STATUS_OK).json({
      success: true,
      data: {
        bids: userBids,
        totalCount: userBids.length
      }
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'Failed to fetch user bids'
    });
  }
});

// ==============================|| GET USER'S WON AUCTIONS ||============================== //

userAuctionsRouter.get('/won-items', requireJwtAuthentication as any, async (request: AuthenticatedRequest, response: Response) => {
  try {
    const userId = request.authenticatedUser?.userId;

    if (!userId) {
      response.status(401).json({
        success: false,
        errorCode: 'AUTH_ERROR',
        errorMessage: 'User not authenticated'
      });
      return;
    }

    const wonAuctions = await fetchUserWonAuctions(userId);

    response.status(HTTP_STATUS_OK).json({
      success: true,
      data: {
        wonItems: wonAuctions,
        totalCount: wonAuctions.length
      }
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'Failed to fetch won items'
    });
  }
});

export default userAuctionsRouter;
