// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../BaseToken.sol";

contract PAXG is BaseToken {
    function initialize(address owner) public initializer {
        super.initialize("Paxos Gold", "PAXG", owner);
    }

    // Add storage gap for future upgrades
    uint256[50] private __gap;
}
