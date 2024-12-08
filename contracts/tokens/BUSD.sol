// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract BUSD is BaseStablecoin {
    uint8 private constant DECIMALS = 18;
    
    // Supply control role
    bytes32 public constant SUPPLY_CONTROLLER_ROLE = keccak256("SUPPLY_CONTROLLER_ROLE");

    // Supply caps
    uint256 public supplyCap;

    event SupplyCapUpdated(uint256 newCap);

    constructor() BaseStablecoin("Binance USD", "BUSD", "USD") {
        _setupRole(SUPPLY_CONTROLLER_ROLE, msg.sender);
        supplyCap = 100_000_000_000 * 10**DECIMALS; // 100B initial cap
    }

    function setSupplyCap(uint256 _newCap) external onlyRole(SUPPLY_CONTROLLER_ROLE) {
        supplyCap = _newCap;
        emit SupplyCapUpdated(_newCap);
    }

    function mint(address to, uint256 amount) external override onlyRole(MINTER_ROLE) whenNotPaused {
        require(totalSupply() + amount <= supplyCap, "Supply cap exceeded");
        super.mint(to, amount);
    }
} 