const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const resolveDependencies = () => {
    console.log('Resolving dependencies...');

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = require(packageJsonPath);

    // Update package.json
    const updates = {
        devDependencies: {
            ...packageJson.devDependencies,
            "@openzeppelin/contracts": "^4.9.3",
            "@openzeppelin/contracts-upgradeable": "^4.9.3",
            "ethers": "^5.7.2", // Lock to v5
            "@typechain/ethers-v5": "^11.1.1", // Use v5 compatible version
        },
        resolutions: {
            "ethers": "^5.7.2",
            "@ethersproject/abi": "^5.7.0",
            "@ethersproject/providers": "^5.7.0"
        }
    };

    const updatedPackageJson = {
        ...packageJson,
        ...updates,
        devDependencies: {
            ...packageJson.devDependencies,
            ...updates.devDependencies
        }
    };

    // Write updates
    fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(updatedPackageJson, null, 2)
    );

    // Clean install
    console.log('Cleaning installation...');
    execSync('rm -rf node_modules .yarn/cache .yarn/install-state.gz yarn.lock', { stdio: 'inherit' });

    // Install system dependencies if needed
    try {
        console.log('Installing system dependencies...');
        if (process.platform === 'linux') {
            execSync('sudo apt-get update && sudo apt-get install -y build-essential python3', { stdio: 'inherit' });
        } else if (process.platform === 'darwin') {
            execSync('xcode-select --install || true', { stdio: 'inherit' });
        }
    } catch (error) {
        console.warn('Warning: Could not install system dependencies. You may need to install them manually.');
    }

    // Reinstall dependencies
    console.log('Installing dependencies...');
    execSync('yarn install', { stdio: 'inherit' });

    // Rebuild native modules
    console.log('Rebuilding native modules...');
    execSync('yarn rebuild', { stdio: 'inherit' });
};

resolveDependencies(); 