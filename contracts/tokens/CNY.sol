// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseFiatStablecoin.sol";

contract CNY is BaseFiatStablecoin {
    uint8 private constant DECIMALS = 2;
    
    // PBOC (People's Bank of China) compliance
    mapping(address => bool) public pbocCompliant;
    mapping(address => uint256) public socialCreditScore;
    
    event PBOCComplianceUpdated(address indexed account, bool status);
    event SocialCreditUpdated(address indexed account, uint256 score);

    constructor() BaseFiatStablecoin(
        "Chinese Yuan Stablecoin",
        "CNY",
        "CNY",
        DECIMALS
    ) {
        kycLevelLimits[1] = 50000 * 10**DECIMALS;
        kycLevelLimits[2] = 1000000 * 10**DECIMALS;
    }

    function setPBOCCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        pbocCompliant[account] = status;
        emit PBOCComplianceUpdated(account, status);
    }

    function setSocialCreditScore(address account, uint256 score) external onlyRole(COMPLIANCE_ROLE) {
        socialCreditScore[account] = score;
        emit SocialCreditUpdated(account, score);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(
            from == address(0) || to == address(0) || 
            (pbocCompliant[from] && pbocCompliant[to] &&
            socialCreditScore[from] >= 600 && socialCreditScore[to] >= 600),
            "PBOC compliance and sufficient social credit required"
        );
    }
} 