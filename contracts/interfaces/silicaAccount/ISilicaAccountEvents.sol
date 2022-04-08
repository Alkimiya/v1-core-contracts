//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @title Events emitted by the contract
 * @author Alkimiya team
 * @notice Contains all events emitted by a Silica contract
 */
interface ISilicaAccountEvents {
    event Received(address, uint256);

    event NewSilicaContract(
        address indexed silicaAddress,
        address owner, //address of newly created contract
        address paymentTokenAddress,
        uint256 resourceAmount,
        uint256 period,
        uint256 reservedPrice,
        uint16 oracleType
    );

    event SilicaAccountUpdate(address indexed from, uint256 day);

    event WithdrawExcessReward(uint256 amount);
}
