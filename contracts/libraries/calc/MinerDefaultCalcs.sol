//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../FullMath.sol";

/**
 * @title Calculations for when miner initiates default
 * @author Alkimiya Team
 */

library MinerDefaultCalcs {
    /**
     * @notice  Calculates total payment to miner from contract when default
     * executes.
     * day: Day of contract default. Miner successfully paid until day-1.
     * period: Duration of contract
     * @dev totalPayment * (1 - haircut)
     * In solidity, calculation is done using fixed-point arithmetic
     */
    function getRewardToMinerOnBuyerDefault(
        uint256 totalPayment,
        uint256 haircutPct
    ) internal pure returns (uint256) {
        require(
            haircutPct <= 100000000,
            "Scaled haircut PCT cannot be greater than 100000000"
        );
        uint256 haircutPctRemainder = uint256(100000000) - haircutPct;
        return FullMath.mulDiv(haircutPctRemainder, totalPayment, 100000000);
    }
}
