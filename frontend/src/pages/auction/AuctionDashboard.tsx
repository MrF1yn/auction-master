// Main dashboard displaying live auctions with real-time updates

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import PlusOutlined from '@ant-design/icons/PlusOutlined';

import MainCard from 'components/MainCard';
import AuctionCard from 'components/auction/AuctionCard';
import CreateAuctionModal from 'components/auction/CreateAuctionModal';
import useAuctionStore, { AuctionItemState } from 'store/auctionStore';
import useSocketConnection from 'hooks/useSocketConnection';
import axios from 'utils/axios';

export default function AuctionDashboard() {
  const {
    allAuctionItems,
    isLoadingAuctionItems,
    auctionItemsLoadError,
    socketConnectionState,
    timeSyncState,
    setAllAuctionItems,
    setIsLoadingAuctionItems,
    setAuctionItemsLoadError
  } = useAuctionStore();

  const { joinAuctionRoom } = useSocketConnection();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchAuctionItems = useCallback(async () => {
    setIsLoadingAuctionItems(true);
    setAuctionItemsLoadError(null);

    try {
      const response = await axios.get('/api/auction-items');
      if (response.data.success) {
        setAllAuctionItems(response.data.data.auctionItems);
      } else {
        setAuctionItemsLoadError('Failed to load auction items');
      }
    } catch (error: unknown) {
      setAuctionItemsLoadError(error instanceof Error ? error.message : 'Failed to load auction items');
    } finally {
      setIsLoadingAuctionItems(false);
    }
  }, [setAllAuctionItems, setIsLoadingAuctionItems, setAuctionItemsLoadError]);

  useEffect(() => {
    fetchAuctionItems();
  }, [fetchAuctionItems]);

  useEffect(() => {
    if (allAuctionItems.length > 0 && socketConnectionState.isConnected) {
      allAuctionItems.forEach((item) => joinAuctionRoom(item.id));
    }
  }, [allAuctionItems, socketConnectionState.isConnected, joinAuctionRoom]);

  return (
    <>
      <MainCard
        title={
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h4">Live Auctions</Typography>
              <ConnectionStatus isConnected={socketConnectionState.isConnected} isTimeSynced={timeSyncState.isTimeSynced} />
            </Stack>
            <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)} sx={{ minWidth: 160 }}>
              Create Auction
            </Button>
          </Stack>
        }
      >
        <Box sx={{ p: 1 }}>
          {isLoadingAuctionItems && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={48} />
            </Box>
          )}

          {auctionItemsLoadError && !isLoadingAuctionItems && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {auctionItemsLoadError}
            </Alert>
          )}

          {!isLoadingAuctionItems && !auctionItemsLoadError && allAuctionItems.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" color="text.secondary">
                No active auctions at the moment
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Be the first to create an auction!
              </Typography>
              <Button variant="outlined" startIcon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)} size="large">
                Create Your First Auction
              </Button>
            </Box>
          )}

          {!isLoadingAuctionItems && !auctionItemsLoadError && allAuctionItems.length > 0 && (
            <Grid container spacing={3}>
              {allAuctionItems.map((item: AuctionItemState) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <AuctionCard auctionItem={item} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </MainCard>

      <CreateAuctionModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchAuctionItems} />
    </>
  );
}

// Connection status indicator
function ConnectionStatus({ isConnected, isTimeSynced }: { isConnected: boolean; isTimeSynced: boolean }) {
  if (!isConnected) return <Chip size="small" label="Connecting..." color="warning" sx={{ fontSize: '0.75rem' }} />;
  if (!isTimeSynced) return <Chip size="small" label="Syncing..." color="info" sx={{ fontSize: '0.75rem' }} />;
  return <Chip size="small" label="Live" color="success" sx={{ fontSize: '0.75rem' }} />;
}
