const { ethers, upgrades } = require("hardhat");
const config = require("../config/deploymentConfig");
const { writeFileSync } = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const deploymentInfo = {
        network: network.name,
        timestamp: new Date().toISOString(),
        contracts: {}
    };

    // Deploy ProxyAdmin
    const ProxyAdmin = await ethers.getContractFactory("StablecoinProxyAdmin");
    const proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.deployed();
    deploymentInfo.contracts.proxyAdmin = proxyAdmin.address;

    // Setup roles
    const networkConfig = config.networks[network.name];
    await proxyAdmin.grantRole(await proxyAdmin.UPGRADER_ROLE(), networkConfig.roles.upgrader);
    await proxyAdmin.grantRole(await proxyAdmin.PAUSER_ROLE(), networkConfig.roles.pauser);

    // Deploy ComplianceRegistry
    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    const complianceRegistry = await upgrades.deployProxy(
        ComplianceRegistry,
        [networkConfig.roles.admin],
        { kind: 'uups' }
    );
    await complianceRegistry.deployed();
    deploymentInfo.contracts.complianceRegistry = complianceRegistry.address;

    // Deploy Stablecoins
    deploymentInfo.contracts.stablecoins = {};
    for (const coin of networkConfig.stablecoins) {
        const StableCoin = await ethers.getContractFactory(coin.symbol);
        const stablecoin = await upgrades.deployProxy(
            StableCoin,
            [coin.name, coin.symbol, coin.code, networkConfig.roles.admin],
            { kind: 'uups' }
        );
        await stablecoin.deployed();
        deploymentInfo.contracts.stablecoins[coin.symbol] = stablecoin.address;

        // Setup compliance
        await stablecoin.grantRole(
            await stablecoin.COMPLIANCE_ROLE(),
            networkConfig.roles.compliance
        );
    }

    // Save deployment info
    writeFileSync(
        `deployments/${network.name}-${deploymentInfo.timestamp}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );

    return deploymentInfo;
}

main()
    .then((deploymentInfo) => {
        console.log("Deployment completed successfully");
        console.log(deploymentInfo);
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 