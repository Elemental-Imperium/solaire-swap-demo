const { ethers } = require("hardhat");
const config = require("../config/deploymentConfig");

async function verifyContract(name, address, constructorArgs = []) {
    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArgs,
        });
        console.log(`${name} verified successfully`);
    } catch (error) {
        console.error(`Error verifying ${name}:`, error);
    }
}

async function main() {
    const deploymentInfo = require(`../deployments/${network.name}-latest.json`);

    // Verify ProxyAdmin
    await verifyContract(
        "ProxyAdmin",
        deploymentInfo.contracts.proxyAdmin
    );

    // Verify ComplianceRegistry implementation
    const registryImplementation = await upgrades.erc1967.getImplementationAddress(
        deploymentInfo.contracts.complianceRegistry
    );
    await verifyContract(
        "ComplianceRegistry Implementation",
        registryImplementation
    );

    // Verify Stablecoins
    for (const [symbol, address] of Object.entries(deploymentInfo.contracts.stablecoins)) {
        const implementation = await upgrades.erc1967.getImplementationAddress(address);
        await verifyContract(
            `${symbol} Implementation`,
            implementation
        );
    }

    // Verify security configuration
    await verifySecuritySetup(deploymentInfo);
}

async function verifySecuritySetup(deploymentInfo) {
    const networkConfig = config.networks[network.name];

    // Verify ProxyAdmin roles
    const proxyAdmin = await ethers.getContractAt(
        "StablecoinProxyAdmin",
        deploymentInfo.contracts.proxyAdmin
    );

    console.log("\nVerifying ProxyAdmin roles:");
    console.log("Upgrader role:", await proxyAdmin.hasRole(
        await proxyAdmin.UPGRADER_ROLE(),
        networkConfig.roles.upgrader
    ));
    console.log("Pauser role:", await proxyAdmin.hasRole(
        await proxyAdmin.PAUSER_ROLE(),
        networkConfig.roles.pauser
    ));

    // Verify ComplianceRegistry configuration
    const registry = await ethers.getContractAt(
        "ComplianceRegistry",
        deploymentInfo.contracts.complianceRegistry
    );

    console.log("\nVerifying ComplianceRegistry configuration:");
    for (const [level, limit] of Object.entries(networkConfig.compliance.limits)) {
        const actualLimit = await registry.getTransactionLimit(
            networkConfig.compliance.kycLevels[level]
        );
        console.log(`${level} limit:`, actualLimit.toString() === limit);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 