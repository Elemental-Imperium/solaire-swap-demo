const { ethers } = require('hardhat');
const prompts = require('prompts');
const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log(chalk.blue('\n🚀 DeFi Oracle Meta Interactive Deployment\n'));

    // Validate environment
    const questions = [
        {
            type: 'confirm',
            name: 'continueDeployment',
            message: 'Have you configured your .env file with all required variables?',
            initial: false
        },
        {
            type: 'select',
            name: 'network',
            message: 'Select deployment network:',
            choices: [
                { title: 'DeFi Oracle Meta Mainnet', value: 'Defi_Oracle_Meta_Mainnet' },
                { title: 'Local Hardhat', value: 'hardhat' },
                { title: 'Local Node', value: 'localhost' }
            ]
        },
        {
            type: 'multiselect',
            name: 'stablecoins',
            message: 'Select stablecoins to deploy:',
            choices: [
                { title: 'USDC', value: 'USDC' },
                { title: 'USDT', value: 'USDT' },
                { title: 'EURS', value: 'EURS' }
            ]
        }
    ];

    const response = await prompts(questions);
    if (!response.continueDeployment) {
        console.log(chalk.red('❌ Please configure your environment first'));
        return;
    }

    // Create deployment directory
    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir);
    }

    try {
        // Step 1: Clean and Compile
        console.log(chalk.yellow('\n📦 Cleaning and Compiling Contracts...'));
        execSync('pnpm clean && pnpm compile', { stdio: 'inherit' });

        // Step 2: Run Tests
        console.log(chalk.yellow('\n🧪 Running Tests...'));
        execSync('pnpm test', { stdio: 'inherit' });

        // Step 3: Deploy Contracts
        console.log(chalk.yellow('\n🚀 Deploying Contracts...'));
        const deploymentInfo = await deployContracts(response.network, response.stablecoins);

        // Step 4: Setup Security
        console.log(chalk.yellow('\n🔒 Setting up Security...'));
        await setupSecurity(deploymentInfo);

        // Step 5: Verify Contracts
        if (response.network !== 'hardhat' && response.network !== 'localhost') {
            console.log(chalk.yellow('\n✅ Verifying Contracts...'));
            await verifyContracts(deploymentInfo);
        }

        // Step 6: Setup Monitoring
        console.log(chalk.yellow('\n📊 Setting up Monitoring...'));
        await setupMonitoring(deploymentInfo);

        // Step 7: Update Documentation
        console.log(chalk.yellow('\n📝 Updating Documentation...'));
        await updateDocs(deploymentInfo);

        // Save deployment info
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const deploymentPath = path.join(
            deploymentDir,
            `${response.network}-${timestamp}.json`
        );
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

        console.log(chalk.green('\n✨ Deployment Complete!'));
        console.log(chalk.blue('\nDeployment information saved to:'), deploymentPath);

    } catch (error) {
        console.error(chalk.red('\n❌ Deployment Failed:'), error);
        process.exit(1);
    }
}

async function deployContracts(network, selectedStablecoins) {
    const [deployer] = await ethers.getSigners();
    const deploymentInfo = {
        network,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {}
    };

    // Deploy ProxyAdmin
    const ProxyAdmin = await ethers.getContractFactory("StablecoinProxyAdmin");
    const proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.deployed();
    deploymentInfo.contracts.proxyAdmin = proxyAdmin.address;

    // Deploy ComplianceRegistry
    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    const registry = await upgrades.deployProxy(ComplianceRegistry, [deployer.address]);
    await registry.deployed();
    deploymentInfo.contracts.complianceRegistry = registry.address;

    // Deploy selected stablecoins
    deploymentInfo.contracts.stablecoins = {};
    for (const symbol of selectedStablecoins) {
        const StableCoin = await ethers.getContractFactory(symbol);
        const stablecoin = await upgrades.deployProxy(
            StableCoin,
            [deployer.address],
            { kind: 'uups' }
        );
        await stablecoin.deployed();
        deploymentInfo.contracts.stablecoins[symbol] = stablecoin.address;
    }

    return deploymentInfo;
}

async function setupSecurity(deploymentInfo) {
    // Execute security setup script
    process.env.PROXY_ADMIN_ADDRESS = deploymentInfo.contracts.proxyAdmin;
    process.env.COMPLIANCE_REGISTRY_ADDRESS = deploymentInfo.contracts.complianceRegistry;
    process.env.STABLECOIN_ADDRESSES = Object.values(deploymentInfo.contracts.stablecoins).join(',');
    
    await require('./security/setupSecurity')();
}

async function verifyContracts(deploymentInfo) {
    // Execute verification script
    await require('./verify/verifyAll')(deploymentInfo);
}

async function setupMonitoring(deploymentInfo) {
    // Execute monitoring setup
    await require('./monitoring/setupMonitoring')(deploymentInfo);
}

async function updateDocs(deploymentInfo) {
    // Execute documentation update
    await require('./update-docs')(deploymentInfo);
}

// Add to package.json scripts
const packageJson = require('../package.json');
packageJson.scripts['deploy-interactive'] = 'node scripts/deploy-interactive.js';
fs.writeFileSync(
    path.join(__dirname, '..', 'package.json'),
    JSON.stringify(packageJson, null, 2)
);

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
} 