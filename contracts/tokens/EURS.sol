// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract EURS is BaseStablecoin {
    uint8 private constant DECIMALS = 2; // EURS uses 2 decimals

    // Euro-specific compliance
    mapping(address => bool) public mifidCompliant;
    
    event MiFIDStatusUpdated(address indexed account, bool status);

    constructor() BaseStablecoin("STASIS EURO", "EURS", "EUR") {}

    function setMiFIDCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        mifidCompliant[account] = status;
        emit MiFIDStatusUpdated(account, status);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(
            from == address(0) || to == address(0) || 
            mifidCompliant[from] && mifidCompliant[to],
            "MiFID compliance required"
        );
    }
} 