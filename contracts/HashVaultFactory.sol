//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/hashvault/IHashVault.sol";

/**
 * @notice Factory contract for HashVault
 * @author Alkimiya Team
 */
contract HashVaultFactory is Ownable {
    address public master;

    event NewHashVault(
        address indexed ownerAddress,
        address paymentTokenAddress,
        address rewardTokenAddress,
        uint256 dateOfStart,
        address hashVaultAddress,
        uint256 duration,
        uint256 adminFee,
        uint256 cooling,
        uint256 maxDeposits,
        uint256 minDeposits
    );

    using Clones for address;

    constructor(address _master) {
        require(_master != address(0), "Master address cannot be zero");
        master = _master;
    }

    function createHashVault(
        address paymentTokenAddress,
        address rewardTokenAddress,
        uint256 dateOfStart,
        uint256 duration,
        uint256 adminFee,
        uint256 cooling,
        uint256 maxDeposits,
        uint256 minDeposits,
        address swapRouterAddress
    ) external returns (address) {
        address payable newContractAddress = payable(master.clone());
        IHashVault newHashVault = IHashVault(newContractAddress);
        newHashVault.initialize(
            msg.sender,
            paymentTokenAddress,
            rewardTokenAddress,
            dateOfStart,
            duration,
            adminFee,
            cooling,
            maxDeposits,
            minDeposits,
            swapRouterAddress
        );
        emit NewHashVault(
            msg.sender,
            paymentTokenAddress,
            rewardTokenAddress,
            dateOfStart,
            newContractAddress,
            duration,
            adminFee,
            cooling,
            maxDeposits,
            minDeposits
        );
        return newContractAddress;
    }
}
