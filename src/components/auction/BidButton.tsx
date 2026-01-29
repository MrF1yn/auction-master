// Button for placing bids with loading state and status display

import { useState } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import useBidSubmission from 'hooks/useBidSubmission';
import { openSnackbar } from 'api/snackbar';
import { SnackbarProps } from 'types/snackbar';

interface BidButtonProps {
  auctionItemId: string;
  currentBidInDollars: number;
  minimumIncrementInDollars: number;
  isAuctionEnded: boolean;
  isUserHighestBidder: boolean;
  isUserWinner: boolean;
  disabled?: boolean;
}

export default function BidButton({
  auctionItemId,
  currentBidInDollars,
  minimumIncrementInDollars,
  isAuctionEnded,
  isUserHighestBidder,
  isUserWinner,
  disabled = false
}: BidButtonProps) {
  const { submitBidForAuction, isBidSubmissionInProgress } = useBidSubmission();
  const [isAnimating, setIsAnimating] = useState(false);

  const nextBidAmount = currentBidInDollars + minimumIncrementInDollars;

  const handleBidClick = async () => {
    if (isAuctionEnded || disabled || isBidSubmissionInProgress) return;

    setIsAnimating(true);
    const result = await submitBidForAuction(auctionItemId, nextBidAmount);
    setIsAnimating(false);

    openSnackbar({
      open: true,
      message: result.wasSuccessful
        ? `Bid of $${nextBidAmount.toFixed(2)} placed successfully!`
        : result.errorMessage || 'Failed to place bid',
      variant: 'alert',
      alert: { color: result.wasSuccessful ? 'success' : 'error' }
    } as SnackbarProps);
  };

  const formatIncrement = (amount: number) => {
    return amount >= 1 && amount === Math.floor(amount) ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
  };

  const getButtonContent = () => {
    if (isAuctionEnded) {
      return (
        <Typography variant="h6" sx={{ fontWeight: isUserWinner ? 700 : 600 }}>
          {isUserWinner ? '🎉 You Won!' : 'You Lost'}
        </Typography>
      );
    }

    if (isBidSubmissionInProgress) {
      return <CircularProgress size={24} color="inherit" />;
    }

    if (isUserHighestBidder) {
      return (
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          You're Winning!
        </Typography>
      );
    }

    return (
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Bid +{formatIncrement(minimumIncrementInDollars)}
      </Typography>
    );
  };

  const getButtonColor = (): 'primary' | 'success' | 'error' => {
    if (isAuctionEnded) return isUserWinner ? 'success' : 'error';
    if (isUserHighestBidder) return 'success';
    return 'primary';
  };

  return (
    <motion.div animate={isAnimating ? { scale: [1, 0.95, 1] } : {}} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
      <Button
        fullWidth
        variant="contained"
        color={getButtonColor()}
        disabled={isAuctionEnded || disabled || isBidSubmissionInProgress || isUserHighestBidder}
        onClick={handleBidClick}
        sx={{
          py: 1.5,
          position: 'relative',
          '&.Mui-disabled': {
            bgcolor: isAuctionEnded ? (isUserWinner ? 'success.main' : 'error.main') : isUserHighestBidder ? 'success.main' : undefined,
            color: isAuctionEnded || isUserHighestBidder ? 'white' : undefined
          }
        }}
      >
        {getButtonContent()}
      </Button>
    </motion.div>
  );
}
