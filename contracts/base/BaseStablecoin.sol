// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

abstract contract BaseStablecoin is ERC20, Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // ISO-4217 currency code
    string public currencyCode;
    
    // Compliance version
    string public constant COMPLIANCE_VERSION = "1.0.0";
    
    // Compliance tracking
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isBlacklisted;
    
    // IBAN tracking
    mapping(address => string) public accountIbans;
    
    // Collateralization tracking
    uint256 public totalCollateral;
    uint256 public collateralRatio;
    
    // Events
    event Whitelisted(address indexed account, bool status);
    event Blacklisted(address indexed account, bool status);
    event IbanRegistered(address indexed account, string iban);
    event CollateralUpdated(uint256 totalCollateral, uint256 collateralRatio);
    event ComplianceCheck(address indexed from, address indexed to, bool passed);
    event ISO20022Transfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        string messageId,
        string purpose
    );

    constructor(
        string memory name,
        string memory symbol,
        string memory _currencyCode
    ) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
        _setupRole(COMPLIANCE_ROLE, msg.sender);
        currencyCode = _currencyCode;
    }

    // Compliance functions
    function setWhitelisted(address account, bool status) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        isWhitelisted[account] = status;
        emit Whitelisted(account, status);
    }

    function setBlacklisted(address account, bool status) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        isBlacklisted[account] = status;
        emit Blacklisted(account, status);
    }

    function registerIban(address account, string calldata iban) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        accountIbans[account] = iban;
        emit IbanRegistered(account, iban);
    }

    function updateCollateral(uint256 _totalCollateral) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        totalCollateral = _totalCollateral;
        collateralRatio = (_totalCollateral * 1e18) / totalSupply();
        emit CollateralUpdated(totalCollateral, collateralRatio);
    }

    // ISO-20022 compliant transfer
    function transferISO20022(
        address to,
        uint256 amount,
        string calldata messageId,
        string calldata purpose
    ) external returns (bool) {
        require(transfer(to, amount), "Transfer failed");
        emit ISO20022Transfer(msg.sender, to, amount, messageId, purpose);
        return true;
    }

    // Override transfer functions to include compliance checks
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token transfers are paused");
        require(!isBlacklisted[from] && !isBlacklisted[to], "Address is blacklisted");
        require(
            from == address(0) || to == address(0) || 
            isWhitelisted[from] && isWhitelisted[to], 
            "Address not whitelisted"
        );
        emit ComplianceCheck(from, to, true);
    }

    // Pause/unpause functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Mint/burn functions
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) 
        external 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
    {
        _burn(from, amount);
    }
} 