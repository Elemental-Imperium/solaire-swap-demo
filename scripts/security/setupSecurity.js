const { ethers } = require("hardhat");
const config = require("../config/deploymentConfig");

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkConfig = config.networks[network.name];

    // Setup ProxyAdmin security
    const proxyAdmin = await ethers.getContractAt(
        "StablecoinProxyAdmin",
        process.env.PROXY_ADMIN_ADDRESS
    );

    // Setup multisig roles
    const multiSigRoles = [
        await proxyAdmin.DEFAULT_ADMIN_ROLE(),
        await proxyAdmin.UPGRADER_ROLE(),
        await proxyAdmin.PAUSER_ROLE()
    ];

    for (const role of multiSigRoles) {
        // Revoke deployer roles
        if (await proxyAdmin.hasRole(role, deployer.address)) {
            await proxyAdmin.revokeRole(role, deployer.address);
        }
    }

    // Setup ComplianceRegistry security
    const registry = await ethers.getContractAt(
        "ComplianceRegistry",
        process.env.COMPLIANCE_REGISTRY_ADDRESS
    );

    // Setup compliance limits
    for (const [level, limit] of Object.entries(networkConfig.compliance.limits)) {
        await registry.setTransactionLimit(
            networkConfig.compliance.kycLevels[level],
            limit
        );
    }

    // Setup stablecoin security
    const stablecoins = process.env.STABLECOIN_ADDRESSES.split(',');
    for (const address of stablecoins) {
        const stablecoin = await ethers.getContractAt("BaseStablecoinV2", address);
        
        // Setup roles
        await stablecoin.grantRole(
            await stablecoin.COMPLIANCE_ROLE(),
            networkConfig.roles.compliance
        );
        
        // Setup pausing
        if (await stablecoin.hasRole(await stablecoin.PAUSER_ROLE(), deployer.address)) {
            await stablecoin.revokeRole(
                await stablecoin.PAUSER_ROLE(),
                deployer.address
            );
        }
        await stablecoin.grantRole(
            await stablecoin.PAUSER_ROLE(),
            networkConfig.roles.pauser
        );
    }

    console.log("Security setup completed");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 