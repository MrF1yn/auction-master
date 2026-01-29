// Server-synced countdown timer with color-coded urgency indicators

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import useServerSyncedCountdown, { formatCountdownString } from 'hooks/useServerSyncedCountdown';

interface CountdownTimerProps {
  auctionEndTimeISOString: string;
  variant?: 'compact' | 'full';
}

export default function CountdownTimer({ auctionEndTimeISOString, variant = 'compact' }: CountdownTimerProps) {
  const theme = useTheme();
  const countdown = useServerSyncedCountdown(auctionEndTimeISOString);

  const timerColor = useMemo(() => {
    if (countdown.isAuctionEnded) return theme.palette.grey[500];
    if (countdown.isAuctionCritical) return theme.palette.error.main;
    if (countdown.isAuctionEndingSoon) return theme.palette.warning.main;
    return theme.palette.success.main;
  }, [countdown.isAuctionEnded, countdown.isAuctionCritical, countdown.isAuctionEndingSoon, theme]);

  if (variant === 'full') {
    return (
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="popLayout">
          {!countdown.isAuctionEnded ? (
            <>
              {countdown.daysRemaining > 0 && <TimeUnit value={countdown.daysRemaining} label="Days" color={timerColor} />}
              <TimeUnit value={countdown.hoursRemaining} label="Hours" color={timerColor} />
              <TimeUnit value={countdown.minutesRemaining} label="Min" color={timerColor} />
              <TimeUnit value={countdown.secondsRemaining} label="Sec" color={timerColor} shouldPulse={countdown.isAuctionCritical} />
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
              <Typography variant="h5" sx={{ color: timerColor, fontWeight: 600 }}>
                Auction Ended
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      animate={countdown.isAuctionCritical ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 0.5 } } : {}}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 2,
        py: 1,
        borderRadius: 1,
        bgcolor: countdown.isAuctionEnded
          ? 'grey.200'
          : countdown.isAuctionCritical
            ? 'error.lighter'
            : countdown.isAuctionEndingSoon
              ? 'warning.lighter'
              : 'success.lighter'
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, color: timerColor, fontFamily: 'monospace', letterSpacing: 1 }}>
        {formatCountdownString(countdown)}
      </Typography>
    </Box>
  );
}

// Individual time unit display
interface TimeUnitProps {
  value: number;
  label: string;
  color: string;
  shouldPulse?: boolean;
}

function TimeUnit({ value, label, color, shouldPulse = false }: TimeUnitProps) {
  return (
    <Box
      component={motion.div}
      animate={shouldPulse ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.5 } } : {}}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 60,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: 1
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, color, fontFamily: 'monospace', lineHeight: 1.2 }}>
        {value.toString().padStart(2, '0')}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Box>
  );
}
