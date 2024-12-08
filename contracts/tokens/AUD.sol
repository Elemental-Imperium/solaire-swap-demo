// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract AUD is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 2;
    
    // AUSTRAC (Australian Transaction Reports and Analysis Centre) compliance
    mapping(address => bool) public austracCompliant;
    mapping(address => bool) public asicCompliant; // Australian Securities and Investments Commission
    mapping(address => uint256) public reportingThreshold; // Individual reporting thresholds
    
    // Transaction thresholds in AUD
    uint256 public constant REPORTING_THRESHOLD = 10000 * 10**DECIMALS; // $10,000 AUD
    uint256 public constant ENHANCED_DUE_DILIGENCE = 50000 * 10**DECIMALS; // $50,000 AUD
    
    // Suspicious transaction monitoring
    mapping(address => uint256) public monthlyVolume;
    mapping(address => uint256) public lastMonthReset;
    
    event AUSTRACComplianceUpdated(address indexed account, bool status);
    event ASICComplianceUpdated(address indexed account, bool status);
    event SuspiciousActivityReported(address indexed account, uint256 amount, string reason);
    event MonthlyVolumeReset(address indexed account);

    constructor() BaseFiatStablecoin(
        "Australian Dollar Stablecoin",
        "AUD",
        "AUD",
        DECIMALS
    ) {
        kycLevelLimits[1] = 5000 * 10**DECIMALS;   // Basic KYC
        kycLevelLimits[2] = 50000 * 10**DECIMALS;  // Enhanced KYC
        kycLevelLimits[3] = 500000 * 10**DECIMALS; // Full KYC
    }

    function setAUSTRACCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        austracCompliant[account] = status;
        emit AUSTRACComplianceUpdated(account, status);
    }

    function setASICCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        asicCompliant[account] = status;
        emit ASICComplianceUpdated(account, status);
    }

    function resetMonthlyVolume(address account) internal {
        uint256 currentMonth = block.timestamp / 30 days;
        if (lastMonthReset[account] < currentMonth) {
            monthlyVolume[account] = 0;
            lastMonthReset[account] = currentMonth;
            emit MonthlyVolumeReset(account);
        }
    }

    function reportSuspiciousActivity(
        address account,
        uint256 amount,
        string calldata reason
    ) external onlyRole(COMPLIANCE_ROLE) {
        emit SuspiciousActivityReported(account, amount, reason);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            require(
                austracCompliant[from] && austracCompliant[to],
                "AUSTRAC compliance required"
            );
            require(
                asicCompliant[from] && asicCompliant[to],
                "ASIC compliance required"
            );
            
            // Reset and update monthly volume
            resetMonthlyVolume(from);
            monthlyVolume[from] += amount;
            
            // Enhanced due diligence for large transfers
            if (amount >= ENHANCED_DUE_DILIGENCE) {
                require(kycLevel[from] >= 2 && kycLevel[to] >= 2, "Enhanced KYC required");
            }
            
            // Automatic reporting for transactions above threshold
            if (amount >= REPORTING_THRESHOLD) {
                emit SuspiciousActivityReported(
                    from,
                    amount,
                    "Large transaction automatic report"
                );
            }
        }
    }
} 