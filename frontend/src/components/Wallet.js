import React, { useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { ethers } from 'ethers';
import { NETWORKS, ERROR_MESSAGES } from '../utils/constants';
import { switchNetwork } from '../utils/networks';

const Wallet = () => {
    const [state, setState] = useState({
        account: null,
        balance: null,
        chainId: null,
        loading: false,
        error: null
    });

    useEffect(() => {
        checkConnection();
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', checkConnection);
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', checkConnection);
            }
        };
    }, []);

    const checkConnection = async () => {
        try {
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const accounts = await provider.listAccounts();
                
                if (accounts.length > 0) {
                    const balance = await provider.getBalance(accounts[0]);
                    const network = await provider.getNetwork();
                    
                    setState(prev => ({
                        ...prev,
                        account: accounts[0],
                        balance: ethers.utils.formatEther(balance),
                        chainId: network.chainId
                    }));
                }
            }
        } catch (error) {
            console.error('Connection check failed:', error);
        }
    };

    const connectWallet = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            
            // Switch to the correct network if needed
            const network = await provider.getNetwork();
            if (network.chainId !== NETWORKS.DEFI_ORACLE_META_MAINNET.chainId) {
                await switchNetwork('DEFI_ORACLE_META_MAINNET');
            }
            
            await checkConnection();
            setState(prev => ({ ...prev, loading: false }));
        } catch (error) {
            console.error('Wallet connection failed:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || ERROR_MESSAGES.WALLET_CONNECTION
            }));
        }
    };

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <Box>
            {state.error && (
                <Typography color="error" variant="caption" sx={{ mr: 2 }}>
                    {state.error}
                </Typography>
            )}
            
            {state.account ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        {parseFloat(state.balance).toFixed(4)} ETH
                    </Typography>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                    >
                        {formatAddress(state.account)}
                    </Button>
                </Box>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={connectWallet}
                    disabled={state.loading}
                >
                    {state.loading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
            )}
        </Box>
    );
};

export default Wallet; 