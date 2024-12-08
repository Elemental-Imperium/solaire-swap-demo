#!/bin/bash

echo "Starting deep cleanup..."

# Remove all build artifacts
echo "Removing build artifacts..."
rm -rf artifacts
rm -rf cache
rm -rf typechain
rm -rf typechain-types
rm -rf coverage
rm -rf coverage.json

# Remove dependency files
echo "Removing dependency files..."
rm -rf node_modules
rm -rf .yarn/cache
rm -rf .yarn/install-state.gz
rm -rf yarn.lock

# Clean yarn cache
echo "Cleaning yarn cache..."
yarn cache clean

# Remove native build artifacts
echo "Removing native build artifacts..."
find . -name "*.node" -type f -delete
find . -name "*.o" -type f -delete
find . -name "*.a" -type f -delete
find . -name "*.obj" -type f -delete
find . -name "*.lib" -type f -delete
find . -name "*.dll" -type f -delete
find . -name "*.dylib" -type f -delete
find . -name "*.so" -type f -delete

# Remove other build files
echo "Removing other build files..."
find . -name "*.tsbuildinfo" -delete
find . -name ".DS_Store" -delete

echo "Cleanup complete!" 