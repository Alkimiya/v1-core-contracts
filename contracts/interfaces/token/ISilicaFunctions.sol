//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @title Interface that includes core functions for silica contracts
 * @author Alkimiya Team
 */
interface ISilicaFunctions {
    function initialize(
        address _paymentToken,
        uint256 _hashrate,
        uint256 _contractPeriod,
        uint256 _reservedPrice,
        address _seller,
        uint256 _costToCreateContract
    ) external;

    /**
     * @notice An external call to set the Silica contract default
     * @param day the reference day from Oracle
     */
    function defaultContract(
        uint32 day
    ) external;

    /**
     * @notice An external call to try to complete a Silica contract
     * @param day the reference day from Oracle
     * @param remainingBalance the remaining balance from the Silica Account
     * @return success if the Silica can be completed
     * @return dueNextUpdate the amount of reward due for next update
     */
    function tryToCompleteContract(uint32 day, uint256 remainingBalance)
        external
        returns (bool, uint256);

    /**
     * @notice An external call to try to expire a Silica contract
     * @param day the reference day from Oracle
     * @return success if the Silica can be expired
     * @return amountRelease the amount of reward released from the contract
     */
    function tryToExpireContract(uint32 day) external returns (bool, uint256);

    /**
     * @notice An external call to update the Silica contract
     * @param _networkHashrate the average hashrate on the blockchain from Oracle
     * @param _networkReward daily total rewards from Oracle
     * @return amountFulfilled the amount of reward fulfilled into the contract
     */
    function fulfillUpdate(uint256 _networkHashrate, uint256 _networkReward)
        external
        returns (uint256);

    /**
     * @notice An external call to try to start the Silica contract
     * @param day the reference day from Oracle
     * @param _networkHashrate the average hashrate on the blockchain from Oracle
     * @param _networkReward daily total rewards from Oracle
     * @return success if the Silica starts
     * @return amountRefund the amount of reward refunded when amountLocked is MORE than amountDueToday
     */
    function tryToStartContract(
        uint32 day,
        uint256 _networkHashrate,
        uint256 _networkReward
    ) external returns (bool, uint256);

    /**
     * @notice Return the current reward locked for this contract
     */
    function amountLocked() external view returns (uint256);

    /**
     * @notice Return the amount of reward due when contract ends
     */
    function amountDueAtContractEnd() external view returns (uint256);

    /**
     * @notice Return the amount of the reward due for the next update
     */
    function amountOwedNextUpdate() external view returns (uint256);
}
