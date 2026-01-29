// Visual badges for auction status (winning, outbid, ended)

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { motion, AnimatePresence } from 'framer-motion';
import TrophyOutlined from '@ant-design/icons/TrophyOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';

const springTransition = { type: 'spring' as const, stiffness: 500, damping: 25 };

interface WinningBadgeProps {
  isVisible: boolean;
}

export function WinningBadge({ isVisible }: WinningBadgeProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={springTransition}
        >
          <Chip
            icon={<TrophyOutlined style={{ color: 'inherit' }} />}
            label="Winning"
            color="success"
            size="small"
            sx={{ fontWeight: 600, '& .MuiChip-icon': { color: 'inherit' } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface OutbidBadgeProps {
  isVisible: boolean;
}

export function OutbidBadge({ isVisible }: OutbidBadgeProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={springTransition}
        >
          <Chip
            icon={<CloseCircleOutlined style={{ color: 'inherit' }} />}
            label="Outbid!"
            color="error"
            size="small"
            sx={{ fontWeight: 600, '& .MuiChip-icon': { color: 'inherit' } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BidCountBadgeProps {
  totalBidCount: number;
}

export function BidCountBadge({ totalBidCount }: BidCountBadgeProps) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: 1, bgcolor: 'grey.100' }}>
      <Typography variant="caption" color="text.secondary">
        {totalBidCount} bid{totalBidCount !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
}

interface AuctionEndedBadgeProps {
  winnerUsername: string | null;
}

export function AuctionEndedBadge({ winnerUsername }: AuctionEndedBadgeProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Chip
        label={winnerUsername ? `Won by ${winnerUsername}` : 'No Winner'}
        color={winnerUsername ? 'primary' : 'default'}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    </motion.div>
  );
}
