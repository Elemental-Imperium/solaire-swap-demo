import { ethers } from 'ethers';
import { NETWORKS } from './constants';

export const switchNetwork = async (networkKey) => {
    const network = NETWORKS[networkKey];
    if (!network) {
      throw new Error('Invalid network key');
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.utils.hexValue(network.chainId) }]
        });
    } catch (error) {
        if (error.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: ethers.utils.hexValue(network.chainId),
                    chainName: network.name,
                    nativeCurrency: network.nativeCurrency,
                    rpcUrls: [network.rpcUrl],
                    blockExplorerUrls: [network.explorerUrl]
                }]
            });
        } else {
            throw error;
        }
    }
}; 