// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../base/BaseStablecoin.sol";

contract XAUT is BaseStablecoin {
    uint8 private constant DECIMALS = 6; // XAUT uses 6 decimals

    // Gold bar tracking with enhanced features
    struct GoldBarXAUT {
        string serialNumber;
        uint256 weight; // in troy ounces (with 6 decimals)
        string refinery;
        uint256 purity; // 999.9 = 9999
        string location;
        uint256 mintDate;
        bool active;
    }

    // Gold bar management
    mapping(uint256 => GoldBarXAUT) public goldBars;
    mapping(uint256 => address) public barOwners;
    mapping(address => uint256[]) public ownedBars;
    uint256 public totalBars;

    // Minimum transfer amount (0.01 troy ounce)
    uint256 public constant MIN_TRANSFER = 10000; // 0.01 * 10^6

    // Events
    event GoldBarAdded(
        uint256 indexed barId,
        string serialNumber,
        uint256 weight,
        string refinery
    );
    event GoldBarDeactivated(uint256 indexed barId);
    event GoldBarOwnershipTransferred(
        uint256 indexed barId,
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor() BaseStablecoin("Tether Gold", "XAUT", "XAU") {}

    function addGoldBar(
        string calldata serialNumber,
        uint256 weight,
        string calldata refinery,
        uint256 purity,
        string calldata location
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(purity <= 9999, "Invalid purity value");
        
        totalBars++;
        goldBars[totalBars] = GoldBarXAUT({
            serialNumber: serialNumber,
            weight: weight,
            refinery: refinery,
            purity: purity,
            location: location,
            mintDate: block.timestamp,
            active: true
        });

        emit GoldBarAdded(totalBars, serialNumber, weight, refinery);
    }

    function deactivateGoldBar(uint256 barId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(goldBars[barId].active, "Bar already inactive");
        goldBars[barId].active = false;
        emit GoldBarDeactivated(barId);
    }

    function assignBarOwnership(uint256 barId, address owner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(goldBars[barId].active, "Bar is not active");
        
        // Remove from previous owner
        if (barOwners[barId] != address(0)) {
            uint256[] storage previousOwnerBars = ownedBars[barOwners[barId]];
            for (uint256 i = 0; i < previousOwnerBars.length; i++) {
                if (previousOwnerBars[i] == barId) {
                    previousOwnerBars[i] = previousOwnerBars[previousOwnerBars.length - 1];
                    previousOwnerBars.pop();
                    break;
                }
            }
        }

        // Assign to new owner
        barOwners[barId] = owner;
        ownedBars[owner].push(barId);

        emit GoldBarOwnershipTransferred(barId, barOwners[barId], owner);
    }

    function getOwnedBars(address owner) external view returns (uint256[] memory) {
        return ownedBars[owner];
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        
        // Minimum transfer amount check (except for burning)
        if (from != address(0) && to != address(0)) {
            require(amount >= MIN_TRANSFER, "Transfer amount too small");
        }
    }
} 