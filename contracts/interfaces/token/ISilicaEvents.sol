//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @title Events emitted by the contract
 * @author Alkimiya Team
 * @notice Contains all events emitted by a Silica contract
 */
interface ISilicaEvents {
    /**
     * @notice Emitted when bid is confirmed
     */
    event BidConfirmed(
        address indexed buyer,
        uint256 purchaseAmount,
        uint256 mintedTokens,
        uint256 timestamp
    );

    /**
     * @notice Emitted when Buyer redeems rewards
     */
    event BuyerRedeem(
        address indexed buyer,
        uint256 rewardAmount,
        uint256 tokensBurned
    );

    /**
     * @notice Emitted when Seller redeems payments
     */
    event SellerRedeem(address indexed seller, uint256 paymentAmount);

    /**
     * @notice Emitted when Buyer settles default
     */
    event BuyerDefault(
        address indexed buyer,
        uint256 paymentAmount,
        uint256 rewardAmount
    );

    /**
     * @notice Emitted when Seller settles default
     */
    event SellerDefault(address indexed seller, uint256 paymentAmount);

    /**
     * @notice Emitted when contract's status changes
     */
    event StatusChange(uint256 newStatus);
}
