import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import Wallet from './Wallet';

const Navbar = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{
                        flexGrow: 1,
                        textDecoration: 'none',
                        color: 'inherit'
                    }}
                >
                    SolaireSwap
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        color="inherit"
                        component={Link}
                        to="/swap"
                    >
                        Swap
                    </Button>
                    <Button
                        color="inherit"
                        component={Link}
                        to="/vaults"
                    >
                        Vaults
                    </Button>
                    <Wallet />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 