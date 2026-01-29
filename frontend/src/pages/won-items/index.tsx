import { useState, useEffect } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// project imports
import MainCard from 'components/MainCard';
import axios from 'utils/axios';

// assets
import TrophyOutlined from '@ant-design/icons/TrophyOutlined';

interface WonItem {
  id: string;
  itemTitle: string;
  itemDescription: string;
  itemImageUrl: string | null;
  winningBidAmountInDollars: number;
  auctionEndTimeTimestamp: string;
  wonAtTimestamp: string;
}

export default function WonItemsPage() {
  const [wonItems, setWonItems] = useState<WonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWonItems();
  }, []);

  const fetchWonItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/won-items');
      if (response.data.success) {
        setWonItems(response.data.data.wonItems);
      } else {
        setError(response.data.errorMessage || 'Failed to fetch won items');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch won items');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <MainCard title="Won Items">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Won Items">
        <Alert severity="error">{error}</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Won Items">
      {wonItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TrophyOutlined style={{ fontSize: 48, color: '#bbb', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">
            No won items yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Win auctions to see your items here
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wonItems.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: 2,
                  borderColor: 'success.main',
                  position: 'relative'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1
                  }}
                >
                  <Chip icon={<TrophyOutlined />} label="Won" color="success" size="small" />
                </Box>
                <CardMedia
                  component="img"
                  height="180"
                  image={item.itemImageUrl || '/assets/images/auction-placeholder.png'}
                  alt={item.itemTitle}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                    {item.itemTitle}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {item.itemDescription}
                  </Typography>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Winning Bid:
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        ${item.winningBidAmountInDollars.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Won on:
                      </Typography>
                      <Typography variant="caption">{formatDate(item.wonAtTimestamp)}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </MainCard>
  );
}
