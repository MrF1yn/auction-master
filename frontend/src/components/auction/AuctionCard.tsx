// Displays a single auction item with real-time bid updates

import { useMemo, useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

import useAuth from 'hooks/useAuth';
import useAuctionStore, { AuctionItemState } from 'store/auctionStore';
import CountdownTimer from './CountdownTimer';
import BidButton from './BidButton';
import { WinningBadge, OutbidBadge, BidCountBadge, AuctionEndedBadge } from './BidStatusBadges';

interface AuctionCardProps {
  auctionItem: AuctionItemState;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop';

export default function AuctionCard({ auctionItem }: AuctionCardProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const { recentlyUpdatedAuctionIds } = useAuctionStore();

  const currentUserId = user?.id || '';
  const isRecentlyUpdated = recentlyUpdatedAuctionIds.has(auctionItem.id);
  const isAuctionEnded = auctionItem.currentStatus === 'ENDED';

  const prevBidRef = useRef(auctionItem.currentHighestBidInDollars);
  const [showPriceFlash, setShowPriceFlash] = useState(false);

  // Flash animation when bid amount changes
  useEffect(() => {
    if (prevBidRef.current !== auctionItem.currentHighestBidInDollars) {
      setShowPriceFlash(true);
      prevBidRef.current = auctionItem.currentHighestBidInDollars;

      const timer = setTimeout(() => setShowPriceFlash(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [auctionItem.currentHighestBidInDollars]);

  const isUserHighestBidder = useMemo(
    () => auctionItem.highestBidder?.userId === currentUserId,
    [auctionItem.highestBidder, currentUserId]
  );

  const isUserWinner = useMemo(
    () => isAuctionEnded && auctionItem.winnerUser?.userId === currentUserId,
    [isAuctionEnded, auctionItem.winnerUser, currentUserId]
  );

  const isUserOutbid = useMemo(
    () => !isUserHighestBidder && auctionItem.totalBidCount > 0 && auctionItem.highestBidder !== null,
    [isUserHighestBidder, auctionItem.totalBidCount, auctionItem.highestBidder]
  );

  const borderColor = useMemo(() => {
    if (isAuctionEnded) return isUserWinner ? 'success.main' : 'grey.400';
    if (isUserHighestBidder) return 'success.main';
    if (isUserOutbid) return 'warning.main';
    return 'divider';
  }, [isAuctionEnded, isUserWinner, isUserHighestBidder, isUserOutbid]);

  const imageUrl = auctionItem.itemImageUrl || DEFAULT_IMAGE;

  return (
    <Card
      component={motion.div}
      initial={false}
      animate={isRecentlyUpdated ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: 2,
        borderColor,
        bgcolor: 'background.paper',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': { boxShadow: theme.shadows[8] }
      }}
    >
      {/* Image */}
      <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
        <CardMedia
          component="img"
          image={imageUrl}
          alt={auctionItem.itemTitle}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isAuctionEnded ? 'grayscale(50%)' : 'none'
          }}
        />

        {/* Status badges */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
          <WinningBadge isVisible={isUserHighestBidder && !isAuctionEnded} />
          <OutbidBadge isVisible={isUserOutbid && !isAuctionEnded} />
          {isAuctionEnded && <AuctionEndedBadge winnerUsername={auctionItem.winnerUser?.username || null} />}
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', p: 2.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}
        >
          {auctionItem.itemTitle}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: 48,
            lineHeight: 1.5
          }}
        >
          {auctionItem.itemDescription}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Current bid */}
        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Current Bid
            </Typography>
            <BidCountBadge totalBidCount={auctionItem.totalBidCount} />
          </Box>

          <AnimatePresence mode="wait">
            <motion.div
              key={auctionItem.currentHighestBidInDollars}
              initial={{ scale: 1 }}
              animate={{ scale: showPriceFlash ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 0.4 }}
            >
              <Box
                component={motion.div}
                animate={{
                  backgroundColor: showPriceFlash
                    ? ['transparent', theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.3)', 'transparent']
                    : 'transparent'
                }}
                transition={{ duration: 0.8 }}
                sx={{ display: 'inline-block', px: 1, py: 0.5, mx: -1, borderRadius: 1 }}
              >
                <Typography
                  component={motion.span}
                  animate={{
                    color: showPriceFlash
                      ? [theme.palette.primary.main, theme.palette.success.main, theme.palette.primary.main]
                      : isAuctionEnded
                        ? theme.palette.text.secondary
                        : theme.palette.primary.main
                  }}
                  transition={{ duration: 0.6 }}
                  variant="h3"
                  sx={{ fontWeight: 700, display: 'block' }}
                >
                  ${auctionItem.currentHighestBidInDollars.toFixed(2)}
                </Typography>
              </Box>
            </motion.div>
          </AnimatePresence>

          {auctionItem.highestBidder && (
            <Typography variant="body2" color="text.secondary">
              Highest bidder: <strong>{auctionItem.highestBidder.username}</strong>
            </Typography>
          )}
        </Stack>

        {/* Countdown */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }} fontWeight={500}>
            {isAuctionEnded ? 'Auction ended' : 'Time remaining'}
          </Typography>
          <CountdownTimer auctionEndTimeISOString={auctionItem.auctionEndTimeTimestamp} />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <BidButton
          auctionItemId={auctionItem.id}
          currentBidInDollars={auctionItem.currentHighestBidInDollars}
          minimumIncrementInDollars={auctionItem.minimumBidIncrementInDollars}
          isAuctionEnded={isAuctionEnded}
          isUserHighestBidder={isUserHighestBidder}
          isUserWinner={isUserWinner}
        />
      </CardContent>
    </Card>
  );
}
