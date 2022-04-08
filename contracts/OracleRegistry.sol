// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOracleRegistry.sol";

contract OracleRegistry is Ownable, IOracleRegistry {
    mapping(address => mapping(uint16 => address)) public oracleRegistry;

    /**
     * @notice Override getOracleAddress from IOracleRegistry
     */
    function getOracleAddress(address _token, uint16 _oracleType)
        public
        view
        override
        returns (address)
    {
        return oracleRegistry[_token][_oracleType];
    }

    /**
     * @notice Set the Oracle address by the Oracle Registry contract
     */
    function setOracleAddress(
        address _token,
        uint16 _oracleType,
        address _oracleAddr
    ) public onlyOwner {
        oracleRegistry[_token][_oracleType] = _oracleAddr;
        emit OracleRegistered(_token, _oracleType, _oracleAddr);
    }
}
