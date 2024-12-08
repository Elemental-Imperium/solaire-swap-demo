import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';

const TransactionConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  transaction,
}) => {
  const {
    type,
    amount,
    token,
    estimatedGas,
    slippage,
    priceImpact,
  } = transaction;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Transaction Details
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="textSecondary">Type</Typography>
            <Typography>{type}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="textSecondary">Amount</Typography>
            <Typography>{amount} {token}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="textSecondary">Estimated Gas</Typography>
            <Typography>{estimatedGas} ETH</Typography>
          </Box>
          {slippage && (
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography color="textSecondary">Slippage Tolerance</Typography>
              <Typography>{slippage}%</Typography>
            </Box>
          )}
          {priceImpact && (
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography color="textSecondary">Price Impact</Typography>
              <Typography color={priceImpact > 2 ? 'error' : 'inherit'}>
                {priceImpact}%
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionConfirmModal; 