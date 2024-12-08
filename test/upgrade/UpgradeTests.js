const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Upgrade Tests", function () {
    let proxyAdmin;
    let complianceRegistry;
    let usdc;
    let owner;
    let upgrader;
    let user;

    beforeEach(async function () {
        [owner, upgrader, user] = await ethers.getSigners();

        // Deploy ProxyAdmin
        const ProxyAdmin = await ethers.getContractFactory("StablecoinProxyAdmin");
        proxyAdmin = await ProxyAdmin.deploy();
        await proxyAdmin.deployed();

        // Setup roles
        await proxyAdmin.grantRole(await proxyAdmin.UPGRADER_ROLE(), upgrader.address);

        // Deploy ComplianceRegistry
        const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
        complianceRegistry = await upgrades.deployProxy(
            ComplianceRegistry,
            [owner.address],
            { kind: 'uups' }
        );

        // Deploy USDC
        const USDC = await ethers.getContractFactory("USDC");
        usdc = await upgrades.deployProxy(
            USDC,
            ["USD Coin", "USDC", "USD", owner.address],
            { kind: 'uups' }
        );
    });

    describe("Upgrade Process", function () {
        it("Should follow proper upgrade sequence", async function () {
            // Deploy new implementation
            const USDCv2 = await ethers.getContractFactory("USDC");
            const usdcV2Implementation = await USDCv2.deploy();
            await usdcV2Implementation.deployed();

            // Request upgrade
            await proxyAdmin.connect(upgrader).requestUpgrade(
                usdc.address,
                usdcV2Implementation.address
            );

            // Try to approve before timelock - should fail
            await expect(
                proxyAdmin.connect(owner).approveUpgrade(usdc.address)
            ).to.be.revertedWith("Timelock not expired");

            // Wait for timelock
            await time.increase(2 * 24 * 60 * 60 + 1); // 2 days + 1 second

            // Approve upgrade
            await proxyAdmin.connect(owner).approveUpgrade(usdc.address);

            // Verify upgrade
            const implementationAddress = await upgrades.erc1967.getImplementationAddress(
                usdc.address
            );
            expect(implementationAddress).to.equal(usdcV2Implementation.address);
        });

        it("Should preserve state during upgrade", async function () {
            // Set initial state
            await usdc.connect(owner).setWhitelisted(user.address, true);
            await usdc.connect(owner).mint(user.address, 1000);

            // Perform upgrade
            const USDCv2 = await ethers.getContractFactory("USDC");
            const usdcV2Implementation = await USDCv2.deploy();
            
            await proxyAdmin.connect(upgrader).requestUpgrade(
                usdc.address,
                usdcV2Implementation.address
            );
            await time.increase(2 * 24 * 60 * 60 + 1);
            await proxyAdmin.connect(owner).approveUpgrade(usdc.address);

            // Verify state is preserved
            expect(await usdc.isWhitelisted(user.address)).to.be.true;
            expect(await usdc.balanceOf(user.address)).to.equal(1000);
        });

        it("Should handle emergency pause during upgrade", async function () {
            // Pause the system
            await proxyAdmin.connect(owner).pause();

            // Try to request upgrade while paused
            await expect(
                proxyAdmin.connect(upgrader).requestUpgrade(
                    usdc.address,
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("Pausable: paused");

            // Unpause and verify upgrade works
            await proxyAdmin.connect(owner).unpause();
            const USDCv2 = await ethers.getContractFactory("USDC");
            const usdcV2Implementation = await USDCv2.deploy();
            
            await proxyAdmin.connect(upgrader).requestUpgrade(
                usdc.address,
                usdcV2Implementation.address
            );
        });
    });

    describe("Compliance Registry Upgrade", function () {
        it("Should upgrade compliance registry while maintaining data", async function () {
            // Set initial compliance data
            await complianceRegistry.updateKYCStatus(user.address, 2, time.latest() + 365 days);
            
            // Deploy and upgrade to new version
            const ComplianceRegistryV2 = await ethers.getContractFactory("ComplianceRegistry");
            const newImplementation = await ComplianceRegistryV2.deploy();
            
            await proxyAdmin.connect(upgrader).requestUpgrade(
                complianceRegistry.address,
                newImplementation.address
            );
            await time.increase(2 * 24 * 60 * 60 + 1);
            await proxyAdmin.connect(owner).approveUpgrade(complianceRegistry.address);

            // Verify data persistence
            const status = await complianceRegistry.getComplianceStatus(user.address);
            expect(status.kycLevel).to.equal(2);
            expect(status.kycVerified).to.be.true;
        });
    });
}); 