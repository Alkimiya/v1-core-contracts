// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IOracle.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Alkimiya Oracle
 * @author Alkimiya Team
 */
contract Oracle is AccessControl, IOracle {
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
        uint256 indexed referenceDay,
        uint256 indexed referenceBlock,
        uint256 hashrate,
        uint256 reward,
        uint256 fees,
        uint256 difficulty,
        uint256 timestamp
    );

    struct AlkimiyaIndex {
        uint32 referenceBlock;
        uint32 timestamp;
        uint128 hashrate;
        uint64 difficulty;
        uint256 reward;
        uint256 fees;
    }

    constructor(string memory _name) {
        _setupRole(PUBLISHER_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        name = _name;
    }

    /**
     * @notice Override updateIndex from IOracle
     */
    function updateIndex(
        uint256 _referenceDay,
        uint256 _referenceBlock,
        uint256 _hashrate,
        uint256 _reward,
        uint256 _fees,
        uint256 _difficulty,
        bytes memory signature
    ) public override returns (bool success) {
        require(
            _referenceDay <= type(uint32).max,
            "ReferenceDay cannot exceed max val"
        );
        require(
            _hashrate <= type(uint128).max,
            "Hashrate cannot exceed max val"
        );
        require(
            _difficulty <= type(uint64).max,
            "Difficulty cannot exceed max val"
        );
        require(
            _referenceBlock <= type(uint32).max,
            "Reference block cannot exceed max val"
        );

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
                        _hashrate,
                        _reward,
                        _fees,
                        _difficulty
                    )
                )
            )
        );

        // require(signatureAddress != msg.sender, "Invalid publisher signature");
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
        index[convertedReferenceDay].reward = _reward;
        index[convertedReferenceDay].hashrate = uint128(_hashrate);
        index[convertedReferenceDay].fees = _fees;
        index[convertedReferenceDay].difficulty = uint64(_difficulty);
        index[convertedReferenceDay].referenceBlock = uint32(_referenceBlock);

        if (_referenceDay > lastIndexedDay) {
            lastIndexedDay = convertedReferenceDay;
        }

        emit OracleUpdate(
            msg.sender,
            _referenceDay,
            _referenceBlock,
            _hashrate,
            _reward,
            _fees,
            _difficulty,
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
            uint256 hashrate,
            uint256 reward,
            uint256 fees,
            uint256 difficulty,
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
            current.hashrate,
            current.reward,
            current.fees,
            current.difficulty,
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
