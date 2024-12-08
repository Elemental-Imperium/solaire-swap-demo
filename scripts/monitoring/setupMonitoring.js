const { ethers } = require("hardhat");
const config = require("../config/deploymentConfig");

async function setupMonitoring() {
    const [deployer] = await ethers.getSigners();
    console.log("Setting up monitoring with account:", deployer.address);

    // Setup monitoring contracts
    const Monitor = await ethers.getContractFactory("StablecoinMonitor");
    const monitor = await Monitor.deploy(
        process.env.PROXY_ADMIN_ADDRESS,
        process.env.COMPLIANCE_REGISTRY_ADDRESS,
        process.env.ALERT_WEBHOOK_URL
    );
    await monitor.deployed();

    // Configure thresholds
    await monitor.setErrorThreshold(process.env.ERROR_THRESHOLD);
    await monitor.setMonitoringInterval(process.env.MONITORING_INTERVAL);

    // Setup alerts
    await monitor.setAlertEndpoints({
        webhook: process.env.ALERT_WEBHOOK_URL,
        email: process.env.ALERT_EMAIL,
        slack: process.env.SLACK_WEBHOOK
    });

    // Add contracts to monitor
    const stablecoins = process.env.STABLECOIN_ADDRESSES.split(',');
    for (const address of stablecoins) {
        await monitor.addContractToMonitor(address);
    }

    console.log("Monitoring setup completed");
    return monitor.address;
}

module.exports = {
    setupMonitoring
}; 