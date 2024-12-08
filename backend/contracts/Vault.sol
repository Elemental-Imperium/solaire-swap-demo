// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable, Pausable {
    // State variables
    mapping(address => uint256) public deposits;
    mapping(address => bool) public supportedStablecoins;
    AggregatorV3Interface private immutable priceFeed;
    uint256 private constant PRICE_PRECISION = 1e8;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, address stablecoin);
    event StablecoinAdded(address indexed token);
    event StablecoinRemoved(address indexed token);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(address _priceFeed) {
        require(_priceFeed != address(0), "Invalid price feed address");
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Stablecoin management
    function addStablecoin(address stablecoin) external onlyOwner {
        require(stablecoin != address(0), "Invalid stablecoin address");
        supportedStablecoins[stablecoin] = true;
        emit StablecoinAdded(stablecoin);
    }

    function removeStablecoin(address stablecoin) external onlyOwner {
        supportedStablecoins[stablecoin] = false;
        emit StablecoinRemoved(stablecoin);
    }

    // Main functions
    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Deposit must be greater than zero");
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdrawStable(uint256 amount, address stablecoin) external whenNotPaused {
        require(supportedStablecoins[stablecoin], "Stablecoin not supported");
        uint256 ethRequired = getEthRequiredForStablecoins(amount);
        require(deposits[msg.sender] >= ethRequired, "Insufficient deposit");

        deposits[msg.sender] -= ethRequired;
        IERC20(stablecoin).transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, stablecoin);
    }

    function emergencyWithdraw() external whenPaused {
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "No deposits to withdraw");
        
        deposits[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit EmergencyWithdraw(msg.sender, amount);
    }

    // View functions
    function getEthPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed data");
        return uint256(price);
    }

    function getEthRequiredForStablecoins(uint256 stablecoinAmount) public view returns (uint256) {
        uint256 ethPrice = getEthPrice();
        return (stablecoinAmount * PRICE_PRECISION) / ethPrice;
    }
} 