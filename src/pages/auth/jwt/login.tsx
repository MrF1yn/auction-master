import { Link } from 'react-router-dom';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import useAuth from 'hooks/useAuth';
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthLogin from 'sections/auth/jwt/AuthLogin';

// ================================|| JWT - LOGIN ||================================ //

export default function Login() {
  const { isLoggedIn } = useAuth();

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">Welcome Back</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to access live auctions and place your bids
            </Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <AuthLogin isDemo={isLoggedIn} />
        </Grid>
        <Grid size={12}>
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Typography component={Link} to="/register" variant="body2" sx={{ textDecoration: 'none', fontWeight: 600 }} color="primary">
                Create Account
              </Typography>
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}
