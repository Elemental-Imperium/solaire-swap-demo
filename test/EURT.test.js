const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EURT", function () {
    let EURT;
    let eurt;
    let owner;
    let compliance;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, compliance, user1, user2] = await ethers.getSigners();
        EURT = await ethers.getContractFactory("EURT");
        eurt = await EURT.deploy();
        await eurt.deployed();

        // Setup roles
        const COMPLIANCE_ROLE = await eurt.COMPLIANCE_ROLE();
        const MINTER_ROLE = await eurt.MINTER_ROLE();
        await eurt.grantRole(COMPLIANCE_ROLE, compliance.address);
        await eurt.grantRole(MINTER_ROLE, owner.address);

        // Whitelist users
        await eurt.setWhitelisted(owner.address, true);
        await eurt.setWhitelisted(user1.address, true);
        await eurt.setWhitelisted(user2.address, true);
    });

    describe("EMRT Compliance", function () {
        it("Should enforce EMRT compliance", async function () {
            await eurt.mint(user1.address, 1000000); // 1 EURT
            await eurt.connect(compliance).setEMRTCompliance(user1.address, true);
            await eurt.connect(compliance).setEMRTCompliance(user2.address, false);

            await expect(
                eurt.connect(user1).transfer(user2.address, 500000)
            ).to.be.revertedWith("EMRT compliance required");
        });

        it("Should allow transfers between compliant users", async function () {
            await eurt.mint(user1.address, 1000000);
            await eurt.connect(compliance).setEMRTCompliance(user1.address, true);
            await eurt.connect(compliance).setEMRTCompliance(user2.address, true);

            await expect(
                eurt.connect(user1).transfer(user2.address, 500000)
            ).to.not.be.reverted;
        });
    });

    describe("Transfer Limits", function () {
        beforeEach(async function () {
            await eurt.mint(user1.address, 10000000); // 10 EURT
            await eurt.connect(compliance).setEMRTCompliance(user1.address, true);
            await eurt.connect(compliance).setEMRTCompliance(user2.address, true);
            await eurt.connect(compliance).setTransferLimit(user1.address, 5000000); // 5 EURT daily limit
        });

        it("Should enforce daily transfer limits", async function () {
            await eurt.connect(user1).transfer(user2.address, 3000000);
            await expect(
                eurt.connect(user1).transfer(user2.address, 3000000)
            ).to.be.revertedWith("Daily transfer limit exceeded");
        });

        it("Should reset daily limits", async function () {
            await eurt.connect(user1).transfer(user2.address, 3000000);
            
            // Move forward 1 day
            await time.increase(86400);

            // Should allow transfer after reset
            await expect(
                eurt.connect(user1).transfer(user2.address, 3000000)
            ).to.not.be.reverted;
        });

        it("Should update transfer limits", async function () {
            await eurt.connect(compliance).setTransferLimit(user1.address, 2000000);
            await expect(
                eurt.connect(user1).transfer(user2.address, 3000000)
            ).to.be.revertedWith("Daily transfer limit exceeded");
        });
    });

    describe("Decimals", function () {
        it("Should return 6 decimals", async function () {
            expect(await eurt.decimals()).to.equal(6);
        });
    });
}); 