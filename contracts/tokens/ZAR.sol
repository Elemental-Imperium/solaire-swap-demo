// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract ZAR is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 2;
    
    // SARB (South African Reserve Bank) compliance
    mapping(address => bool) public sarbCompliant;
    mapping(address => bool) public faisCompliant; // Financial Advisory and Intermediary Services
    
    event SARBComplianceUpdated(address indexed account, bool status);
    event FAISComplianceUpdated(address indexed account, bool status);

    constructor() BaseFiatStablecoin(
        "South African Rand Stablecoin",
        "ZAR",
        "ZAR",
        DECIMALS
    ) {
        kycLevelLimits[1] = 5000 * 10**DECIMALS;
        kycLevelLimits[2] = 50000 * 10**DECIMALS;
    }

    function setSARBCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        sarbCompliant[account] = status;
        emit SARBComplianceUpdated(account, status);
    }

    function setFAISCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        faisCompliant[account] = status;
        emit FAISComplianceUpdated(account, status);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(
            from == address(0) || to == address(0) || 
            (sarbCompliant[from] && sarbCompliant[to] &&
            faisCompliant[from] && faisCompliant[to]),
            "SARB and FAIS compliance required"
        );
    }
} 