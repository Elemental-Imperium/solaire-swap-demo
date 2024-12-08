const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("XAUT", function () {
    let XAUT;
    let xaut;
    let owner;
    let admin;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, admin, user1, user2] = await ethers.getSigners();
        XAUT = await ethers.getContractFactory("XAUT");
        xaut = await XAUT.deploy();
        await xaut.deployed();

        // Setup roles
        const ADMIN_ROLE = await xaut.DEFAULT_ADMIN_ROLE();
        await xaut.grantRole(ADMIN_ROLE, admin.address);

        // Whitelist users
        await xaut.setWhitelisted(owner.address, true);
        await xaut.setWhitelisted(user1.address, true);
        await xaut.setWhitelisted(user2.address, true);
    });

    describe("Gold Bar Management", function () {
        it("Should add gold bar", async function () {
            await expect(
                xaut.connect(admin).addGoldBar(
                    "SERIAL123",
                    1000000, // 1 troy ounce
                    "LBMA",
                    9999, // 99.99% pure
                    "London"
                )
            )
                .to.emit(xaut, "GoldBarAdded")
                .withArgs(1, "SERIAL123", 1000000, "LBMA");

            const bar = await xaut.goldBars(1);
            expect(bar.serialNumber).to.equal("SERIAL123");
            expect(bar.active).to.be.true;
        });

        it("Should reject invalid purity", async function () {
            await expect(
                xaut.connect(admin).addGoldBar(
                    "SERIAL123",
                    1000000,
                    "LBMA",
                    10000, // Invalid purity
                    "London"
                )
            ).to.be.revertedWith("Invalid purity value");
        });

        it("Should deactivate gold bar", async function () {
            await xaut.connect(admin).addGoldBar(
                "SERIAL123",
                1000000,
                "LBMA",
                9999,
                "London"
            );

            await expect(xaut.connect(admin).deactivateGoldBar(1))
                .to.emit(xaut, "GoldBarDeactivated")
                .withArgs(1);

            const bar = await xaut.goldBars(1);
            expect(bar.active).to.be.false;
        });
    });

    describe("Bar Ownership", function () {
        beforeEach(async function () {
            await xaut.connect(admin).addGoldBar(
                "SERIAL123",
                1000000,
                "LBMA",
                9999,
                "London"
            );
        });

        it("Should assign bar ownership", async function () {
            await expect(xaut.connect(admin).assignBarOwnership(1, user1.address))
                .to.emit(xaut, "GoldBarOwnershipTransferred")
                .withArgs(1, ethers.constants.AddressZero, user1.address);

            expect(await xaut.barOwners(1)).to.equal(user1.address);
        });

        it("Should transfer bar ownership", async function () {
            await xaut.connect(admin).assignBarOwnership(1, user1.address);
            await xaut.connect(admin).assignBarOwnership(1, user2.address);

            expect(await xaut.barOwners(1)).to.equal(user2.address);
            const user1Bars = await xaut.getOwnedBars(user1.address);
            expect(user1Bars.length).to.equal(0);
            const user2Bars = await xaut.getOwnedBars(user2.address);
            expect(user2Bars.length).to.equal(1);
        });
    });

    describe("Transfer Restrictions", function () {
        beforeEach(async function () {
            await xaut.mint(user1.address, 1000000); // 1 XAUT
        });

        it("Should enforce minimum transfer amount", async function () {
            await expect(
                xaut.connect(user1).transfer(user2.address, 9999)
            ).to.be.revertedWith("Transfer amount too small");

            await expect(
                xaut.connect(user1).transfer(user2.address, 10000)
            ).to.not.be.reverted;
        });

        it("Should not enforce minimum on burning", async function () {
            const BURNER_ROLE = await xaut.BURNER_ROLE();
            await xaut.grantRole(BURNER_ROLE, owner.address);

            await expect(
                xaut.burn(user1.address, 5000)
            ).to.not.be.reverted;
        });
    });

    describe("Decimals", function () {
        it("Should return 6 decimals", async function () {
            expect(await xaut.decimals()).to.equal(6);
        });
    });
}); 