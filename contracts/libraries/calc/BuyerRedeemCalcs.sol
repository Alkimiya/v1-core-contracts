//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../FullMath.sol";

/**
 * @title Calculations for when buyer redeems contract
 * @author Alkimiya Team
 */

library BuyerRedeemCalcs {
    /**
     * @notice  Calculates buyer's reward when contract completes.
     * @dev result = tokenBalance * (totalReward / hashrate)
     */
    function getBuyerRedeem(
        uint256 tokenBalance,
        uint256 totalReward,
        uint256 hashrate
    ) internal pure returns (uint256) {
        return FullMath.mulDiv(tokenBalance, totalReward, hashrate);
    }
}
