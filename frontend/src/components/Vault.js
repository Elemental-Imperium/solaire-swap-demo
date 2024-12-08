import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
    NETWORKS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    UI_CONSTANTS,
    ABI_FRAGMENTS
} from '../utils/constants';

const Vault = ({ contractAddress, priceFeedAddress, provider }) => {
    const [state, setState] = useState({
        ethPrice: "0",
        stablecoinAmount: "",
        selectedStablecoin: "",
        ethRequired: "0",
        userDeposit: "0",
        depositAmount: "1", // Default deposit amount in ETH
        loading: false,
        error: null
    });

    const vaultContract = new ethers.Contract(
        contractAddress,
        [
            ...ABI_FRAGMENTS.VAULT,
            "function deposits(address) view returns (uint256)",
            "function deposit() payable",
            "function getEthRequiredForStablecoins(uint256) view returns (uint256)"
        ],
        provider
    );

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, UI_CONSTANTS.REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [vaultContract]);

    const fetchData = async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            
            const [price, userDeposit] = await Promise.all([
                vaultContract.getEthPrice(),
                vaultContract.deposits(await provider.getSigner().getAddress())
            ]);

            setState(prev => ({
                ...prev,
                ethPrice: ethers.utils.formatUnits(price, 18),
                userDeposit: ethers.utils.formatEther(userDeposit),
                loading: false
            }));
        } catch (error) {
            console.error("Data fetch failed:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: ERROR_MESSAGES.CONTRACT_INTERACTION
            }));
        }
    };

    const calculateEthRequired = async (amount) => {
        if (!amount || isNaN(amount)) {
          return;
        }
        
        try {
            const ethRequired = await vaultContract.getEthRequiredForStablecoins(
                ethers.utils.parseUnits(amount, 18)
            );
            setState(prev => ({
                ...prev,
                ethRequired: ethers.utils.formatEther(ethRequired)
            }));
        } catch (error) {
            console.error("Failed to calculate ETH required:", error);
        }
    };

    const handleDeposit = async () => {
        try {
            if (!state.depositAmount || isNaN(state.depositAmount)) {
                throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
            }

            setState(prev => ({ ...prev, loading: true, error: null }));
            
            const signer = provider.getSigner();
            const contractWithSigner = vaultContract.connect(signer);

            const tx = await contractWithSigner.deposit({
                value: ethers.utils.parseEther(state.depositAmount),
                gasLimit: NETWORKS.DEFI_ORACLE_META_MAINNET.gasLimit.vault.deposit
            });
            
            await tx.wait(NETWORKS.DEFI_ORACLE_META_MAINNET.confirmations);
            
            setState(prev => ({
                ...prev,
                loading: false,
                depositAmount: "1" // Reset to default
            }));
            
            await fetchData(); // Refresh data
            alert(SUCCESS_MESSAGES.DEPOSIT);
        } catch (error) {
            console.error("Deposit failed:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || ERROR_MESSAGES.TRANSACTION_FAILED
            }));
        }
    };

    const handleStablecoinAmountChange = (e) => {
        const amount = e.target.value;
        if (amount && amount.length > UI_CONSTANTS.MAX_DECIMALS) {
          return;
        }
        
        setState(prev => ({ ...prev, stablecoinAmount: amount }));
        calculateEthRequired(amount);
    };

    const handleWithdraw = async () => {
        try {
            if (!state.stablecoinAmount || !state.selectedStablecoin) {
                throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
            }

            setState(prev => ({ ...prev, loading: true, error: null }));
            
            const signer = provider.getSigner();
            const contractWithSigner = vaultContract.connect(signer);

            const amount = ethers.utils.parseUnits(state.stablecoinAmount, 18);
            const tx = await contractWithSigner.withdrawStable(
                amount,
                state.selectedStablecoin,
                {
                    gasLimit: NETWORKS.DEFI_ORACLE_META_MAINNET.gasLimit.vault.withdraw
                }
            );
            
            await tx.wait(NETWORKS.DEFI_ORACLE_META_MAINNET.confirmations);
            
            setState(prev => ({
                ...prev,
                loading: false,
                stablecoinAmount: "",
                selectedStablecoin: ""
            }));
            
            alert(SUCCESS_MESSAGES.WITHDRAW);
        } catch (error) {
            console.error("Withdrawal failed:", error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || ERROR_MESSAGES.TRANSACTION_FAILED
            }));
        }
    };

    const renderStablecoinOptions = () => {
        return Object.entries(NETWORKS.DEFI_ORACLE_META_MAINNET.tokens).map(([symbol, address]) => (
            <option key={address} value={address}>
                {symbol}
            </option>
        ));
    };

    return (
        <div className="vault-container">
            <h2>Vault</h2>
            
            {state.error && (
                <div className="error-message">
                    {state.error}
                </div>
            )}
            
            <div className="price-section">
                <p>ETH Price (USD): ${parseFloat(state.ethPrice).toFixed(2)}</p>
                <p>Your Deposit: {parseFloat(state.userDeposit).toFixed(4)} ETH</p>
                {state.ethRequired !== "0" && (
                    <p>ETH Required for Withdrawal: {parseFloat(state.ethRequired).toFixed(4)} ETH</p>
                )}
            </div>

            <div className="deposit-section">
                <input
                    type="number"
                    placeholder="ETH amount to deposit"
                    value={state.depositAmount}
                    onChange={(e) => setState(prev => ({
                        ...prev,
                        depositAmount: e.target.value
                    }))}
                    disabled={state.loading}
                    min="0.01"
                    step="0.01"
                />
                <button
                    onClick={handleDeposit}
                    disabled={state.loading || !state.depositAmount || isNaN(state.depositAmount)}
                >
                    {state.loading ? "Processing..." : "Deposit ETH"}
                </button>
            </div>

            <div className="withdraw-section">
                <input
                    type="number"
                    placeholder="Stablecoin amount"
                    value={state.stablecoinAmount}
                    onChange={handleStablecoinAmountChange}
                    disabled={state.loading}
                    min={UI_CONSTANTS.MIN_AMOUNT}
                    step="0.000001"
                />
                
                <select
                    value={state.selectedStablecoin}
                    onChange={(e) => setState(prev => ({
                        ...prev,
                        selectedStablecoin: e.target.value
                    }))}
                    disabled={state.loading}
                >
                    <option value="">Select Stablecoin</option>
                    {renderStablecoinOptions()}
                </select>
                
                <button
                    onClick={handleWithdraw}
                    disabled={
                        state.loading || 
                        !state.stablecoinAmount || 
                        !state.selectedStablecoin ||
                        parseFloat(state.ethRequired) > parseFloat(state.userDeposit)
                    }
                >
                    {state.loading ? "Processing..." : "Withdraw Stablecoins"}
                </button>
            </div>
        </div>
    );
};

export default Vault; 