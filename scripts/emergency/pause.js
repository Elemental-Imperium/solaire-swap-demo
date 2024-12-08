const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Get ProxyAdmin
    const proxyAdmin = await ethers.getContractAt(
        "StablecoinProxyAdmin",
        process.env.PROXY_ADMIN_ADDRESS
    );

    // Pause all operations
    await proxyAdmin.pause();
    console.log("System paused");

    // Pause individual stablecoins
    const stablecoins = process.env.STABLECOIN_ADDRESSES.split(',');
    for (const address of stablecoins) {
        const stablecoin = await ethers.getContractAt("BaseStablecoinV2", address);
        await stablecoin.pause();
        console.log(`Stablecoin at ${address} paused`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 