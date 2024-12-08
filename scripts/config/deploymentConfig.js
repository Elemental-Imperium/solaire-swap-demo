const config = {
    networks: {
        mainnet: {
            timelock: 172800, // 2 days in seconds
            roles: {
                admin: process.env.ADMIN_ADDRESS,
                upgrader: process.env.UPGRADER_ADDRESS,
                compliance: process.env.COMPLIANCE_ADDRESS,
                pauser: process.env.PAUSER_ADDRESS
            },
            stablecoins: [
                {
                    name: "USD Coin",
                    symbol: "USDC",
                    code: "USD",
                    decimals: 6
                },
                {
                    name: "Euro Stablecoin",
                    symbol: "EURS",
                    code: "EUR",
                    decimals: 2
                },
                // Add other stablecoins
            ],
            compliance: {
                kycLevels: {
                    basic: 1,
                    enhanced: 2,
                    full: 3
                },
                limits: {
                    basic: "10000000000", // $10,000
                    enhanced: "100000000000", // $100,000
                    full: "1000000000000" // $1,000,000
                }
            }
        }
    }
};

module.exports = config; 