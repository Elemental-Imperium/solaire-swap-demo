// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract StablecoinProxyAdmin is AccessControl, Pausable {
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

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
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
} 