const { ethers } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying Vault with account:", deployer.address);

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(
        process.env.PRICE_FEED_ADDRESS,
        "SolaireSwap Vault",
        "svETH"
    );
    await vault.deployed();

    console.log("Vault deployed to:", vault.address);
    return vault;
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