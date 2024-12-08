const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy ProxyAdmin
    const ProxyAdmin = await ethers.getContractFactory("StablecoinProxyAdmin");
    const proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.deployed();
    console.log("ProxyAdmin deployed to:", proxyAdmin.address);

    // Deploy ComplianceRegistry
    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    const complianceRegistry = await upgrades.deployProxy(
        ComplianceRegistry,
        [deployer.address],
        { kind: 'uups' }
    );
    await complianceRegistry.deployed();
    console.log("ComplianceRegistry deployed to:", complianceRegistry.address);

    // Deploy Stablecoins
    const stablecoins = [
        { name: "USD Coin", symbol: "USDC", code: "USD" },
        { name: "Euro Stablecoin", symbol: "EURS", code: "EUR" },
        // Add other stablecoins
    ];

    for (const coin of stablecoins) {
        const StableCoin = await ethers.getContractFactory(coin.symbol);
        const stablecoin = await upgrades.deployProxy(
            StableCoin,
            [coin.name, coin.symbol, coin.code, deployer.address],
            { kind: 'uups' }
        );
        await stablecoin.deployed();
        console.log(`${coin.symbol} deployed to:`, stablecoin.address);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 