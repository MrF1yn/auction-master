import { Link } from 'react-router-dom';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import useAuth from 'hooks/useAuth';
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthRegister from 'sections/auth/jwt/AuthRegister';

// ================================|| JWT - REGISTER ||================================ //

export default function Register() {
  const { isLoggedIn } = useAuth();

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">Create Account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Join LiveBid and start bidding on exclusive items
            </Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <AuthRegister />
        </Grid>
        <Grid size={12}>
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Typography component={Link} to="/login" variant="body2" sx={{ textDecoration: 'none', fontWeight: 600 }} color="primary">
                Sign In
              </Typography>
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}
