import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loading = () => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
        </Box>
    );
};

export default Loading; 