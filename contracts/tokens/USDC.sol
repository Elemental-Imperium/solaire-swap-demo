// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract USDC is BaseStablecoin {
    uint8 private constant DECIMALS = 6;

    constructor() BaseStablecoin("USD Coin", "USDC", "USD") {
        // USDC uses 6 decimals instead of standard 18
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
} 