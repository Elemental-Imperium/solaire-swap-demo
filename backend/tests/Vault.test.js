const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
    let Vault;
    let vault;
    let owner;
    let addr1;
    let addr2;
    let mockPriceFeed;

    beforeEach(async function () {
        // Deploy mock price feed
        const MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockPriceFeed.deploy(8, 200000000000); // $2000 with 8 decimals

        // Deploy Vault
        Vault = await ethers.getContractFactory("Vault");
        [owner, addr1, addr2] = await ethers.getSigners();
        vault = await Vault.deploy(mockPriceFeed.address, "SolaireSwap Vault", "svETH");
        await vault.deployed();
    });

    describe("Deposits", function () {
        it("Should accept ETH deposits", async function () {
            const depositAmount = ethers.utils.parseEther("1.0");
            await expect(vault.connect(addr1).deposit({
                value: depositAmount
            }))
                .to.emit(vault, "Deposited")
                .withArgs(addr1.address, depositAmount);

            expect(await vault.deposits(addr1.address)).to.equal(depositAmount);
        });

        it("Should reject zero deposits", async function () {
            await expect(
                vault.connect(addr1).deposit({ value: 0 })
            ).to.be.revertedWith("Deposit must be greater than zero");
        });
    });

    describe("Withdrawals", function () {
        beforeEach(async function () {
            // Setup: deposit 1 ETH
            await vault.connect(addr1).deposit({
                value: ethers.utils.parseEther("1.0")
            });
        });

        it("Should allow stablecoin withdrawals", async function () {
            const stablecoin = "0x..." // Add mock stablecoin address
            await vault.addStablecoin(stablecoin);
            
            const withdrawAmount = ethers.utils.parseUnits("2000", 18); // $2000 worth
            await expect(vault.connect(addr1).withdrawStable(withdrawAmount, stablecoin))
                .to.emit(vault, "Withdrawn")
                .withArgs(addr1.address, withdrawAmount, stablecoin);
        });

        it("Should reject withdrawals above deposit value", async function () {
            const stablecoin = "0x..." // Add mock stablecoin address
            await vault.addStablecoin(stablecoin);
            
            const withdrawAmount = ethers.utils.parseUnits("4000", 18); // $4000 worth
            await expect(
                vault.connect(addr1).withdrawStable(withdrawAmount, stablecoin)
            ).to.be.revertedWith("Insufficient deposit");
        });
    });

    describe("Emergency Functions", function () {
        beforeEach(async function () {
            await vault.connect(addr1).deposit({
                value: ethers.utils.parseEther("1.0")
            });
        });

        it("Should pause contract", async function () {
            await vault.pause();
            expect(await vault.paused()).to.be.true;
        });

        it("Should prevent deposits when paused", async function () {
            await vault.pause();
            await expect(
                vault.connect(addr1).deposit({ value: ethers.utils.parseEther("1.0") })
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow emergency withdrawals when paused", async function () {
            const initialBalance = await addr1.getBalance();
            await vault.pause();
            
            await vault.connect(addr1).emergencyWithdraw();
            
            const finalBalance = await addr1.getBalance();
            expect(finalBalance.sub(initialBalance)).to.be.closeTo(
                ethers.utils.parseEther("1.0"),
                ethers.utils.parseEther("0.01") // Account for gas
            );
        });

        it("Should prevent emergency withdrawals when not paused", async function () {
            await expect(
                vault.connect(addr1).emergencyWithdraw()
            ).to.be.revertedWith("Pausable: not paused");
        });
    });

    describe("Price Feed Integration", function () {
        it("Should handle price feed updates", async function () {
            const newPrice = 250000000000; // $2500
            await mockPriceFeed.updateAnswer(newPrice);
            
            const ethPrice = await vault.getEthPrice();
            expect(ethPrice).to.equal(newPrice);
        });

        it("Should reject invalid price feed data", async function () {
            await mockPriceFeed.updateAnswer(0);
            await expect(
                vault.getEthRequiredForStablecoins(ethers.utils.parseUnits("1000", 18))
            ).to.be.revertedWith("Invalid price feed data");
        });

        it("Should calculate correct ETH amounts for stablecoins", async function () {
            // $2000 ETH price, withdrawing $4000 worth should require 2 ETH
            const withdrawAmount = ethers.utils.parseUnits("4000", 18);
            const requiredEth = await vault.getEthRequiredForStablecoins(withdrawAmount);
            expect(requiredEth).to.equal(ethers.utils.parseEther("2.0"));
        });

        it("Should handle price precision correctly", async function () {
            const oddPrice = 200012345678; // $2000.12345678
            await mockPriceFeed.updateAnswer(oddPrice);
            
            const withdrawAmount = ethers.utils.parseUnits("2000", 18);
            const requiredEth = await vault.getEthRequiredForStablecoins(withdrawAmount);
            expect(requiredEth).to.be.closeTo(
                ethers.utils.parseEther("1.0"),
                ethers.utils.parseEther("0.01")
            );
        });
    });
}); 