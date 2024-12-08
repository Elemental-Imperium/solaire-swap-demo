// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract USDT is BaseStablecoin {
    constructor() BaseStablecoin("Tether USD", "USDT", "USD") {
        // Additional USDT-specific initialization
    }

    // USDT-specific functions can be added here
} 