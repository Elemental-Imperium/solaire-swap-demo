import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useToast } from '../hooks/useToast';

const Toast = () => {
  const { toast, hideToast } = useToast();

  return (
    <Snackbar
      open={toast.open}
      autoHideDuration={6000}
      onClose={hideToast}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={hideToast}
        severity={toast.type}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
};

export default Toast; 