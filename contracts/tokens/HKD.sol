// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../BaseToken.sol";

contract HKD is BaseToken {
    function initialize(address owner) public initializer {
        super.initialize("Hong Kong Dollar", "HKD", owner);
    }

    // Add storage gap for future upgrades
    uint256[50] private __gap;
}
