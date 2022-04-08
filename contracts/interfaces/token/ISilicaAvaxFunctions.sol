//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

/**
 * @title Interface that includes core functions for silica contracts
 * @author Alkimiya Team
 */
interface ISilicaAvaxFunctions {
    function initialize(
        address _paymentToken,
        address _seller,
        uint256 _price, //price per avax staked per day
        uint256 _stakedAmount,
        uint256 _contractPeriod,
        uint256 _amountLockedOnCreate
    ) external;

    function defaultContract(
        uint32 day,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale
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

    function fulfillUpdate(
        uint256 _nextUpdateDay,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale
    ) external returns (uint256);

    function tryToStartContract(
        uint32 day,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale
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
