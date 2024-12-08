// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract PHP is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 2;
    
    // BSP (Bangko Sentral ng Pilipinas) compliance
    mapping(address => bool) public bspCompliant;
    
    event BSPComplianceUpdated(address indexed account, bool status);

    constructor() BaseFiatStablecoin(
        "Philippine Peso Stablecoin",
        "PHP",
        "PHP",
        DECIMALS
    ) {
        // Set KYC level limits according to BSP regulations
        kycLevelLimits[1] = 50000 * 10**DECIMALS;  // Basic KYC
        kycLevelLimits[2] = 500000 * 10**DECIMALS; // Enhanced KYC
    }

    function setBSPCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        bspCompliant[account] = status;
        emit BSPComplianceUpdated(account, status);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(
            from == address(0) || to == address(0) || 
            bspCompliant[from] && bspCompliant[to],
            "BSP compliance required"
        );
    }
} 