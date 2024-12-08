// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract BaseStablecoinV2 is 
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ISO-4217 currency code
    string public currencyCode;
    
    // Compliance version
    string public constant COMPLIANCE_VERSION = "2.0.0";
    
    // Compliance tracking
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isBlacklisted;
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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        string memory _currencyCode,
        address admin
    ) public initializer {
        __ERC20_init(name, symbol);
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(BURNER_ROLE, admin);
        _setupRole(COMPLIANCE_ROLE, admin);
        _setupRole(UPGRADER_ROLE, admin);

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

    // ... (rest of the functions remain the same)

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
} 