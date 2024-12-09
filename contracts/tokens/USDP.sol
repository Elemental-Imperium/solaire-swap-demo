// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../BaseToken.sol";

contract USDP is BaseToken {
    function initialize(address owner) public initializer {
        super.initialize("Pax Dollar", "USDP", owner);
    }

    // Add storage gap for future upgrades
    uint256[50] private __gap;
}
