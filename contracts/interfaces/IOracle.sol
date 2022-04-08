//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @title Alkimiya Oracle
 * @author Alkimiya Team
 * @notice This is the interface for Oracle contract
 * */
interface IOracle {
    /**
     * @notice Return the Network data on a given day
     */
    function get(uint256 _date)
        external
        view
        returns (
            uint256 date,
            uint256 referenceBlock,
            uint256 hashrate,
            uint256 reward,
            uint256 fees,
            uint256 difficulty,
            uint256 timestamp
        );

    /**
     * @notice Return the Network data on a given day is updated to Oracle
     */
    function isDayIndexed(uint256 _referenceDay) external view returns (bool);

    /**
     * @notice Return the last day on which the Oracle is updated
     */
    function getLastIndexedDay() external view returns (uint32);

    /**
     * @notice Update the Alkimiya Index on Oracle for a given day
     */
    function updateIndex(
        uint256 _referenceDay,
        uint256 _referenceBlock,
        uint256 _hashrate,
        uint256 _reward,
        uint256 _fees,
        uint256 _difficulty,
        bytes memory signature
    ) external returns (bool success);
}
