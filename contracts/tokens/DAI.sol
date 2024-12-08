// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract DAI is BaseStablecoin {
    // DAI specific governance parameters
    uint256 public stabilityFee;
    uint256 public liquidationRatio;

    constructor() BaseStablecoin("Dai Stablecoin", "DAI", "USD") {
        stabilityFee = 1000; // 1% annual stability fee
        liquidationRatio = 150; // 150% collateralization ratio
    }

    function setStabilityFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stabilityFee = _fee;
    }

    function setLiquidationRatio(uint256 _ratio) external onlyRole(DEFAULT_ADMIN_ROLE) {
        liquidationRatio = _ratio;
    }
} 