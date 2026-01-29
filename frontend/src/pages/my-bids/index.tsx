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
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';

interface UserBid {
  bidId: string;
  bidAmountInDollars: number;
  placedAtTimestamp: string;
  wasBidSuccessful: boolean;
  auctionItem: {
    id: string;
    itemTitle: string;
    itemDescription: string;
    itemImageUrl: string | null;
    currentHighestBidInDollars: number;
    auctionEndTimeTimestamp: string;
    currentStatus: string;
  };
  isHighestBidder: boolean;
  isWinner: boolean;
}

export default function MyBidsPage() {
  const [bids, setBids] = useState<UserBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBids();
  }, []);

  const fetchUserBids = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/my-bids');
      if (response.data.success) {
        setBids(response.data.data.bids);
      } else {
        setError(response.data.errorMessage || 'Failed to fetch bids');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (bid: UserBid) => {
    if (bid.isWinner) {
      return <Chip icon={<TrophyOutlined />} label="Won" color="success" size="small" />;
    }
    if (bid.auctionItem.currentStatus === 'ENDED') {
      return <Chip icon={<CloseCircleOutlined />} label="Lost" color="error" size="small" />;
    }
    if (bid.isHighestBidder) {
      return <Chip icon={<TrophyOutlined />} label="Winning" color="success" size="small" variant="outlined" />;
    }
    return <Chip icon={<ClockCircleOutlined />} label="Outbid" color="warning" size="small" />;
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
      <MainCard title="My Bids">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="My Bids">
        <Alert severity="error">{error}</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="My Bids">
      {bids.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            You haven't placed any bids yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start bidding on live auctions to see your bids here
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {bids.map((bid) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bid.bidId}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: 1,
                  borderColor: bid.isWinner ? 'success.main' : bid.isHighestBidder ? 'success.light' : 'divider'
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={bid.auctionItem.itemImageUrl || '/assets/images/auction-placeholder.png'}
                  alt={bid.auctionItem.itemTitle}
                  sx={{
                    objectFit: 'cover',
                    filter: bid.auctionItem.currentStatus === 'ENDED' && !bid.isWinner ? 'grayscale(50%)' : 'none'
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 1 }} noWrap>
                      {bid.auctionItem.itemTitle}
                    </Typography>
                    {getStatusChip(bid)}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {bid.auctionItem.itemDescription.slice(0, 80)}...
                  </Typography>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Your Bid:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${bid.bidAmountInDollars.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Bid:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        ${bid.auctionItem.currentHighestBidInDollars.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Bid Placed:
                      </Typography>
                      <Typography variant="caption">{formatDate(bid.placedAtTimestamp)}</Typography>
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
