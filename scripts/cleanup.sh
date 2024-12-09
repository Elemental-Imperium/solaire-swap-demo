#!/bin/bash

echo "Starting deep cleanup..."

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf artifacts
rm -rf cache
rm -rf typechain
rm -rf typechain-types
rm -rf coverage
rm -rf coverage.json

# Remove dependency files but preserve husky
echo "Removing dependency files..."
rm -rf node_modules
rm -rf pnpm-lock.yaml

# Clean pnpm cache
echo "Cleaning pnpm cache..."
pnpm store prune

# Remove other build files
echo "Removing other build files..."
find . -name "*.tsbuildinfo" -delete
find . -name ".DS_Store" -delete

# Ensure husky hooks are still executable
chmod +x .husky/pre-commit

echo "Cleanup complete!" 