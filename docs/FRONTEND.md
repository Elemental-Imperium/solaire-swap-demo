# Frontend Architecture

## Overview

The frontend is built with React and uses the following key technologies:

- Vite for build tooling
- Material-UI for components
- ethers.js for blockchain interaction
- Web3Modal for wallet connection

## Key Components

### Vault.js
Handles ETH deposits and stablecoin withdrawals.

### Swap.js
Manages stablecoin swapping interface.

### Wallet.js
Handles wallet connection and network switching.

## State Management

State is managed using React hooks and context:

- useProvider: Manages Web3 provider state
- useTokenBalance: Tracks token balances
- useError: Centralizes error handling

## Network Handling

The application supports multiple networks:

1. Local Development
2. Defi Oracle Meta Mainnet
3. Test Networks

## Styling

- Material-UI theming
- CSS modules for component-specific styles
- Dark/Light theme support

## Testing

Run tests: 