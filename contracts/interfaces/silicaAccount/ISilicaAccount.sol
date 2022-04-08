//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "./ISilicaAccountEvents.sol";

/**
 * @title Interface for Silica Account for ERC20 assets
 * @author Alkimiya team
 * @notice This class needs to be inherited
 */
interface ISilicaAccount is ISilicaAccountEvents {
    function isERC20() external pure returns (bool);

    function getBalance() external view returns (uint256);

    function getNextUpdateDay() external view returns (uint256);

    function getRewardTokenAddress() external view returns (address);

    function initialize(
        address _owner,
        address _rewardTokenAddress,
        uint16 _oracleType
    ) external;

    function transferRewardToBuyer(address _to, uint256 _amount) external;

    function triggerUpdate() external;

    function withdrawExcessReward(uint256 amount) external;

    function getAvailableBalance() external returns (uint256);
}
