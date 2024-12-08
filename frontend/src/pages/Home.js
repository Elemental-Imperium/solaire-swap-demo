import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Welcome to SolaireSwap
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom>
                    A secure and efficient DeFi platform for stablecoin swaps and yield generation
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button
                        component={Link}
                        to="/swap"
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ mr: 2 }}
                    >
                        Start Swapping
                    </Button>
                    <Button
                        component={Link}
                        to="/vaults"
                        variant="outlined"
                        color="primary"
                        size="large"
                    >
                        Explore Vaults
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Home; 