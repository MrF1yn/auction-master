// ==============================|| MAIN ROUTES INDEX ||============================== //
// Combines all route modules

import { Router, Request, Response } from 'express';
import authenticationRouter from './authentication.routes';
import auctionItemsRouter from './auction-items.routes';
import userAuctionsRouter from './user-auctions.routes';

const mainRouter = Router();

// ==============================|| HEALTH CHECK ||============================== //

mainRouter.get('/health', (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// ==============================|| API ROUTES ||============================== //

mainRouter.use('/account', authenticationRouter);
mainRouter.use('/auction-items', auctionItemsRouter);
mainRouter.use('/user', userAuctionsRouter);

// ==============================|| API INFO ||============================== //

mainRouter.get('/', (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    data: {
      name: 'Auction Platform API',
      version: '1.0.0',
      description: 'Real-time bidding platform with WebSocket support',
      endpoints: {
        health: 'GET /api/health',
        auth: {
          register: 'POST /api/account/register',
          login: 'POST /api/account/login',
          logout: 'POST /api/account/logout',
          me: 'GET /api/account/me'
        },
        auctions: {
          list: 'GET /api/auction-items',
          detail: 'GET /api/auction-items/:id',
          bidHistory: 'GET /api/auction-items/:id/bid-history'
        },
        user: {
          myBids: 'GET /api/user/my-bids',
          wonItems: 'GET /api/user/won-items'
        }
      }
    }
  });
});

export default mainRouter;
