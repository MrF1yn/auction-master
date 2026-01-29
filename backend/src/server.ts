// Backend server entry point with Express and Socket.io

import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";

import { environmentConfig } from "./config/environment.config";
import { socketIoServerOptions } from "./config/socket-io.config";
import {
  connectToDatabaseWithPrisma,
  disconnectFromDatabaseWithPrisma,
} from "./config/prisma-client.config";
import {
  connectToRedisServer,
  disconnectFromRedisServer,
} from "./config/redis-client.config";
import { generalRateLimiter } from "./middleware/rate-limiter.middleware";
import {
  globalErrorHandlerMiddleware,
  notFoundHandlerMiddleware,
} from "./middleware/global-error-handler.middleware";
import mainRouter from "./routes/index.routes";
import { socketAuthenticationMiddleware } from "./sockets/authentication.socket";
import { registerTimeSyncHandlers } from "./sockets/time-sync.socket";
import {
  registerBidEventHandlers,
  setSocketIoServerInstance,
} from "./sockets/bid-events.socket";
import { logInfoMessage, logErrorMessage } from "./utils/logger.util";
import { markExpiredAuctionsAsEnded } from "./services/auction-data-fetcher.service";

const AUCTION_CHECK_INTERVAL = 5000;

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, socketIoServerOptions);

setSocketIoServerInstance(io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: environmentConfig.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(generalRateLimiter);

// Routes
app.use("/api", mainRouter);
app.use(notFoundHandlerMiddleware);
app.use(globalErrorHandlerMiddleware);

// Socket.io setup
io.use(socketAuthenticationMiddleware);

io.on("connection", (socket) => {
  const { userId, username } = socket.data;
  logInfoMessage("Socket connected", { socketId: socket.id, userId, username });

  registerTimeSyncHandlers(socket);
  registerBidEventHandlers(socket);

  socket.on("disconnect", (reason) => {
    logInfoMessage("Socket disconnected", {
      socketId: socket.id,
      userId,
      reason,
    });
  });

  socket.on("error", (error) => {
    logErrorMessage("Socket error", error, { socketId: socket.id, userId });
  });
});

// Auction expiration checker
async function checkExpiredAuctions(): Promise<void> {
  try {
    const result = await markExpiredAuctionsAsEnded();
    if (result.count > 0) {
      logInfoMessage(`Marked ${result.count} auctions as ended`);

      // Broadcast each ended auction individually for real-time UI update
      for (const auction of result.endedAuctions) {
        io.emit("auction:ended", {
          auctionItemId: auction.auctionItemId,
          winnerUserId: auction.winnerUserId,
          winnerUsername: auction.winnerUsername,
          finalBidAmountInDollars: auction.finalBidAmountInDollars,
        });
      }
    }
  } catch (error) {
    logErrorMessage("Auction expiration check failed", error);
  }
}

function startAuctionExpirationChecker(): void {
  checkExpiredAuctions();
  setInterval(checkExpiredAuctions, AUCTION_CHECK_INTERVAL);
  logInfoMessage("Auction expiration checker started", {
    intervalMs: AUCTION_CHECK_INTERVAL,
  });
}

// Server startup
async function startServer(): Promise<void> {
  try {
    logInfoMessage("Connecting to databases...");
    await connectToDatabaseWithPrisma();
    await connectToRedisServer();

    const port = environmentConfig.PORT;
    httpServer.listen(port, () => {
      logInfoMessage("Server started", {
        port,
        environment: environmentConfig.NODE_ENV,
      });
      console.log(`
========================================
  Auction Platform Backend
========================================
  Environment: ${environmentConfig.NODE_ENV}
  Port: ${port}
  API URL: http://localhost:${port}/api
  Socket.IO: ws://localhost:${port}
========================================
      `);
      startAuctionExpirationChecker();
    });
  } catch (error) {
    logErrorMessage("Failed to start server", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logInfoMessage(`Received ${signal}, shutting down...`);
  try {
    io.close();
    httpServer.close();
    await disconnectFromDatabaseWithPrisma();
    await disconnectFromRedisServer();
    logInfoMessage("Shutdown completed");
    process.exit(0);
  } catch (error) {
    logErrorMessage("Shutdown error", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (error) => {
  logErrorMessage("Uncaught Exception", error);
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logErrorMessage("Unhandled Rejection", reason as Error);
});

startServer();
