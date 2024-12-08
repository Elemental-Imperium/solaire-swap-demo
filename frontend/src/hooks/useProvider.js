import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORKS } from '../utils/constants';

export const useProvider = () => {
    const [provider, setProvider] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initProvider = async () => {
            try {
                if (window.ethereum) {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    
                    // Request account access
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    
                    // Check network
                    const network = await provider.getNetwork();
                    if (network.chainId !== NETWORKS.DEFI_ORACLE_META_MAINNET.chainId) {
                        throw new Error('Please connect to the correct network');
                    }
                    
                    setProvider(provider);
                } else {
                    throw new Error('Please install MetaMask');
                }
            } catch (err) {
                setError(err.message);
            }
        };

        initProvider();
    }, []);

    return { provider, error };
}; 