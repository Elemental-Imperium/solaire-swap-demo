const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fixDependencies = () => {
  console.log('Fixing dependencies...');

  // Required dependencies
  const dependencies = {
    "@openzeppelin/contracts": "^4.9.3",
    "@openzeppelin/contracts-upgradeable": "^4.9.3",
    "@ethersproject/abi": "^5.7.0",
    "@ethersproject/providers": "^5.7.0",
    "@typechain/ethers-v6": "^0.5.0"
  };

  // Read package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);

  // Update devDependencies
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...dependencies
  };

  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Clean install
  console.log('Cleaning node_modules...');
  execSync('rm -rf node_modules .yarn/cache .yarn/install-state.gz yarn.lock', { stdio: 'inherit' });

  console.log('Installing dependencies...');
  execSync('yarn install', { stdio: 'inherit' });
};

fixDependencies(); 