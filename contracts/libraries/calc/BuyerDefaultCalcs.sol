//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../FullMath.sol";

/**
 * @title Calculations for when buyer initiates default
 * @author Alkimiya Team
 */
library BuyerDefaultCalcs {
    uint256 internal constant SCALING_FACTOR = 1e8;

    /**
     * @notice Calculates reward given to buyer when contract defaults.
     * @dev result = tokenBalance * (totalReward / hashrate)
     */
    function getRewardToBuyerOnBuyerDefault(
        uint256 tokenBalance,
        uint256 totalReward,
        uint256 hashrateSold
    ) internal pure returns (uint256) {
        return FullMath.mulDiv(tokenBalance, totalReward, hashrateSold);
    }

    /**
     * @notice  Calculates payment returned to buyer when contract defaults.
     * @dev result =  haircut * totalpayment tokenBalance / hashrateSold
     */
    function getBuyerPaymentTokenReturn(
        uint256 tokenBalance,
        uint256 totalPayment,
        uint256 hashrateSold,
        uint256 haircut
    ) internal pure returns (uint256) {
        uint256 result = FullMath.mulDiv(
            tokenBalance,
            totalPayment,
            hashrateSold
        );
        return FullMath.mulDiv(result, haircut, SCALING_FACTOR);
    }
}
