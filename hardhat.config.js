require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@typechain/hardhat");
const { ethers } = require("ethers");

// Suppress punycode deprecation warning - using userland module

// Private key handling
const getPrivateKey = () => {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    console.warn("Warning: PRIVATE_KEY not configured");
    return undefined;
  }
  // Remove '0x' prefix if present
  return pk.replace('0x', '');
};

const PRIVATE_KEY = getPrivateKey();

module.exports = {
  defaultNetwork: process.env.DEFAULT_NETWORK || "hardhat",
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 0
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    Defi_Oracle_Meta_Mainnet: {
      url: "https://rpc.defi-oracle.io",
      chainId: parseInt(process.env.CHAIN_ID || "138"),
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : undefined,
      gasPrice: "auto",
      timeout: 60000,
      provider: new ethers.providers.JsonRpcProvider("https://rpc.defi-oracle.io")
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: ["contracts/mocks/", "contracts/libraries/"]
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5"
  }
}; 