// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract KWD is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 3; // KWD uses 3 decimal places
    
    // CBK (Central Bank of Kuwait) compliance
    mapping(address => bool) public cbkCompliant;
    mapping(address => bool) public cmaCompliant; // Capital Markets Authority
    mapping(address => uint256) public amlRating; // 1-5 scale
    
    // Islamic finance compliance
    mapping(address => bool) public shariaCompliant;
    mapping(address => uint256) public lastShariaAudit;
    
    // Transaction limits (in fils, 1 KWD = 1000 fils)
    uint256 public constant DAILY_LIMIT = 5000000 * 10**DECIMALS;  // 5,000 KWD
    uint256 public constant MONTHLY_LIMIT = 50000000 * 10**DECIMALS; // 50,000 KWD
    
    event CBKComplianceUpdated(address indexed account, bool status);
    event CMAComplianceUpdated(address indexed account, bool status);
    event ShariaComplianceUpdated(address indexed account, bool status);
    event AMLRatingUpdated(address indexed account, uint256 rating);
    event ShariaAuditCompleted(address indexed account, uint256 timestamp);

    // Compliance scoring
    struct ComplianceScore {
        uint256 shariaScore;     // 0-100
        uint256 amlScore;        // 0-100
        uint256 kycScore;        // 0-100
        uint256 lastUpdate;
        bool isActive;
    }
    
    // Zakat tracking (Islamic wealth tax)
    struct ZakatRecord {
        uint256 lastCalculation;
        uint256 zakatDue;
        bool isPaid;
        uint256 holdingPeriod;
    }
    
    mapping(address => ComplianceScore) public complianceScores;
    mapping(address => ZakatRecord) public zakatRecords;
    
    // Additional events
    event ComplianceScoreUpdated(
        address indexed account,
        uint256 shariaScore,
        uint256 amlScore,
        uint256 kycScore
    );
    event ZakatCalculated(address indexed account, uint256 amount);
    event ZakatPaid(address indexed account, uint256 amount);

    constructor() BaseFiatStablecoin(
        "Kuwaiti Dinar Stablecoin",
        "KWD",
        "KWD",
        DECIMALS
    ) {
        kycLevelLimits[1] = 1000000 * 10**DECIMALS;  // 1,000 KWD
        kycLevelLimits[2] = 10000000 * 10**DECIMALS; // 10,000 KWD
        kycLevelLimits[3] = 100000000 * 10**DECIMALS; // 100,000 KWD
    }

    function setCBKCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        cbkCompliant[account] = status;
        emit CBKComplianceUpdated(account, status);
    }

    function setCMACompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        cmaCompliant[account] = status;
        emit CMAComplianceUpdated(account, status);
    }

    function setShariaCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        shariaCompliant[account] = status;
        lastShariaAudit[account] = block.timestamp;
        emit ShariaComplianceUpdated(account, status);
        emit ShariaAuditCompleted(account, block.timestamp);
    }

    function setAMLRating(address account, uint256 rating) external onlyRole(COMPLIANCE_ROLE) {
        require(rating >= 1 && rating <= 5, "Invalid AML rating");
        amlRating[account] = rating;
        emit AMLRatingUpdated(account, rating);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            require(
                cbkCompliant[from] && cbkCompliant[to],
                "CBK compliance required"
            );
            require(
                shariaCompliant[from] && shariaCompliant[to],
                "Sharia compliance required"
            );
            require(
                block.timestamp - lastShariaAudit[from] <= 180 days &&
                block.timestamp - lastShariaAudit[to] <= 180 days,
                "Sharia audit expired"
            );
            
            // AML checks
            require(amlRating[from] <= 3 && amlRating[to] <= 3, "High AML risk");
            
            // Additional checks for large transfers
            if (amount >= 10000000 * 10**DECIMALS) { // 10,000 KWD
                require(
                    cmaCompliant[from] && cmaCompliant[to],
                    "CMA compliance required for large transfers"
                );
            }
        }
    }

    function updateComplianceScore(
        address account,
        uint256 shariaScore,
        uint256 amlScore,
        uint256 kycScore
    ) external onlyRole(COMPLIANCE_ROLE) {
        require(shariaScore <= 100 && amlScore <= 100 && kycScore <= 100, "Invalid score");
        
        complianceScores[account] = ComplianceScore({
            shariaScore: shariaScore,
            amlScore: amlScore,
            kycScore: kycScore,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        emit ComplianceScoreUpdated(account, shariaScore, amlScore, kycScore);
    }

    function calculateZakat(address account) external {
        require(shariaCompliant[account], "Account not Sharia compliant");
        
        uint256 balance = balanceOf(account);
        uint256 holdingPeriod = block.timestamp - zakatRecords[account].lastCalculation;
        
        // Calculate Zakat if holding period > 1 lunar year (354.37 days)
        if (holdingPeriod >= 354 days && balance >= 85 * 10**DECIMALS) { // Nisab threshold
            uint256 zakatAmount = (balance * 25) / 1000; // 2.5%
            zakatRecords[account] = ZakatRecord({
                lastCalculation: block.timestamp,
                zakatDue: zakatAmount,
                isPaid: false,
                holdingPeriod: holdingPeriod
            });
            
            emit ZakatCalculated(account, zakatAmount);
        }
    }

    function payZakat(address zakatFund) external {
        ZakatRecord storage record = zakatRecords[msg.sender];
        require(!record.isPaid, "Zakat already paid");
        require(record.zakatDue > 0, "No Zakat due");
        
        _transfer(msg.sender, zakatFund, record.zakatDue);
        record.isPaid = true;
        
        emit ZakatPaid(msg.sender, record.zakatDue);
    }
} 