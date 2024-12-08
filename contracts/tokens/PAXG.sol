// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract PAXG is BaseStablecoin {
    uint8 private constant DECIMALS = 18;
    
    // Gold bar tracking
    struct GoldBar {
        string serialNumber;
        uint256 weight; // in troy ounces (with 18 decimals)
        string custodian;
    }

    mapping(uint256 => GoldBar) public goldBars;
    uint256 public totalBars;

    event GoldBarAdded(uint256 indexed barId, string serialNumber, uint256 weight);

    constructor() BaseStablecoin("Paxos Gold", "PAXG", "XAU") {}

    function addGoldBar(
        string calldata serialNumber,
        uint256 weight,
        string calldata custodian
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        totalBars++;
        goldBars[totalBars] = GoldBar(serialNumber, weight, custodian);
        emit GoldBarAdded(totalBars, serialNumber, weight);
    }

    function getGoldBarInfo(uint256 barId) external view returns (
        string memory serialNumber,
        uint256 weight,
        string memory custodian
    ) {
        GoldBar memory bar = goldBars[barId];
        return (bar.serialNumber, bar.weight, bar.custodian);
    }
} 