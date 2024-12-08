// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract CAD is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 2;
    
    // FINTRAC (Financial Transactions and Reports Analysis Centre) compliance
    mapping(address => bool) public fintracCompliant;
    mapping(address => bool) public osfiCompliant; // Office of the Superintendent of Financial Institutions
    mapping(address => uint256) public pcmltfaStatus; // Proceeds of Crime Money Laundering and Terrorist Financing Act
    
    // Transaction limits and thresholds
    uint256 public constant LARGE_TRANSACTION_THRESHOLD = 10000 * 10**DECIMALS; // $10,000 CAD
    uint256 public constant SUSPICIOUS_VOLUME_THRESHOLD = 100000 * 10**DECIMALS; // $100,000 CAD
    
    // Compliance tracking
    struct ComplianceRecord {
        uint256 lastUpdate;
        uint256 riskLevel;
        bool isCorporate;
        bool isRestricted;
    }
    
    mapping(address => ComplianceRecord) public complianceRecords;
    mapping(address => uint256) public weeklyVolume;
    mapping(address => uint256) public lastWeekReset;

    event FINTRACComplianceUpdated(address indexed account, bool status);
    event OSFIComplianceUpdated(address indexed account, bool status);
    event PCMLTFAStatusUpdated(address indexed account, uint256 status);
    event ComplianceRecordUpdated(address indexed account, uint256 riskLevel);
    event WeeklyVolumeReset(address indexed account);

    constructor() BaseFiatStablecoin(
        "Canadian Dollar Stablecoin",
        "CAD",
        "CAD",
        DECIMALS
    ) {
        kycLevelLimits[1] = 5000 * 10**DECIMALS;   // Basic KYC
        kycLevelLimits[2] = 50000 * 10**DECIMALS;  // Enhanced KYC
        kycLevelLimits[3] = 250000 * 10**DECIMALS; // Full KYC
    }

    function setFINTRACCompliance(
        address account,
        bool status,
        bool isCorporate
    ) external onlyRole(COMPLIANCE_ROLE) {
        fintracCompliant[account] = status;
        complianceRecords[account].isCorporate = isCorporate;
        complianceRecords[account].lastUpdate = block.timestamp;
        emit FINTRACComplianceUpdated(account, status);
    }

    function setOSFICompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        osfiCompliant[account] = status;
        emit OSFIComplianceUpdated(account, status);
    }

    function setPCMLTFAStatus(address account, uint256 status) external onlyRole(COMPLIANCE_ROLE) {
        pcmltfaStatus[account] = status;
        emit PCMLTFAStatusUpdated(account, status);
    }

    function updateComplianceRecord(
        address account,
        uint256 riskLevel,
        bool isRestricted
    ) external onlyRole(COMPLIANCE_ROLE) {
        complianceRecords[account].riskLevel = riskLevel;
        complianceRecords[account].isRestricted = isRestricted;
        complianceRecords[account].lastUpdate = block.timestamp;
        emit ComplianceRecordUpdated(account, riskLevel);
    }

    function resetWeeklyVolume(address account) internal {
        uint256 currentWeek = block.timestamp / 7 days;
        if (lastWeekReset[account] < currentWeek) {
            weeklyVolume[account] = 0;
            lastWeekReset[account] = currentWeek;
            emit WeeklyVolumeReset(account);
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            require(
                fintracCompliant[from] && fintracCompliant[to],
                "FINTRAC compliance required"
            );
            require(
                !complianceRecords[from].isRestricted && !complianceRecords[to].isRestricted,
                "Account is restricted"
            );
            
            // Reset and update weekly volume
            resetWeeklyVolume(from);
            weeklyVolume[from] += amount;
            
            // Corporate accounts have different requirements
            if (complianceRecords[from].isCorporate || complianceRecords[to].isCorporate) {
                require(osfiCompliant[from] && osfiCompliant[to], "OSFI compliance required");
            }
            
            // Check PCMLTFA status for large transactions
            if (amount >= LARGE_TRANSACTION_THRESHOLD) {
                require(
                    pcmltfaStatus[from] >= 2 && pcmltfaStatus[to] >= 2,
                    "Enhanced PCMLTFA status required"
                );
            }
            
            // Monitor suspicious volumes
            if (weeklyVolume[from] >= SUSPICIOUS_VOLUME_THRESHOLD) {
                emit ComplianceRecordUpdated(from, complianceRecords[from].riskLevel + 1);
            }
        }
    }
} 