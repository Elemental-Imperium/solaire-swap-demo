export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    explorerUrl: string;
    contracts: {
        vault: string;
        stablecoinSwap: string;
        ethUsdPriceFeed: string;
    };
    tokens: {
        [key: string]: string;
    };
    gasLimit: {
        vault: {
            deposit: number;
            withdraw: number;
        };
        swap: {
            approve: number;
            swap: number;
        };
    };
} 