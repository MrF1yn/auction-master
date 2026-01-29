// material-ui
import { useColorScheme, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// project imports
import { ThemeMode } from 'config';

// assets
import GavelIcon from '@ant-design/icons/ThunderboltFilled';

// ==============================|| LOGO SVG ||============================== //

export default function LogoMain({ reverse }: { reverse?: boolean }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();

  const textColor = colorScheme === ThemeMode.DARK || reverse ? theme.vars.palette.common.white : theme.vars.palette.common.black;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Gavel/Auction hammer icon */}
        <circle cx="20" cy="20" r="18" fill={theme.vars.palette.primary.main} />
        <path
          d="M12 28L16 24M16 24L24 16M16 24L14 26M24 16L28 12M24 16L22 14M28 12L26 10M28 12L30 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="10" y="29" width="10" height="3" rx="1" fill="white" />
      </svg>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: textColor,
          letterSpacing: '-0.5px'
        }}
      >
        Live<span style={{ color: theme.vars.palette.primary.main }}>Bid</span>
      </Typography>
    </Stack>
  );
}
