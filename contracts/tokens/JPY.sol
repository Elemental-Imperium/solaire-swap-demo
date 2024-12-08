// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract JPY is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 0; // JPY doesn't use decimal places
    
    // FSA (Financial Services Agency) compliance
    mapping(address => bool) public fsaCompliant;
    mapping(address => bool) public psmtCompliant; // Payment Services and Money Transfer
    mapping(address => uint256) public jfrsStatus; // Japan Financial Regulatory Status
    
    // Transaction monitoring
    struct TransactionLimits {
        uint256 dailyLimit;
        uint256 monthlyLimit;
        uint256 dailyUsed;
        uint256 monthlyUsed;
        uint256 lastDailyReset;
        uint256 lastMonthlyReset;
        bool isInstitutional;
    }
    
    mapping(address => TransactionLimits) public limits;
    
    // Constants
    uint256 public constant RETAIL_DAILY_LIMIT = 1000000;    // ¥1M
    uint256 public constant RETAIL_MONTHLY_LIMIT = 30000000; // ¥30M
    uint256 public constant INST_DAILY_LIMIT = 100000000;    // ¥100M
    uint256 public constant INST_MONTHLY_LIMIT = 1000000000; // ¥1B
    
    // Cross-border transfer tracking
    struct CrossBorderTransfer {
        string purpose;
        string beneficiaryBank;
        string swiftCode;
        uint256 timestamp;
        bool isApproved;
    }
    
    // Trade finance support
    struct TradeFinanceRecord {
        string letterOfCreditRef;
        uint256 amount;
        uint256 expiryDate;
        bool isValid;
        address beneficiary;
    }
    
    mapping(bytes32 => CrossBorderTransfer) public crossBorderTransfers;
    mapping(bytes32 => TradeFinanceRecord) public tradeFinanceRecords;
    mapping(address => uint256) public crossBorderLimit;
    
    event FSAComplianceUpdated(address indexed account, bool status);
    event PSMTComplianceUpdated(address indexed account, bool status);
    event JFRSStatusUpdated(address indexed account, uint256 status);
    event LimitsReset(address indexed account, bool isDaily);
    event InstitutionalStatusUpdated(address indexed account, bool status);
    event CrossBorderTransferInitiated(bytes32 indexed transferId, address indexed from, string purpose);
    event TradeFinanceRecordCreated(bytes32 indexed recordId, string letterOfCreditRef);
    event CrossBorderLimitUpdated(address indexed account, uint256 newLimit);

    constructor() BaseFiatStablecoin(
        "Japanese Yen Stablecoin",
        "JPY",
        "JPY",
        DECIMALS
    ) {
        kycLevelLimits[1] = 100000;    // ¥100K
        kycLevelLimits[2] = 1000000;   // ¥1M
        kycLevelLimits[3] = 10000000;  // ¥10M
    }

    function setFSACompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        fsaCompliant[account] = status;
        emit FSAComplianceUpdated(account, status);
    }

    function setPSMTCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        psmtCompliant[account] = status;
        emit PSMTComplianceUpdated(account, status);
    }

    function setJFRSStatus(address account, uint256 status) external onlyRole(COMPLIANCE_ROLE) {
        jfrsStatus[account] = status;
        emit JFRSStatusUpdated(account, status);
    }

    function setInstitutionalStatus(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        limits[account].isInstitutional = status;
        limits[account].dailyLimit = status ? INST_DAILY_LIMIT : RETAIL_DAILY_LIMIT;
        limits[account].monthlyLimit = status ? INST_MONTHLY_LIMIT : RETAIL_MONTHLY_LIMIT;
        emit InstitutionalStatusUpdated(account, status);
    }

    function resetLimits(address account) internal {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentMonth = block.timestamp / 30 days;
        
        if (limits[account].lastDailyReset < currentDay) {
            limits[account].dailyUsed = 0;
            limits[account].lastDailyReset = currentDay;
            emit LimitsReset(account, true);
        }
        
        if (limits[account].lastMonthlyReset < currentMonth) {
            limits[account].monthlyUsed = 0;
            limits[account].lastMonthlyReset = currentMonth;
            emit LimitsReset(account, false);
        }
    }

    function initiateCrossBorderTransfer(
        address to,
        uint256 amount,
        string calldata purpose,
        string calldata beneficiaryBank,
        string calldata swiftCode
    ) external returns (bytes32) {
        require(fsaCompliant[msg.sender], "FSA compliance required");
        require(amount <= crossBorderLimit[msg.sender], "Exceeds cross-border limit");
        
        bytes32 transferId = keccak256(abi.encodePacked(
            msg.sender,
            to,
            amount,
            block.timestamp
        ));
        
        crossBorderTransfers[transferId] = CrossBorderTransfer({
            purpose: purpose,
            beneficiaryBank: beneficiaryBank,
            swiftCode: swiftCode,
            timestamp: block.timestamp,
            isApproved: false
        });
        
        emit CrossBorderTransferInitiated(transferId, msg.sender, purpose);
        return transferId;
    }

    function createTradeFinanceRecord(
        string calldata letterOfCreditRef,
        uint256 amount,
        uint256 duration,
        address beneficiary
    ) external onlyRole(COMPLIANCE_ROLE) returns (bytes32) {
        bytes32 recordId = keccak256(abi.encodePacked(
            letterOfCreditRef,
            amount,
            block.timestamp
        ));
        
        tradeFinanceRecords[recordId] = TradeFinanceRecord({
            letterOfCreditRef: letterOfCreditRef,
            amount: amount,
            expiryDate: block.timestamp + duration,
            isValid: true,
            beneficiary: beneficiary
        });
        
        emit TradeFinanceRecordCreated(recordId, letterOfCreditRef);
        return recordId;
    }

    function setCrossBorderLimit(address account, uint256 limit) external onlyRole(COMPLIANCE_ROLE) {
        crossBorderLimit[account] = limit;
        emit CrossBorderLimitUpdated(account, limit);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            require(
                fsaCompliant[from] && fsaCompliant[to],
                "FSA compliance required"
            );
            require(
                psmtCompliant[from] && psmtCompliant[to],
                "PSMT compliance required"
            );
            
            // Reset and check limits
            resetLimits(from);
            require(
                limits[from].dailyUsed + amount <= limits[from].dailyLimit,
                "Daily limit exceeded"
            );
            require(
                limits[from].monthlyUsed + amount <= limits[from].monthlyLimit,
                "Monthly limit exceeded"
            );
            
            // Update used amounts
            limits[from].dailyUsed += amount;
            limits[from].monthlyUsed += amount;
            
            // Additional checks for large transfers
            if (amount >= 10000000) { // ¥10M
                require(
                    jfrsStatus[from] >= 2 && jfrsStatus[to] >= 2,
                    "Enhanced JFRS status required for large transfers"
                );
            }
        }
        
        // Additional checks for institutional accounts
        if (limits[from].isInstitutional) {
            require(
                jfrsStatus[from] >= 3,
                "Enhanced JFRS status required for institutional transfers"
            );
        }
        
        // Check trade finance validity if applicable
        bytes32 tradeFinanceId = keccak256(abi.encodePacked(from, to, amount));
        if (tradeFinanceRecords[tradeFinanceId].isValid) {
            require(
                block.timestamp <= tradeFinanceRecords[tradeFinanceId].expiryDate,
                "Trade finance record expired"
            );
        }
    }
} 