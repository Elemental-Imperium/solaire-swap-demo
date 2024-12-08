import { useState, useCallback, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import { NETWORKS } from '../utils/constants';

const providerOptions = {
    // Add provider options here
};

const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
});

export function useWeb3Modal() {
    const [provider, setProvider] = useState(null);
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const connectWallet = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const instance = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(instance);
            const accounts = await provider.listAccounts();
            const network = await provider.getNetwork();

            setProvider(provider);
            setAccount(accounts[0]);
            setChainId(network.chainId);

            // Setup listeners
            instance.on("accountsChanged", handleAccountsChanged);
            instance.on("chainChanged", handleChainChanged);
            instance.on("disconnect", handleDisconnect);

        } catch (error) {
            console.error("Connection error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const disconnectWallet = useCallback(async () => {
        try {
            await web3Modal.clearCachedProvider();
            setProvider(null);
            setAccount(null);
            setChainId(null);
        } catch (error) {
            console.error("Disconnect error:", error);
            setError(error.message);
        }
    }, []);

    const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
        } else {
            disconnectWallet();
        }
    };

    const handleChainChanged = (chainId) => {
        window.location.reload();
    };

    const handleDisconnect = () => {
        disconnectWallet();
    };

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            connectWallet();
        }
    }, [connectWallet]);

    return {
        provider,
        account,
        chainId,
        error,
        loading,
        connectWallet,
        disconnectWallet
    };
} 