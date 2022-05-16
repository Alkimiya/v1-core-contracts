// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/**
 * @title Alkimiya Oracle Addresses
 * @author Alkimiya Team
 * */
interface IOracleRegistry {
    event OracleRegistered(
        address token,
        uint16 oracleType,
        address oracleAddr
    );

    function getOracleAddress(address _token, uint16 _oracleType)
        external
        view
        returns (address);
}
