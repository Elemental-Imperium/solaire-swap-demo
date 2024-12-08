// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseStablecoin.sol";

abstract contract BaseFiatStablecoin is BaseStablecoin {
    // Regional compliance tracking
    mapping(address => bool) public regionalCompliance;
    mapping(address => uint256) public kycLevel;
    mapping(address => uint256) public lastKycUpdate;
    
    // Transaction limits based on KYC level
    mapping(uint256 => uint256) public kycLevelLimits;
    
    // Regional restrictions
    mapping(string => bool) public restrictedRegions;
    mapping(address => string) public userRegion;

    event KYCLevelUpdated(address indexed account, uint256 level);
    event RegionalComplianceUpdated(address indexed account, bool status);
    event RegionRestrictionUpdated(string region, bool restricted);
    event UserRegionUpdated(address indexed account, string region);

    constructor(
        string memory name,
        string memory symbol,
        string memory _currencyCode,
        uint8 _decimals
    ) BaseStablecoin(name, symbol, _currencyCode) {
        _decimals = _decimals;
    }

    function setKYCLevel(address account, uint256 level) external onlyRole(COMPLIANCE_ROLE) {
        kycLevel[account] = level;
        lastKycUpdate[account] = block.timestamp;
        emit KYCLevelUpdated(account, level);
    }

    function setRegionalCompliance(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        regionalCompliance[account] = status;
        emit RegionalComplianceUpdated(account, status);
    }

    function setRegionRestriction(string calldata region, bool restricted) external onlyRole(COMPLIANCE_ROLE) {
        restrictedRegions[region] = restricted;
        emit RegionRestrictionUpdated(region, restricted);
    }

    function setUserRegion(address account, string calldata region) external onlyRole(COMPLIANCE_ROLE) {
        userRegion[account] = region;
        emit UserRegionUpdated(account, region);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            require(regionalCompliance[from] && regionalCompliance[to], "Regional compliance required");
            require(!restrictedRegions[userRegion[from]] && !restrictedRegions[userRegion[to]], "Region restricted");
            require(amount <= kycLevelLimits[kycLevel[from]], "Transfer exceeds KYC level limit");
        }
    }
} 