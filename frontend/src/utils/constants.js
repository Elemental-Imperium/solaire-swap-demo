export const NETWORKS = {
    DEFI_ORACLE_META_MAINNET: {
        name: "Defi Oracle Meta Mainnet",
        rpcUrl: "http://102.133.148.122:8545",
        chainId: 138,
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18
        },
        explorerUrl: "http://102.133.148.122:26000/",
        contracts: {
            vault: process.env.VITE_VAULT_ADDRESS,
            stablecoinSwap: process.env.VITE_SWAP_ADDRESS,
            ethUsdPriceFeed: process.env.VITE_PRICE_FEED_ADDRESS
        },
        tokens: {
            USDC: process.env.VITE_USDC_ADDRESS,
            USDT: process.env.VITE_USDT_ADDRESS,
            DAI: process.env.VITE_DAI_ADDRESS
        },
        defaultStablecoin: "0x...", // Set default stablecoin address (e.g., USDC)
        blockTime: 2, // Average block time in seconds
        confirmations: 1, // Number of confirmations needed
        gasLimit: {
            vault: {
                deposit: 250000,
                withdraw: 300000
            },
            swap: {
                approve: 100000,
                swap: 200000
            }
        }
    },
    // Add other networks as needed (e.g., testnet)
};

export const DEFAULT_NETWORK = NETWORKS.DEFI_ORACLE_META_MAINNET;

export const TRANSACTION_TYPES = {
    DEPOSIT: 'DEPOSIT',
    WITHDRAW: 'WITHDRAW',
    SWAP: 'SWAP',
    APPROVE: 'APPROVE'
};

export const ERROR_MESSAGES = {
    WALLET_CONNECTION: "Failed to connect wallet. Please try again.",
    NETWORK_SWITCH: "Failed to switch network. Please try manually.",
    TRANSACTION_FAILED: "Transaction failed. Please try again.",
    INSUFFICIENT_BALANCE: "Insufficient balance for this transaction.",
    INVALID_AMOUNT: "Please enter a valid amount.",
    CONTRACT_INTERACTION: "Failed to interact with the contract."
};

export const SUCCESS_MESSAGES = {
    DEPOSIT: "Successfully deposited funds",
    WITHDRAW: "Successfully withdrawn funds",
    SWAP: "Successfully swapped tokens",
    APPROVE: "Successfully approved token"
};

// Gas price settings
export const GAS_SETTINGS = {
    DEFAULT_GAS_LIMIT: 200000,
    GAS_PRICE_MULTIPLIER: 1.1, // 10% buffer on gas price
    MAX_GAS_PRICE: ethers.utils.parseUnits("100", "gwei") // Maximum gas price willing to pay
};

// UI Constants
export const UI_CONSTANTS = {
    MIN_AMOUNT: "0.000001",
    MAX_DECIMALS: 6,
    REFRESH_INTERVAL: 15000, // 15 seconds
    TRANSACTION_TIMEOUT: 60000 // 1 minute
};

// ABI fragments for common interactions
export const ABI_FRAGMENTS = {
    ERC20: [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)"
    ],
    VAULT: [
        "function deposit() payable",
        "function withdrawStable(uint256 amount, address stablecoin)",
        "function getEthPrice() view returns (uint256)",
        "function getPricePerShare() view returns (uint256)"
    ],
    SWAP: [
        "function swap(address tokenIn, address tokenOut, uint256 amountIn) returns (uint256)",
        "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
        "function supportedTokens(address) view returns (bool)"
    ]
}; 