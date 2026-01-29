import { useState, useEffect } from 'react';

// material-ui
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ==============================|| Backend Wakeup Loader ||============================== //

const loadingMessages = [
  'Waking up the backend...',
  'Stretching the servers...',
  'Brewing some coffee for the API...',
  'Warming up the engines...',
  'Almost there...',
  'Just a moment...',
  'Loading your experience...',
  'Connecting to services...',
  'Preparing the auction house...',
  'Setting up your dashboard...'
];

export default function BackendWakeupLoader() {
  const theme = useTheme();
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        setFadeIn(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2001,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Top progress bar */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
        <LinearProgress color="primary" />
      </Box>

      {/* Center content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        {/* Animated dots loader */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: `${i * 0.16}s`,
                '@keyframes bounce': {
                  '0%, 80%, 100%': {
                    transform: 'scale(0)',
                    opacity: 0.5
                  },
                  '40%': {
                    transform: 'scale(1)',
                    opacity: 1
                  }
                }
              }}
            />
          ))}
        </Box>

        {/* Animated text */}
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 400,
            opacity: fadeIn ? 1 : 0,
            transform: fadeIn ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            textAlign: 'center',
            px: 2
          }}
        >
          {loadingMessages[messageIndex]}
        </Typography>

        {/* Subtle hint */}
        <Typography
          variant="caption"
          sx={{
            color: alpha(theme.palette.text.secondary, 0.6),
            mt: 2,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 0.4
              },
              '50%': {
                opacity: 0.8
              }
            }
          }}
        >
          Free tier servers take a moment to spin up
        </Typography>
      </Box>
    </Box>
  );
}
