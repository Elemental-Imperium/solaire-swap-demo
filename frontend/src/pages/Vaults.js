import React from 'react';
import { Container, Grid, Typography } from '@mui/material';
import Vault from '../components/Vault';
import { NETWORKS } from '../utils/constants';
import { useProvider } from '../hooks/useProvider';

const Vaults = () => {
    const { provider } = useProvider();

    if (!provider) {
        return (
            <Container>
                <Typography variant="h6">
                    Please connect your wallet to access vaults
                </Typography>
            </Container>
        );
    }

    return (
        <Container>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Yield Generating Vaults
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Vault
                        contractAddress={NETWORKS.DEFI_ORACLE_META_MAINNET.contracts.vault}
                        priceFeedAddress={NETWORKS.DEFI_ORACLE_META_MAINNET.contracts.ethUsdPriceFeed}
                        provider={provider}
                    />
                </Grid>
            </Grid>
        </Container>
    );
};

export default Vaults; 