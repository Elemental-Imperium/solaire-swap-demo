require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');
require('hardhat-gas-reporter');
require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    defiOracleMeta: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 138,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
}; 