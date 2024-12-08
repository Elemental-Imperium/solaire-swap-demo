const { ethers } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying StablecoinSwap with account:", deployer.address);

    // Deploy StablecoinSwap
    const StablecoinSwap = await ethers.getContractFactory("StablecoinSwap");
    const swap = await StablecoinSwap.deploy();
    await swap.deployed();

    console.log("StablecoinSwap deployed to:", swap.address);

    // Add supported stablecoins
    const stablecoins = [
        process.env.USDC_ADDRESS,
        process.env.USDT_ADDRESS,
        process.env.DAI_ADDRESS
    ];

    for (const stablecoin of stablecoins) {
        await swap.addSupportedToken(stablecoin);
        console.log(`Added support for stablecoin: ${stablecoin}`);
    }

    return swap;
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main; 