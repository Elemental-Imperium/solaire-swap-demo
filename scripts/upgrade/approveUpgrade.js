const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Get ProxyAdmin
    const proxyAdmin = await ethers.getContractAt(
        "StablecoinProxyAdmin",
        process.env.PROXY_ADMIN_ADDRESS
    );

    // Approve upgrade
    await proxyAdmin.approveUpgrade(process.env.PROXY_ADDRESS);
    console.log("Upgrade approved and executed");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 