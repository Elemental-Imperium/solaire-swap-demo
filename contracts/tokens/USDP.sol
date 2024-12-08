// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract USDP is BaseStablecoin {
    uint8 private constant DECIMALS = 18;
    
    // Asset protection role for USDP
    bytes32 public constant ASSET_PROTECTION_ROLE = keccak256("ASSET_PROTECTION_ROLE");

    // Frozen accounts
    mapping(address => bool) public frozen;

    event AddressFrozen(address indexed account);
    event AddressUnfrozen(address indexed account);

    constructor() BaseStablecoin("Pax Dollar", "USDP", "USD") {
        _setupRole(ASSET_PROTECTION_ROLE, msg.sender);
    }

    function freezeAddress(address account) external onlyRole(ASSET_PROTECTION_ROLE) {
        frozen[account] = true;
        emit AddressFrozen(account);
    }

    function unfreezeAddress(address account) external onlyRole(ASSET_PROTECTION_ROLE) {
        frozen[account] = false;
        emit AddressUnfrozen(account);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!frozen[from] && !frozen[to], "Address is frozen");
    }
} 