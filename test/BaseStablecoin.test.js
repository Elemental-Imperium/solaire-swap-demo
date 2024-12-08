const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BaseStablecoin", function () {
    let USDT;
    let usdt;
    let owner;
    let minter;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, minter, user1, user2] = await ethers.getSigners();
        USDT = await ethers.getContractFactory("USDT");
        usdt = await USDT.deploy();
        await usdt.deployed();

        // Setup roles
        await usdt.grantRole(await usdt.MINTER_ROLE(), minter.address);
        
        // Whitelist users
        await usdt.setWhitelisted(owner.address, true);
        await usdt.setWhitelisted(minter.address, true);
        await usdt.setWhitelisted(user1.address, true);
        await usdt.setWhitelisted(user2.address, true);
    });

    describe("Compliance", function () {
        it("Should enforce whitelisting", async function () {
            await usdt.setWhitelisted(user1.address, false);
            await expect(
                usdt.connect(minter).mint(user1.address, 1000)
            ).to.be.revertedWith("Address not whitelisted");
        });

        it("Should enforce blacklisting", async function () {
            await usdt.setBlacklisted(user1.address, true);
            await expect(
                usdt.connect(minter).mint(user1.address, 1000)
            ).to.be.revertedWith("Address is blacklisted");
        });

        it("Should register IBAN", async function () {
            const iban = "DE89370400440532013000";
            await usdt.registerIban(user1.address, iban);
            expect(await usdt.accountIbans(user1.address)).to.equal(iban);
        });
    });

    describe("ISO-20022", function () {
        it("Should process ISO-20022 transfer", async function () {
            await usdt.connect(minter).mint(user1.address, 1000);
            
            await expect(
                usdt.connect(user1).transferISO20022(
                    user2.address,
                    500,
                    "MSG001",
                    "SALARY"
                )
            )
                .to.emit(usdt, "ISO20022Transfer")
                .withArgs(user1.address, user2.address, 500, "MSG001", "SALARY");
        });
    });

    describe("Collateral", function () {
        it("Should track collateral ratio", async function () {
            await usdt.connect(minter).mint(user1.address, 1000);
            await usdt.updateCollateral(2000);
            
            expect(await usdt.collateralRatio()).to.equal(
                ethers.utils.parseEther("2")
            );
        });
    });
}); 