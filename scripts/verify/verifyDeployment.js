const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Verify ProxyAdmin
    const proxyAdmin = await ethers.getContractAt(
        "StablecoinProxyAdmin",
        process.env.PROXY_ADMIN_ADDRESS
    );

    // Verify roles
    const hasUpgraderRole = await proxyAdmin.hasRole(
        await proxyAdmin.UPGRADER_ROLE(),
        process.env.UPGRADER_ADDRESS
    );
    console.log("Upgrader role configured:", hasUpgraderRole);

    // Verify ComplianceRegistry
    const registry = await ethers.getContractAt(
        "ComplianceRegistry",
        process.env.COMPLIANCE_REGISTRY_ADDRESS
    );
    const hasComplianceAdmin = await registry.hasRole(
        await registry.COMPLIANCE_ADMIN(),
        process.env.COMPLIANCE_ADMIN_ADDRESS
    );
    console.log("Compliance admin configured:", hasComplianceAdmin);

    // Verify stablecoins
    const stablecoins = process.env.STABLECOIN_ADDRESSES.split(',');
    for (const address of stablecoins) {
        const stablecoin = await ethers.getContractAt("BaseStablecoinV2", address);
        console.log(`\nVerifying stablecoin at ${address}:`);
        console.log("Name:", await stablecoin.name());
        console.log("Symbol:", await stablecoin.symbol());
        console.log("Currency Code:", await stablecoin.currencyCode());
        console.log("Compliance Version:", await stablecoin.COMPLIANCE_VERSION());
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 