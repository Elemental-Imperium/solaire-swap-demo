// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract StablecoinProxyAdmin is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    uint256 public constant UPGRADE_TIMELOCK = 2 days;
    
    struct UpgradeRequest {
        address newImplementation;
        uint256 timestamp;
        bool approved;
    }
    
    mapping(address => UpgradeRequest) public upgradeRequests;
    
    event UpgradeRequested(address indexed proxy, address indexed implementation);
    event UpgradeApproved(address indexed proxy, address indexed implementation);
    event UpgradeCancelled(address indexed proxy);

    function initialize(address admin) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function requestUpgrade(
        address proxy,
        address newImplementation
    ) external onlyRole(UPGRADER_ROLE) whenNotPaused {
        require(newImplementation != address(0), "Invalid implementation");
        
        upgradeRequests[proxy] = UpgradeRequest({
            newImplementation: newImplementation,
            timestamp: block.timestamp,
            approved: false
        });
        
        emit UpgradeRequested(proxy, newImplementation);
    }

    function approveUpgrade(address proxy) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        UpgradeRequest storage request = upgradeRequests[proxy];
        require(request.newImplementation != address(0), "No pending upgrade");
        require(block.timestamp >= request.timestamp + UPGRADE_TIMELOCK, "Timelock not expired");
        
        request.approved = true;
        emit UpgradeApproved(proxy, request.newImplementation);
    }

    function cancelUpgrade(address proxy) external onlyRole(UPGRADER_ROLE) {
        delete upgradeRequests[proxy];
        emit UpgradeCancelled(proxy);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // Add storage gap for future upgrades
    uint256[50] private __gap;
} 