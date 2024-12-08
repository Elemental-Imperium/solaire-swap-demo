const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests", function () {
    let vault;
    let swap;
    let mockUSDC;
    let mockUSDT;
    let mockPriceFeed;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // Deploy mock tokens
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockUSDC = await MockToken.deploy("USD Coin", "USDC");
        mockUSDT = await MockToken.deploy("Tether", "USDT");

        // Deploy mock price feed
        const MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockPriceFeed.deploy(8, 200000000000); // $2000 ETH price

        // Deploy Vault
        const Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.deploy(mockPriceFeed.address, "SolaireSwap Vault", "svETH");

        // Deploy StablecoinSwap
        const StablecoinSwap = await ethers.getContractFactory("StablecoinSwap");
        swap = await StablecoinSwap.deploy();

        // Setup
        await vault.addStablecoin(mockUSDC.address);
        await vault.addStablecoin(mockUSDT.address);
        await swap.addSupportedToken(mockUSDC.address);
        await swap.addSupportedToken(mockUSDT.address);
    });

    it("Should handle full deposit-withdraw-swap flow", async function () {
        // Deposit ETH
        await vault.connect(user).deposit({ value: ethers.utils.parseEther("1.0") });
        
        // Withdraw as USDC
        const withdrawAmount = ethers.utils.parseUnits("2000", 18); // $2000 worth
        await vault.connect(user).withdrawStable(withdrawAmount, mockUSDC.address);
        
        // Approve and swap USDC to USDT
        await mockUSDC.connect(user).approve(swap.address, withdrawAmount);
        await swap.connect(user).swap(
            mockUSDC.address,
            mockUSDT.address,
            withdrawAmount
        );

        // Verify final USDT balance
        const expectedOutput = withdrawAmount.mul(9997).div(10000); // After 0.03% fee
        const finalBalance = await mockUSDT.balanceOf(user.address);
        expect(finalBalance).to.equal(expectedOutput);
    });
}); 