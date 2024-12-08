import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ABI_FRAGMENTS } from '../utils/constants';

export const useTokenBalance = (tokenAddress, provider, account) => {
    const [balance, setBalance] = useState('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!tokenAddress || !provider || !account) {
              return;
            }
            
            try {
                setLoading(true);
                const contract = new ethers.Contract(
                    tokenAddress,
                    ABI_FRAGMENTS.ERC20,
                    provider
                );
                const balance = await contract.balanceOf(account);
                setBalance(ethers.utils.formatUnits(balance, 18));
            } catch (error) {
                console.error('Failed to fetch token balance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [tokenAddress, provider, account]);

    return { balance, loading };
}; 