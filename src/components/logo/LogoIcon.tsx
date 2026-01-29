// material-ui
import { useTheme } from '@mui/material/styles';

// ==============================|| LOGO ICON SVG ||============================== //

export default function LogoIcon() {
  const theme = useTheme();

  return (
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
  );
}
