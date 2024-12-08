import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

const LoadingOverlay = ({ open, message = 'Processing...' }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        gap: 2,
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
      <Box textAlign="center">
        <Typography variant="h6">{message}</Typography>
      </Box>
    </Backdrop>
  );
};

export default LoadingOverlay; 