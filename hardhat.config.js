require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@typechain/hardhat");

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
    version: "0.8.19",
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
      url: process.env.MAINNET_RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID || "138"),
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : undefined,
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY
        }
      }
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