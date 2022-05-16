// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../FullMath.sol";

/**
 * @title Responsible for minting Silica
 * @author Alkimiya Team
 */
library SilicaMinter {
    /**
     * @notice Calculate mint amount of Silica token from buyer's bid.
     * @dev result = hashrate * (purchaseAmount / reservedPrice)
     */
    function calculateMintAmount(
        uint256 consensusResource,
        uint256 purchaseAmount,
        uint256 reservedPrice
    ) internal pure returns (uint256) {
        uint256 mintAmount = FullMath.mulDiv(
            consensusResource,
            purchaseAmount,
            reservedPrice
        );
        require(mintAmount > 0, "Value below minimum");
        return mintAmount;
    }
}
