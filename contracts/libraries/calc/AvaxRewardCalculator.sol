// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../FullMath.sol";

/**
 * @title Calculations for when buyer initiates default
 * @author Alkimiya Team
 */
library AvaxRewardCalculator {
    uint256 internal constant SCALING_FACTOR = 1e8;

    function calculateRewardDueNextUpdate(
        uint256 daysPassed,
        uint256 _stakedAmount,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale,
        uint256 _totalSold,
        uint256 _totalSupply
    ) internal pure returns (uint256) {
        uint256 stakingDuration = 24 * daysPassed;

        return
            (24 *
                ((_stakedAmount * _totalSold) / 10**18) *
                ((_supplyCap - _currentSupply) *
                    ((_maxConsumptionRate - _minConsumptionRate) *
                        stakingDuration +
                        _minConsumptionRate *
                        _mintingPeriod))) /
            ((_currentSupply *
                _maxStakingDuration *
                _mintingPeriod *
                _scale *
                _totalSupply) / 10**18);
    }

    function calculateRewardDueNextUpdate(
        uint256 daysPassed,
        uint256 _stakedAmount,
        uint256 _currentSupply,
        uint256 _supplyCap,
        uint256 _maxStakingDuration,
        uint256 _maxConsumptionRate,
        uint256 _minConsumptionRate,
        uint256 _mintingPeriod,
        uint256 _scale
    ) internal pure returns (uint256) {
        uint256 stakingDuration = 24 * daysPassed;

        return
            (24 *
                _stakedAmount *
                ((_supplyCap - _currentSupply) *
                    ((_maxConsumptionRate - _minConsumptionRate) *
                        stakingDuration +
                        _minConsumptionRate *
                        _mintingPeriod))) /
            (_currentSupply * _maxStakingDuration * _mintingPeriod * _scale);
    }
}
