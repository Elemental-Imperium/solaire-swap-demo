const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StablecoinSwap", function () {
    let StablecoinSwap;
    let swap;
    let owner;
    let addr1;
    let addr2;
    let mockUSDC;
    let mockUSDT;

    beforeEach(async function () {
        // Deploy mock tokens
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockUSDC = await MockToken.deploy("USD Coin", "USDC");
        mockUSDT = await MockToken.deploy("Tether", "USDT");

        // Deploy StablecoinSwap
        StablecoinSwap = await ethers.getContractFactory("StablecoinSwap");
        [owner, addr1, addr2] = await ethers.getSigners();
        swap = await StablecoinSwap.deploy();
        await swap.deployed();

        // Add supported tokens
        await swap.addSupportedToken(mockUSDC.address);
        await swap.addSupportedToken(mockUSDT.address);

        // Mint tokens to addr1
        await mockUSDC.mint(addr1.address, ethers.utils.parseUnits("10000", 18));
        await mockUSDT.mint(addr1.address, ethers.utils.parseUnits("10000", 18));

        // Approve swap contract
        await mockUSDC.connect(addr1).approve(swap.address, ethers.constants.MaxUint256);
        await mockUSDT.connect(addr1).approve(swap.address, ethers.constants.MaxUint256);
    });

    describe("Token Management", function () {
        it("Should add supported tokens", async function () {
            const newToken = await MockToken.deploy("DAI", "DAI");
            await swap.addSupportedToken(newToken.address);
            expect(await swap.supportedTokens(newToken.address)).to.be.true;
        });

        it("Should remove supported tokens", async function () {
            await swap.removeSupportedToken(mockUSDC.address);
            expect(await swap.supportedTokens(mockUSDC.address)).to.be.false;
        });
    });

    describe("Swaps", function () {
        it("Should swap tokens with fee", async function () {
            const swapAmount = ethers.utils.parseUnits("1000", 18);
            const expectedFee = swapAmount.mul(3).div(10000); // 0.03% fee
            const expectedOutput = swapAmount.sub(expectedFee);

            await expect(swap.connect(addr1).swap(
                mockUSDC.address,
                mockUSDT.address,
                swapAmount
            ))
                .to.emit(swap, "TokenSwapped")
                .withArgs(addr1.address, mockUSDC.address, mockUSDT.address, swapAmount, expectedOutput);
        });

        it("Should reject unsupported tokens", async function () {
            const unsupportedToken = await MockToken.deploy("BAD", "BAD");
            await expect(
                swap.connect(addr1).swap(
                    unsupportedToken.address,
                    mockUSDT.address,
                    ethers.utils.parseUnits("1000", 18)
                )
            ).to.be.revertedWith("Token in not supported");
        });
    });

    describe("Slippage Protection", function () {
        it("Should respect maximum slippage settings", async function () {
            const swapAmount = ethers.utils.parseUnits("1000", 18);
            const minOutput = swapAmount.mul(9900).div(10000); // 1% max slippage
            
            await swap.setMaxSlippage(100); // 1%
            
            await expect(
                swap.connect(addr1).swap(
                    mockUSDC.address,
                    mockUSDT.address,
                    swapAmount,
                    minOutput
                )
            ).to.not.be.reverted;
        });

        it("Should revert when slippage exceeds maximum", async function () {
            const swapAmount = ethers.utils.parseUnits("1000", 18);
            const lowMinOutput = swapAmount.mul(9800).div(10000); // 2% slippage
            
            await swap.setMaxSlippage(100); // 1% max slippage
            
            await expect(
                swap.connect(addr1).swap(
                    mockUSDC.address,
                    mockUSDT.address,
                    swapAmount,
                    lowMinOutput
                )
            ).to.be.revertedWith("Slippage tolerance exceeded");
        });

        it("Should calculate correct output amounts with fees", async function () {
            const swapAmount = ethers.utils.parseUnits("1000", 18);
            const [expectedOutput, minOutput] = await swap.getAmountOut(
                mockUSDC.address,
                mockUSDT.address,
                swapAmount
            );
            
            const expectedFee = swapAmount.mul(3).div(10000); // 0.03% fee
            expect(expectedOutput).to.equal(swapAmount.sub(expectedFee));
            expect(minOutput).to.equal(expectedOutput.mul(9900).div(10000)); // 1% slippage
        });

        it("Should handle fee changes correctly", async function () {
            await swap.setSwapFee(5); // 0.05%
            
            const swapAmount = ethers.utils.parseUnits("1000", 18);
            const expectedFee = swapAmount.mul(5).div(10000);
            const expectedOutput = swapAmount.sub(expectedFee);
            
            await expect(
                swap.connect(addr1).swap(
                    mockUSDC.address,
                    mockUSDT.address,
                    swapAmount
                )
            ).to.emit(swap, "TokenSwapped")
            .withArgs(addr1.address, mockUSDC.address, mockUSDT.address, swapAmount, expectedOutput);
        });
    });
}); 