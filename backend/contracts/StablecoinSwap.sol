// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StablecoinSwap is ReentrancyGuard, Ownable, Pausable {
    // Constants
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant SLIPPAGE_DENOMINATOR = 10000;
    
    // State variables
    mapping(address => bool) public supportedTokens;
    uint256 public swapFee = 3; // 0.03%
    uint256 public maxSlippage = 100; // 1%
    
    // Events
    event TokenSwapped(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event FeeUpdated(uint256 newFee);
    event MaxSlippageUpdated(uint256 newMaxSlippage);
    
    // Modifiers
    modifier validSlippage(uint256 minAmountOut, uint256 actualAmountOut) {
        require(
            actualAmountOut >= minAmountOut,
            "Slippage tolerance exceeded"
        );
        _;
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
    
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    function setSwapFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high"); // Max 1%
        swapFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    function setMaxSlippage(uint256 newMaxSlippage) external onlyOwner {
        require(newMaxSlippage <= 1000, "Max slippage too high"); // Max 10%
        maxSlippage = newMaxSlippage;
        emit MaxSlippageUpdated(newMaxSlippage);
    }
    
    // Main functions
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(supportedTokens[tokenIn], "Token in not supported");
        require(supportedTokens[tokenOut], "Token out not supported");
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Calculate amounts
        uint256 fee = (amountIn * swapFee) / FEE_DENOMINATOR;
        amountOut = amountIn - fee;
        
        // Check slippage
        require(
            amountOut >= minAmountOut,
            "Insufficient output amount"
        );
        
        // Execute transfers
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        emit TokenSwapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }
    
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut, uint256 minAmountOut) {
        require(supportedTokens[tokenIn], "Token in not supported");
        require(supportedTokens[tokenOut], "Token out not supported");
        
        uint256 fee = (amountIn * swapFee) / FEE_DENOMINATOR;
        amountOut = amountIn - fee;
        
        // Calculate minimum amount with max slippage
        uint256 maxSlippageAmount = (amountOut * maxSlippage) / SLIPPAGE_DENOMINATOR;
        minAmountOut = amountOut - maxSlippageAmount;
        
        return (amountOut, minAmountOut);
    }
    
    function withdrawFees(address token, uint256 amount) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        IERC20(token).transfer(owner(), amount);
    }
} 