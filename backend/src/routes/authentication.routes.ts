// ==============================|| AUTHENTICATION ROUTES ||============================== //
// Defines routes for user authentication

import { Router } from 'express';
import {
  handleUserRegistrationRequest,
  handleUserLoginRequest,
  handleUserLogoutRequest,
  handleGetCurrentUserRequest
} from '../controllers/authentication.controller';
import { requireJwtAuthentication } from '../middleware/authentication.middleware';
import { authenticationRateLimiter } from '../middleware/rate-limiter.middleware';

const authenticationRouter = Router();

// Public routes
authenticationRouter.post('/register', authenticationRateLimiter, handleUserRegistrationRequest as any);

authenticationRouter.post('/login', authenticationRateLimiter, handleUserLoginRequest as any);

// Protected routes
authenticationRouter.post('/logout', requireJwtAuthentication as any, handleUserLogoutRequest as any);

authenticationRouter.get('/me', requireJwtAuthentication as any, handleGetCurrentUserRequest as any);

export default authenticationRouter;
