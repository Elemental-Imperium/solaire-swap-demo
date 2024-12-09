// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseStablecoin.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract BaseFiatStablecoin is Initializable, BaseStablecoin {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // Storage gaps for future upgrades
    uint256[50] private __gap;
    
    // KYC levels
    mapping(address => uint256) public kycLevels;
    
    // Regional compliance
    mapping(address => bool) public hasRegionalCompliance;
    mapping(string => bool) public isRegionRestricted;
    mapping(address => string) public userRegions;
    
    // Events
    event KYCLevelSet(address indexed account, uint256 level);
    event RegionalComplianceSet(address indexed account, bool status);
    event RegionRestrictionSet(string region, bool restricted);
    event UserRegionSet(address indexed account, string region);

    function initialize(
        string memory name,
        string memory symbol
    ) public virtual override initializer {
        super.initialize(name, symbol);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
    }

    function setKYCLevel(address account, uint256 level) external onlyRole(COMPLIANCE_ROLE) {
        kycLevels[account] = level;
        emit KYCLevelSet(account, level);
    }

    function setRegionalCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        hasRegionalCompliance[account] = status;
        emit RegionalComplianceSet(account, status);
    }

    function setRegionRestriction(string calldata region, bool restricted) external onlyRole(COMPLIANCE_ROLE) {
        isRegionRestricted[region] = restricted;
        emit RegionRestrictionSet(region, restricted);
    }

    function setUserRegion(address account, string calldata region) external onlyRole(COMPLIANCE_ROLE) {
        userRegions[account] = region;
        emit UserRegionSet(account, region);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        // Skip checks for minting and burning
        if (from != address(0) && to != address(0)) {
            require(kycLevels[from] > 0 && kycLevels[to] > 0, "KYC required");
            require(
                hasRegionalCompliance[from] && 
                hasRegionalCompliance[to], 
                "Regional compliance required"
            );
            require(
                !isRegionRestricted[userRegions[from]] && 
                !isRegionRestricted[userRegions[to]], 
                "Region restricted"
            );
        }
    }
} 