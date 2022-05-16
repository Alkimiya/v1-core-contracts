// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IOraclePoS.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Alkimiya Oracle for Proof Of Stake instruments
 * @author Alkimiya Team
 */
contract OraclePoS is AccessControl, IOraclePoS {
    // Constants
    int32 constant OFFSET19700101 = 2440588;
    uint32 constant SECONDS_PER_DAY = 24 * 60 * 60;
    int8 constant VERSION = 1;
    uint32 public lastIndexedDay;

    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");
    bytes32 public constant CALCULATOR_ROLE = keccak256("CALCULATOR_ROLE");

    mapping(uint32 => AlkimiyaIndex) private index; // key == timestamp / SECONDS_PER_DAY

    string public name;

    event OracleUpdate(
        address indexed caller,
        uint32 indexed referenceDay,
        uint256 indexed referenceBlock,
        uint256 currentSupply,
        uint256 supplyCap,
        uint256 maxStakingDuration,
        uint256 maxConsumptionRate,
        uint256 minConsumptionRate,
        uint256 mintingPeriod,
        uint256 scale,
        uint256 timestamp
    );

    struct AlkimiyaIndex {
        uint256 referenceBlock;
        uint256 currentSupply;
        uint256 supplyCap;
        uint256 maxStakingDuration;
        uint256 maxConsumptionRate;
        uint256 minConsumptionRate;
        uint256 mintingPeriod;
        uint256 scale;
        uint256 timestamp;
    }

    constructor(string memory _name) {
        _setupRole(PUBLISHER_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        name = _name;
    }

    /**
     * @notice Override updateIndexPoS from IOracle
     */
    function updateIndex(
        uint32 _referenceDay,
        uint256 _referenceBlock,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale,
        bytes memory signature
    ) external override returns (bool success) {
        require(
            _referenceDay <= type(uint32).max,
            "ReferenceDay cannot exceed max val"
        );
        require(
            _currentSupply <= type(uint256).max,
            "Current Supply cannot exceed max val"
        );
        require(
            _supplyCap <= type(uint256).max,
            "Supply Cap cannot exceed max val"
        );
        require(
            _maxStakingDuration <= type(uint256).max,
            "Max Staking Duration cannot exceed max val"
        );
        require(
            _maxConsumptionRate <= type(uint256).max,
            "Max Consumption Rate cannot exceed max val"
        );
        require(
            _minConsumptionRate <= type(uint256).max,
            "Min Consumption Rate cannot exceed max val"
        );
        require(
            _mintingPeriod <= type(uint256).max,
            "Minting Period cannot exceed max val"
        );
        require(_scale <= type(uint256).max, "Scale cannot exceed max val");

        require(
            hasRole(PUBLISHER_ROLE, msg.sender),
            "Update not allowed to everyone"
        );

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(
                    abi.encode(
                        _referenceDay,
                        _referenceBlock,
                        _currentSupply,
                        _supplyCap,
                        _maxStakingDuration,
                        _maxConsumptionRate,
                        _minConsumptionRate,
                        _mintingPeriod,
                        _scale
                    )
                )
            )
        );

        require(
            hasRole(CALCULATOR_ROLE, ECDSA.recover(messageHash, signature)),
            "Invalid signature"
        );

        require(
            index[uint32(_referenceDay)].timestamp == 0,
            "Information cannot be updated."
        );

        uint32 convertedReferenceDay = uint32(_referenceDay);
        index[convertedReferenceDay].timestamp = uint32(block.timestamp);
        index[convertedReferenceDay].referenceBlock = _referenceBlock;
        index[convertedReferenceDay].currentSupply = _currentSupply;
        index[convertedReferenceDay].supplyCap = _supplyCap;
        index[convertedReferenceDay].maxStakingDuration = _maxStakingDuration;
        index[convertedReferenceDay].maxConsumptionRate = _maxConsumptionRate;
        index[convertedReferenceDay].minConsumptionRate = _minConsumptionRate;
        index[convertedReferenceDay].mintingPeriod = _mintingPeriod;
        index[convertedReferenceDay].scale = _scale;

        if (_referenceDay > lastIndexedDay) {
            lastIndexedDay = convertedReferenceDay;
        }

        emit OracleUpdate(
            msg.sender,
            _referenceDay,
            _referenceBlock,
            _currentSupply,
            _supplyCap,
            _maxStakingDuration,
            _maxConsumptionRate,
            _minConsumptionRate,
            _mintingPeriod,
            _scale,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Override get from IOracle
     */
    function get(uint256 _referenceDay)
        external
        view
        override
        returns (
            uint256 referenceDay,
            uint256 referenceBlock,
            uint256 currentSupply,
            uint256 supplyCap,
            uint256 maxStakingDuration,
            uint256 maxConsumptionRate,
            uint256 minConsumptionRate,
            uint256 mintingPeriod,
            uint256 scale,
            uint256 timestamp
        )
    {
        require(
            _referenceDay <= type(uint32).max,
            "Reference day cannot exceed max val"
        );
        AlkimiyaIndex memory current = index[uint32(_referenceDay)];
        require(current.timestamp != 0, "Date not yet indexed");

        return (
            _referenceDay,
            current.referenceBlock,
            current.currentSupply,
            current.supplyCap,
            current.maxStakingDuration,
            current.maxConsumptionRate,
            current.minConsumptionRate,
            current.mintingPeriod,
            current.scale,
            current.timestamp
        );
    }

    /**
     * @notice Override isDayIndexed from IOracle
     */
    function isDayIndexed(uint256 _referenceDay)
        external
        view
        override
        returns (bool)
    {
        require(
            _referenceDay <= type(uint32).max,
            "Reference day cannot exceed max val"
        );
        return index[uint32(_referenceDay)].timestamp != 0;
    }

    /**
     * @notice Override getLastIndexedDay from IOracle
     */
    function getLastIndexedDay() external view override returns (uint32) {
        return lastIndexedDay;
    }
}
