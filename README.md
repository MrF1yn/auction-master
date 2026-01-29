# LiveBid - Real-time Auction Platform

A production-grade, real-time auction/bidding platform where users can create auctions, place bids in real-time, and track won items.

## Features

- **Real-time Bidding**: WebSocket-powered live bid updates across all connected clients
- **Server-synced Timers**: NTP-style time synchronization ensures accurate countdown timers
- **Race Condition Prevention**: Redis distributed locks prevent bid conflicts
- **JWT Authentication**: Secure user authentication with token blacklisting
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Theme support with MUI

## Tech Stack

### Backend

- **Node.js + TypeScript** - Runtime and language
- **Express** - HTTP server
- **Socket.io** - Real-time WebSocket communication
- **Prisma ORM** - Database access and migrations
- **PostgreSQL** - Primary database
- **Redis** - Distributed locks and caching

### Frontend

- **React 19 + TypeScript** - UI framework
- **Material UI (MUI)** - Component library
- **Zustand** - State management
- **Socket.io-client** - WebSocket client
- **Framer Motion** - Animations
- **Vite** - Build tool

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │   Zustand   │  │    Socket.io Client     │ │
│  │ Components  │◄─┤    Store    │◄─┤  (Real-time updates)    │ │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘ │
└────────────────────────────────────────────────┼───────────────┘
                                                 │ WebSocket
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Express   │  │  Socket.io  │  │     Bid Processor       │ │
│  │   Routes    │  │   Server    │──┤  (Distributed Locks)    │ │
│  └──────┬──────┘  └─────────────┘  └───────────┬─────────────┘ │
│         │                                      │               │
│         ▼                                      ▼               │
│  ┌─────────────┐                      ┌─────────────┐         │
│  │   Prisma    │                      │    Redis    │         │
│  │    ORM      │                      │   (Locks)   │         │
│  └──────┬──────┘                      └─────────────┘         │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
   ┌─────────────┐
   │ PostgreSQL  │
   │  Database   │
   └─────────────┘
```

### Key Components

**Time Synchronization (NTP-style)**

```
Client                    Server
  │                         │
  ├──── t0 (send) ─────────►│
  │                         ├── t1 (receive)
  │                         ├── t2 (send)
  │◄──── response ──────────┤
  ├── t3 (receive)          │
  │                         │
  offset = ((t1-t0) + (t2-t3)) / 2
```

**Bid Processing with Distributed Locks**

```
1. Acquire Redis lock for auction
2. Validate bid amount > current highest
3. Create bid record in PostgreSQL
4. Update auction's current highest bid
5. Release Redis lock
6. Broadcast update to all clients
```

## Project Structure

```
livebid/
├── frontend/                     # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   └── auction/          # Auction-specific components
│   │   │       ├── AuctionCard.tsx
│   │   │       ├── BidButton.tsx
│   │   │       ├── CountdownTimer.tsx
│   │   │       ├── BidStatusBadges.tsx
│   │   │       └── CreateAuctionModal.tsx
│   │   ├── hooks/
│   │   │   ├── useSocketConnection.ts
│   │   │   ├── useBidSubmission.ts
│   │   │   └── useServerSyncedCountdown.ts
│   │   ├── store/
│   │   │   └── auctionStore.ts
│   │   ├── pages/
│   │   │   ├── auction/
│   │   │   ├── my-bids/
│   │   │   └── won-items/
│   │   └── contexts/
│   │       └── JWTContext.tsx
│   ├── package.json
│   ├── vite.config.mts
│   └── Dockerfile.dev
│
├── backend/                      # Backend Node.js application
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── lib/
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   ├── Dockerfile
│   └── Dockerfile.dev
│
├── docker-compose.yml            # Infrastructure only (DB + Redis)
├── docker-compose.dev.yml        # Full dev stack
├── docker-compose.prod.yml       # Production backend
├── .env.production.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Yarn (for frontend)

### Quick Start

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd livebid

   # Frontend dependencies
   cd frontend && yarn install && cd ..

   # Backend dependencies
   cd backend && npm install && cd ..
   ```

2. **Start infrastructure**

   ```bash
   docker-compose up -d
   ```

3. **Setup database**

   ```bash
   cd backend

   # Run migrations
   npx prisma migrate dev

   # Seed demo data
   npx prisma db seed
   ```

4. **Start the backend**

   ```bash
   cd backend
   npm run dev
   ```

5. **Start the frontend** (new terminal)

   ```bash
   cd frontend
   yarn start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3010/api
   - Prisma Studio: `cd backend && npx prisma studio`

### Demo Credentials

```
Email: demo@auction.com
Password: Password123
```

## Docker Deployment

### Development (Full Stack)

Run everything in Docker with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Production

1. **Create environment file**

   ```bash
   cp .env.production.example .env.production
   ```

2. **Configure environment variables**

   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db
   REDIS_URL=redis://host:6379
   JWT_SECRET_KEY=your-secret-key-min-32-chars
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Deploy backend**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

## API Endpoints

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login user        |
| POST   | `/api/auth/logout`   | Logout user       |
| GET    | `/api/auth/me`       | Get current user  |

### Auctions

| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| GET    | `/api/auction-items`     | List all active auctions |
| GET    | `/api/auction-items/:id` | Get auction details      |
| POST   | `/api/auction-items`     | Create new auction       |

### User

| Method | Endpoint              | Description             |
| ------ | --------------------- | ----------------------- |
| GET    | `/api/user/my-bids`   | Get user's bid history  |
| GET    | `/api/user/won-items` | Get user's won auctions |

## WebSocket Events

### Client → Server

| Event                | Payload                                 | Description                   |
| -------------------- | --------------------------------------- | ----------------------------- |
| `JOIN_AUCTION_ROOM`  | `{ auctionItemId }`                     | Join auction room for updates |
| `LEAVE_AUCTION_ROOM` | `{ auctionItemId }`                     | Leave auction room            |
| `PLACE_BID`          | `{ auctionItemId, bidAmountInDollars }` | Place a bid                   |
| `TIME_SYNC_REQUEST`  | `{ clientTimestampT0InMs }`             | Request time sync             |

### Server → Client

| Event                  | Payload                                            | Description         |
| ---------------------- | -------------------------------------------------- | ------------------- |
| `BID_UPDATE_BROADCAST` | `{ auctionItemId, newHighestBidInDollars, ... }`   | New bid placed      |
| `BID_PLACED_SUCCESS`   | `{ bidId, bidAmountInDollars }`                    | Your bid succeeded  |
| `BID_PLACED_ERROR`     | `{ errorCode, errorMessage }`                      | Your bid failed     |
| `TIME_SYNC_RESPONSE`   | `{ serverTimestampT1InMs, serverTimestampT2InMs }` | Time sync response  |
| `auctions:ended`       | `{ count }`                                        | Auctions have ended |

## Database Schema

```prisma
model User {
  id                String        @id @default(uuid())
  email             String        @unique
  username          String        @unique
  passwordHash      String
  fullName          String
  createdAuctions   AuctionItem[] @relation("CreatorRelation")
  wonAuctions       AuctionItem[] @relation("WinnerRelation")
  bids              Bid[]
}

model AuctionItem {
  id                          String   @id @default(uuid())
  itemTitle                   String
  itemDescription             String
  startingPriceInDollars      Float
  currentHighestBidInDollars  Float
  minimumBidIncrementInDollars Float
  auctionStartTimeTimestamp   DateTime
  auctionEndTimeTimestamp     DateTime
  itemImageUrl                String?
  currentStatus               AuctionStatus
  creatorUserId               String
  winnerUserId                String?
  bids                        Bid[]
}

model Bid {
  id                String      @id @default(uuid())
  bidAmountInDollars Float
  bidPlacedAtTimestamp DateTime
  wasBidSuccessful   Boolean
  auctionItemId      String
  bidderUserId       String
}
```

## Environment Variables

### Backend

| Variable                       | Description                       | Default                 |
| ------------------------------ | --------------------------------- | ----------------------- |
| `DATABASE_URL`                 | PostgreSQL connection string      | -                       |
| `REDIS_URL`                    | Redis connection string           | -                       |
| `JWT_SECRET_KEY`               | JWT signing secret (min 32 chars) | -                       |
| `JWT_EXPIRATION_TIME_IN_HOURS` | Token expiration                  | `24`                    |
| `PORT`                         | Server port                       | `3010`                  |
| `NODE_ENV`                     | Environment                       | `development`           |
| `CORS_ORIGIN`                  | Allowed CORS origin               | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_IN_MINUTES` | Rate limit window                 | `15`                    |
| `RATE_LIMIT_MAX_REQUESTS`      | Max requests per window           | `100`                   |

### Frontend

| Variable              | Description     | Default                 |
| --------------------- | --------------- | ----------------------- |
| `VITE_APP_API_URL`    | Backend API URL | `http://localhost:3010` |
| `VITE_APP_SOCKET_URL` | WebSocket URL   | `http://localhost:3010` |

## Scripts

### Frontend (from `frontend/` directory)

```bash
yarn start        # Start dev server
yarn build        # Production build
yarn lint         # Run ESLint
yarn lint:fix     # Fix ESLint errors
```

### Backend (from `backend/` directory)

```bash
npm run dev              # Start with hot reload
npm run build            # Build TypeScript
npm run start            # Start production server
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed demo data
```

## Testing the Auction Flow

1. **Login** with demo credentials or register a new account
2. **Create an auction** using the "Create Auction" button
   - Use "10 seconds (testing)" duration for quick testing
3. **Place bids** on auctions
4. **Watch real-time updates** - open multiple browser tabs to see live bid updates
5. **Wait for auction to end** - the system automatically marks winners
6. **Check "Won Items"** page to see auctions you've won

## Troubleshooting

### Common Issues

**Database connection failed**

```bash
# Ensure PostgreSQL is running
docker-compose ps
# Restart if needed
docker-compose restart postgres
```

**Redis connection failed**

```bash
# Ensure Redis is running
docker-compose ps
# Restart if needed
docker-compose restart redis
```

**Prisma client not generated**

```bash
cd backend
npx prisma generate
```

**Migrations not applied**

```bash
cd backend
npx prisma migrate dev
```

**Port already in use**

```bash
# Find and kill process on port 3010
lsof -i :3010
kill -9 <PID>
```

## License

MIT
