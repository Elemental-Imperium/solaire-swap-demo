const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Get ProxyAdmin
    const proxyAdmin = await ethers.getContractAt(
        "StablecoinProxyAdmin",
        process.env.PROXY_ADMIN_ADDRESS
    );

    // Deploy new implementation
    const StablecoinV2 = await ethers.getContractFactory(process.env.STABLECOIN_NAME);
    const implementation = await StablecoinV2.deploy();
    await implementation.deployed();

    console.log("New implementation deployed to:", implementation.address);

    // Request upgrade
    await proxyAdmin.requestUpgrade(
        process.env.PROXY_ADDRESS,
        implementation.address
    );
    console.log("Upgrade requested. Waiting for timelock...");

    // Note: The upgrade must be approved after timelock period
    console.log("Run approveUpgrade.js after timelock period");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 