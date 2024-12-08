#!/bin/bash

# Make scripts executable
chmod +x scripts/*.sh

# Fix dependencies
echo "Fixing dependencies..."
node scripts/fix-dependencies.js

# Install dependencies
echo "Installing dependencies..."
yarn install

# Clean Hardhat cache
echo "Cleaning Hardhat cache..."
yarn clean

# Compile contracts
echo "Compiling contracts..."
yarn compile

# Run tests
echo "Running tests..."
yarn test 