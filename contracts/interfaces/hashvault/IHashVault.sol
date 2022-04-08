//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @title Interface for HashVault
 * @author Alkimiya team
 * @notice This class needs to be inherited
 */
interface IHashVault {
    event DepositConfirmed(
        address indexed buyerAddress,
        uint256 depositAmount,
        uint256 timestamp,
        address hashVault
    );

    event PurchaseConfirmed(
        address indexed vaultAdminAddress,
        address silicaAddress,
        uint256 amount,
        uint256 timestamp,
        address hashVault
    );

    function initialize(
        address _owner,
        address _paymentToken,
        address _rewardToken,
        uint256 _dateOfStart,
        uint256 _duration,
        uint256 _coolingDuration,
        uint256 _adminFee,
        uint256 _maxDeposits,
        uint256 _minDeposits,
        address _swapRouterAddress
    ) external;

    function start() external;

    function deposit(uint256 depositAmount) external;

    function purchaseSilica(address silicaAddress, uint256 amount) external;

    function swapRewards(uint256 amount) external;

    function liquidateSingleSilica(address silicaAddress) external;

    function liquidateAllSilicas() external;

    function calculateShares() external;

    function withdraw() external;

    function restart() external;

    function withdrawAdmin() external;

    function allocation() external view returns (uint256);
}
