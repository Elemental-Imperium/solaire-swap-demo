// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract EURT is BaseStablecoin {
    uint8 private constant DECIMALS = 6; // EURT uses 6 decimals like USDT

    // European regulatory compliance
    mapping(address => bool) public emrtCompliant; // European Money Remittance Transfer compliance
    mapping(address => uint256) public transferLimits; // Daily transfer limits in EURT
    mapping(address => uint256) public dailyTransferred; // Track daily transfers
    mapping(address => uint256) public lastTransferDay; // Track transfer reset day

    event EMRTStatusUpdated(address indexed account, bool status);
    event TransferLimitUpdated(address indexed account, uint256 limit);
    event DailyLimitReset(address indexed account);

    constructor() BaseStablecoin("Euro Tether", "EURT", "EUR") {}

    function setEMRTCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        emrtCompliant[account] = status;
        emit EMRTStatusUpdated(account, status);
    }

    function setTransferLimit(address account, uint256 limit) external onlyRole(COMPLIANCE_ROLE) {
        transferLimits[account] = limit;
        emit TransferLimitUpdated(account, limit);
    }

    function resetDailyLimit(address account) internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (lastTransferDay[account] < currentDay) {
            dailyTransferred[account] = 0;
            lastTransferDay[account] = currentDay;
            emit DailyLimitReset(account);
        }
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
        
        // Skip checks for minting and burning
        if (from != address(0) && to != address(0)) {
            require(
                emrtCompliant[from] && emrtCompliant[to],
                "EMRT compliance required"
            );

            resetDailyLimit(from);
            require(
                dailyTransferred[from] + amount <= transferLimits[from],
                "Daily transfer limit exceeded"
            );
            dailyTransferred[from] += amount;
        }
    }
} 