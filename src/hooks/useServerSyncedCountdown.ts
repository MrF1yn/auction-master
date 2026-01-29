// Server-synced countdown hook for accurate auction timers

import { useState, useEffect, useCallback, useRef } from 'react';
import useAuctionStore from 'store/auctionStore';

interface CountdownValues {
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalMillisecondsRemaining: number;
  isAuctionEnded: boolean;
  isAuctionEndingSoon: boolean;
  isAuctionCritical: boolean;
}

const MS = { SECOND: 1000, MINUTE: 60000, HOUR: 3600000, DAY: 86400000 };
const THRESHOLDS = { ENDING_SOON: 5 * MS.MINUTE, CRITICAL: MS.MINUTE };

export function useServerSyncedCountdown(auctionEndTimeISOString: string): CountdownValues {
  const { timeSyncState, getServerSyncedCurrentTimeInMs } = useAuctionStore();

  const [countdownValues, setCountdownValues] = useState<CountdownValues>({
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    secondsRemaining: 0,
    totalMillisecondsRemaining: 0,
    isAuctionEnded: false,
    isAuctionEndingSoon: false,
    isAuctionCritical: false
  });

  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const calculateCountdown = useCallback((): CountdownValues => {
    const endTime = new Date(auctionEndTimeISOString).getTime();
    const currentTime = getServerSyncedCurrentTimeInMs();
    const remaining = Math.max(0, endTime - currentTime);

    if (remaining <= 0) {
      return {
        daysRemaining: 0,
        hoursRemaining: 0,
        minutesRemaining: 0,
        secondsRemaining: 0,
        totalMillisecondsRemaining: 0,
        isAuctionEnded: true,
        isAuctionEndingSoon: false,
        isAuctionCritical: false
      };
    }

    return {
      daysRemaining: Math.floor(remaining / MS.DAY),
      hoursRemaining: Math.floor((remaining % MS.DAY) / MS.HOUR),
      minutesRemaining: Math.floor((remaining % MS.HOUR) / MS.MINUTE),
      secondsRemaining: Math.floor((remaining % MS.MINUTE) / MS.SECOND),
      totalMillisecondsRemaining: remaining,
      isAuctionEnded: false,
      isAuctionEndingSoon: remaining <= THRESHOLDS.ENDING_SOON,
      isAuctionCritical: remaining <= THRESHOLDS.CRITICAL
    };
  }, [auctionEndTimeISOString, getServerSyncedCurrentTimeInMs]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();

      if (now - lastUpdateRef.current >= 100) {
        const newValues = calculateCountdown();
        setCountdownValues(newValues);
        lastUpdateRef.current = now;
      }

      if (!countdownValues.isAuctionEnded) {
        rafIdRef.current = requestAnimationFrame(updateCountdown);
      }
    };

    rafIdRef.current = requestAnimationFrame(updateCountdown);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [calculateCountdown, countdownValues.isAuctionEnded, timeSyncState.isTimeSynced]);

  return countdownValues;
}

export function formatCountdownString(countdown: CountdownValues): string {
  if (countdown.isAuctionEnded) return 'Ended';

  const parts: string[] = [];
  if (countdown.daysRemaining > 0) parts.push(`${countdown.daysRemaining}d`);
  if (countdown.hoursRemaining > 0 || countdown.daysRemaining > 0) parts.push(`${countdown.hoursRemaining}h`);
  if (countdown.minutesRemaining > 0 || countdown.hoursRemaining > 0 || countdown.daysRemaining > 0)
    parts.push(`${countdown.minutesRemaining}m`);
  parts.push(`${countdown.secondsRemaining}s`);

  return parts.join(' ');
}

export function formatFullCountdownString(countdown: CountdownValues): string {
  if (countdown.isAuctionEnded) return 'Auction Ended';

  const parts: string[] = [];
  if (countdown.daysRemaining > 0) parts.push(`${countdown.daysRemaining} day${countdown.daysRemaining !== 1 ? 's' : ''}`);
  if (countdown.hoursRemaining > 0) parts.push(`${countdown.hoursRemaining} hour${countdown.hoursRemaining !== 1 ? 's' : ''}`);
  if (countdown.minutesRemaining > 0) parts.push(`${countdown.minutesRemaining} minute${countdown.minutesRemaining !== 1 ? 's' : ''}`);
  if (countdown.secondsRemaining > 0 || parts.length === 0)
    parts.push(`${countdown.secondsRemaining} second${countdown.secondsRemaining !== 1 ? 's' : ''}`);

  return parts.join(', ');
}

export default useServerSyncedCountdown;
