import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, TextField, Button, Box, Select, MenuItem } from '@mui/material';
import { ethers } from 'ethers';
import { NETWORKS, ERROR_MESSAGES, SUCCESS_MESSAGES, ABI_FRAGMENTS } from '../utils/constants';
import { useProvider } from '../hooks/useProvider';

const Swap = () => {
    const { provider } = useProvider();
    const [state, setState] = useState({
        tokenIn: '',
        tokenOut: '',
        amountIn: '',
        amountOut: '0',
        loading: false,
        error: null
    });

    const swapContract = new ethers.Contract(
        NETWORKS.DEFI_ORACLE_META_MAINNET.contracts.stablecoinSwap,
        ABI_FRAGMENTS.SWAP,
        provider
    );

    const handleSwap = async () => {
        try {
            if (!state.tokenIn || !state.tokenOut || !state.amountIn) {
                throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
            }

            setState(prev => ({ ...prev, loading: true, error: null }));
            
            const signer = provider.getSigner();
            const tokenContract = new ethers.Contract(
                state.tokenIn,
                ABI_FRAGMENTS.ERC20,
                signer
            );

            // Approve tokens
            const tx1 = await tokenContract.approve(
                NETWORKS.DEFI_ORACLE_META_MAINNET.contracts.stablecoinSwap,
                ethers.utils.parseUnits(state.amountIn, 18)
            );
            await tx1.wait();

            // Execute swap
            const swapWithSigner = swapContract.connect(signer);
            const tx2 = await swapWithSigner.swap(
                state.tokenIn,
                state.tokenOut,
                ethers.utils.parseUnits(state.amountIn, 18),
                { gasLimit: NETWORKS.DEFI_ORACLE_META_MAINNET.gasLimit.swap.swap }
            );
            await tx2.wait();

            setState(prev => ({
                ...prev,
                loading: false,
                amountIn: '',
                amountOut: '0'
            }));
            
            alert(SUCCESS_MESSAGES.SWAP);
        } catch (error) {
            console.error('Swap failed:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || ERROR_MESSAGES.TRANSACTION_FAILED
            }));
        }
    };

    const renderTokenOptions = () => {
        return Object.entries(NETWORKS.DEFI_ORACLE_META_MAINNET.tokens).map(([symbol, address]) => (
            <MenuItem key={address} value={address}>
                {symbol}
            </MenuItem>
        ));
    };

    if (!provider) {
        return (
            <Container>
                <Typography variant="h6">
                    Please connect your wallet to access swap functionality
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Swap Stablecoins
            </Typography>
            
            <Paper sx={{ p: 3 }}>
                {state.error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {state.error}
                    </Typography>
                )}
                
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Select
                            fullWidth
                            value={state.tokenIn}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                tokenIn: e.target.value
                            }))}
                            disabled={state.loading}
                        >
                            <MenuItem value="">Select token to swap from</MenuItem>
                            {renderTokenOptions()}
                        </Select>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Amount"
                            value={state.amountIn}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                amountIn: e.target.value
                            }))}
                            disabled={state.loading}
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Select
                            fullWidth
                            value={state.tokenOut}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                tokenOut: e.target.value
                            }))}
                            disabled={state.loading}
                        >
                            <MenuItem value="">Select token to receive</MenuItem>
                            {renderTokenOptions()}
                        </Select>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={handleSwap}
                            disabled={
                                state.loading ||
                                !state.tokenIn ||
                                !state.tokenOut ||
                                !state.amountIn
                            }
                        >
                            {state.loading ? 'Processing...' : 'Swap'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default Swap; 