// Modal form for creating new auction items

import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import axios from 'utils/axios';
import CloseOutlined from '@ant-design/icons/CloseOutlined';

interface CreateAuctionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATION_OPTIONS = [
  { value: 0.167, label: '10 seconds (testing)' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 180, label: '3 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '24 hours' },
  { value: 4320, label: '3 days' },
  { value: 10080, label: '7 days' }
];

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  startingPrice: '',
  minimumBidIncrement: '1.00',
  durationInMinutes: 60,
  imageUrl: ''
};

export default function CreateAuctionModal({ open, onClose, onSuccess }: CreateAuctionModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDurationChange = (event: any) => {
    setFormData((prev) => ({ ...prev, durationInMinutes: event.target.value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    const price = parseFloat(formData.startingPrice);
    if (isNaN(price) || price < 0.01) {
      newErrors.startingPrice = 'Starting price must be at least $0.01';
    }

    const increment = parseFloat(formData.minimumBidIncrement);
    if (isNaN(increment) || increment < 0.01) {
      newErrors.minimumBidIncrement = 'Minimum increment must be at least $0.01';
    }

    if (formData.imageUrl && formData.imageUrl.trim() !== '') {
      try {
        new URL(formData.imageUrl);
      } catch {
        newErrors.imageUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await axios.post('/api/auction-items', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startingPrice: parseFloat(formData.startingPrice),
        minimumBidIncrement: parseFloat(formData.minimumBidIncrement),
        durationInMinutes: formData.durationInMinutes,
        imageUrl: formData.imageUrl.trim() || null
      });

      if (response.data.success) {
        setFormData(INITIAL_FORM_STATE);
        onSuccess();
        onClose();
      } else {
        setSubmitError(response.data.errorMessage || 'Failed to create auction');
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.errorMessage || error.message || 'Failed to create auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Create New Auction</Typography>
          <IconButton onClick={handleClose} disabled={isSubmitting}>
            <CloseOutlined />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Item Title"
            placeholder="e.g., Vintage Watch Collection"
            value={formData.title}
            onChange={handleChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
          />

          <TextField
            label="Description"
            placeholder="Describe your item in detail..."
            value={formData.description}
            onChange={handleChange('description')}
            error={!!errors.description}
            helperText={errors.description}
            fullWidth
            required
            multiline
            rows={3}
          />

          <TextField
            label="Starting Price"
            placeholder="0.00"
            value={formData.startingPrice}
            onChange={handleChange('startingPrice')}
            error={!!errors.startingPrice}
            helperText={errors.startingPrice}
            fullWidth
            required
            type="number"
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          <TextField
            label="Minimum Bid Increment"
            placeholder="1.00"
            value={formData.minimumBidIncrement}
            onChange={handleChange('minimumBidIncrement')}
            error={!!errors.minimumBidIncrement}
            helperText={errors.minimumBidIncrement || 'Minimum amount each bid must increase by'}
            fullWidth
            type="number"
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          <FormControl fullWidth>
            <InputLabel>Auction Duration</InputLabel>
            <Select value={formData.durationInMinutes} label="Auction Duration" onChange={handleDurationChange}>
              {DURATION_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>How long the auction will run</FormHelperText>
          </FormControl>

          <TextField
            label="Image URL (Optional)"
            placeholder="https://example.com/image.jpg"
            value={formData.imageUrl}
            onChange={handleChange('imageUrl')}
            error={!!errors.imageUrl}
            helperText={errors.imageUrl || 'Leave empty to use a random sample image'}
            fullWidth
          />

          {formData.imageUrl && !errors.imageUrl && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Image Preview:
              </Typography>
              <Box
                component="img"
                src={formData.imageUrl}
                alt="Preview"
                sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 1, objectFit: 'cover' }}
                onError={(e: any) => {
                  e.target.style.display = 'none';
                  setErrors((prev) => ({ ...prev, imageUrl: 'Unable to load image from URL' }));
                }}
              />
            </Box>
          )}

          {submitError && (
            <FormHelperText error sx={{ fontSize: '0.875rem' }}>
              {submitError}
            </FormHelperText>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleClose} disabled={isSubmitting} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting} sx={{ minWidth: 120 }}>
          {isSubmitting ? 'Creating...' : 'Create Auction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
