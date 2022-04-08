//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @title Alkimiya Oracle
 * @author Alkimiya Team
 * @notice This is the interface for Oracle contract
 * */
interface ISilicaAccountFactory {
    event NewSilicaAccount(
        address indexed sellerAddress,
        address indexed contractAddress, //address of newly created contract
        address erc20TokenAddress,
        uint16 oracleType // 0 = normal 1 = fee swap  2 = silica pos
    );

    /**
     * @notice Return the Network data on a given day
     */
    function getDeterministicAddress(
        address sellerAddress,
        address erc20TokenAddress,
        uint16 oracleType
    ) external view returns (address);

    /**
     * @notice Return the Network data on a given day is updated to Oracle
     */
    function createSilicaAccount(address erc20TokenAddress, uint16 oracleType)
        external
        returns (address);
}
