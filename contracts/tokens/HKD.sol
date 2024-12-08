// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract HKD is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 2;
    
    // HKMA (Hong Kong Monetary Authority) compliance
    mapping(address => bool) public hkmaCompliant;
    mapping(address => bool) public sfoCompliant; // Securities and Futures Ordinance
    mapping(address => uint256) public amlRiskScore; // AML risk score (1-5)
    
    // Daily transaction limits in HKD
    uint256 public constant TIER1_DAILY_LIMIT = 8000 * 10**DECIMALS;    // ~1000 USD
    uint256 public constant TIER2_DAILY_LIMIT = 80000 * 10**DECIMALS;   // ~10000 USD
    uint256 public constant TIER3_DAILY_LIMIT = 800000 * 10**DECIMALS;  // ~100000 USD
    
    // Transaction monitoring
    mapping(address => uint256) public dailyTransactions;
    mapping(address => uint256) public lastTransactionDay;
    
    event HKMAComplianceUpdated(address indexed account, bool status);
    event SFOComplianceUpdated(address indexed account, bool status);
    event AMLRiskScoreUpdated(address indexed account, uint256 score);
    event DailyLimitReset(address indexed account);

    constructor() BaseFiatStablecoin(
        "Hong Kong Dollar Stablecoin",
        "HKD",
        "HKD",
        DECIMALS
    ) {
        // Set KYC level limits according to HKMA regulations
        kycLevelLimits[1] = TIER1_DAILY_LIMIT;  // Basic KYC
        kycLevelLimits[2] = TIER2_DAILY_LIMIT;  // Enhanced KYC
        kycLevelLimits[3] = TIER3_DAILY_LIMIT;  // Full KYC
    }

    function setHKMACompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        hkmaCompliant[account] = status;
        emit HKMAComplianceUpdated(account, status);
    }

    function setSFOCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        sfoCompliant[account] = status;
        emit SFOComplianceUpdated(account, status);
    }

    function setAMLRiskScore(address account, uint256 score) external onlyRole(COMPLIANCE_ROLE) {
        require(score >= 1 && score <= 5, "Invalid AML risk score");
        amlRiskScore[account] = score;
        emit AMLRiskScoreUpdated(account, score);
    }

    function resetDailyLimit(address account) internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (lastTransactionDay[account] < currentDay) {
            dailyTransactions[account] = 0;
            lastTransactionDay[account] = currentDay;
            emit DailyLimitReset(account);
        }
    }

    function getDailyLimit(address account) public view returns (uint256) {
        uint256 baseLimit = kycLevelLimits[kycLevel[account]];
        uint256 riskScore = amlRiskScore[account];
        
        // Adjust limit based on AML risk score
        if (riskScore == 0) return 0; // Unscored accounts cannot transact
        if (riskScore >= 4) return baseLimit / 4; // High risk = 25% of base limit
        if (riskScore == 3) return baseLimit / 2; // Medium risk = 50% of base limit
        return baseLimit; // Low risk = full limit
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            require(
                hkmaCompliant[from] && hkmaCompliant[to],
                "HKMA compliance required"
            );
            require(
                sfoCompliant[from] && sfoCompliant[to],
                "SFO compliance required"
            );
            
            // Check AML risk scores
            require(
                amlRiskScore[from] < 4 && amlRiskScore[to] < 4,
                "High AML risk accounts restricted"
            );
            
            // Check daily limits
            resetDailyLimit(from);
            uint256 dailyLimit = getDailyLimit(from);
            require(
                dailyTransactions[from] + amount <= dailyLimit,
                "Daily transfer limit exceeded"
            );
            
            // Update daily transaction amount
            dailyTransactions[from] += amount;
        }
    }

    // Additional HKMA reporting functions
    function generateTransactionReport(
        address account,
        uint256 startTime,
        uint256 endTime
    ) external view onlyRole(COMPLIANCE_ROLE) returns (
        uint256 totalTransactions,
        uint256 totalVolume,
        uint256 riskScore,
        bool complianceStatus
    ) {
        return (
            dailyTransactions[account],
            totalSupply(), // Replace with actual transaction volume calculation
            amlRiskScore[account],
            hkmaCompliant[account] && sfoCompliant[account]
        );
    }
} 