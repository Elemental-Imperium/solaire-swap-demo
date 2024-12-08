// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract ComplianceRegistry is 
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable 
{
    bytes32 public constant COMPLIANCE_ADMIN = keccak256("COMPLIANCE_ADMIN");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    struct ComplianceStatus {
        bool kycVerified;
        uint256 kycLevel;
        uint256 kycExpiry;
        bool amlCleared;
        uint256 riskScore;
        string jurisdiction;
        mapping(string => bool) regulatoryApprovals;
        uint256 lastUpdate;
    }

    struct ComplianceReport {
        string reportType;
        string details;
        uint256 timestamp;
        address reporter;
    }

    mapping(address => ComplianceStatus) public complianceStatus;
    mapping(address => ComplianceReport[]) public complianceReports;
    mapping(string => mapping(address => bool)) public jurisdictionApprovals;

    event KYCUpdated(address indexed account, uint256 level, uint256 expiry);
    event AMLStatusUpdated(address indexed account, bool status, uint256 riskScore);
    event JurisdictionApprovalUpdated(address indexed account, string jurisdiction, bool approved);
    event ComplianceReportAdded(address indexed account, string reportType);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(COMPLIANCE_ADMIN, admin);
        _setupRole(UPGRADER_ROLE, admin);
    }

    function updateKYCStatus(
        address account,
        uint256 level,
        uint256 expiry
    ) external onlyRole(COMPLIANCE_ADMIN) {
        ComplianceStatus storage status = complianceStatus[account];
        status.kycVerified = true;
        status.kycLevel = level;
        status.kycExpiry = expiry;
        status.lastUpdate = block.timestamp;

        emit KYCUpdated(account, level, expiry);
    }

    function updateAMLStatus(
        address account,
        bool cleared,
        uint256 riskScore
    ) external onlyRole(COMPLIANCE_ADMIN) {
        ComplianceStatus storage status = complianceStatus[account];
        status.amlCleared = cleared;
        status.riskScore = riskScore;
        status.lastUpdate = block.timestamp;

        emit AMLStatusUpdated(account, cleared, riskScore);
    }

    function addComplianceReport(
        address account,
        string calldata reportType,
        string calldata details
    ) external onlyRole(REPORTER_ROLE) {
        ComplianceReport memory report = ComplianceReport({
            reportType: reportType,
            details: details,
            timestamp: block.timestamp,
            reporter: msg.sender
        });

        complianceReports[account].push(report);
        emit ComplianceReportAdded(account, reportType);
    }

    function setJurisdictionApproval(
        address account,
        string calldata jurisdiction,
        bool approved
    ) external onlyRole(COMPLIANCE_ADMIN) {
        jurisdictionApprovals[jurisdiction][account] = approved;
        emit JurisdictionApprovalUpdated(account, jurisdiction, approved);
    }

    function getComplianceStatus(address account) external view returns (
        bool kycVerified,
        uint256 kycLevel,
        uint256 kycExpiry,
        bool amlCleared,
        uint256 riskScore,
        uint256 lastUpdate
    ) {
        ComplianceStatus storage status = complianceStatus[account];
        return (
            status.kycVerified,
            status.kycLevel,
            status.kycExpiry,
            status.amlCleared,
            status.riskScore,
            status.lastUpdate
        );
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
} 