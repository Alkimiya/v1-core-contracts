import { BigNumber } from "ethers";

const calculateAmountRequiredToCreateContract = (params: {
  stakedAmount: BigNumber;
  currentSupply: BigNumber;
  supplyCap: BigNumber;
}) => {
  // Javascript version of below calculation
  // (24 *
  //     _stakedAmount *
  //     ((_supplyCap - _currentSupply) *
  //         ((_maxConsumptionRate - _minConsumptionRate) *
  //             stakingDuration +
  //             _minConsumptionRate *
  //             _mintingPeriod))) /
  // (_currentSupply * _maxStakingDuration * _mintingPeriod * _scale);

  // Split up calcs like this for my own sanity.
  const var1 = BigNumber.from(24).mul(params.stakedAmount);
  const var2 = params.supplyCap.sub(params.currentSupply);
  const var3 = BigNumber.from(20000).mul(24);
  const var4 = BigNumber.from(100000 * 8760);

  const var5 = params.currentSupply
    .mul(8760)
    .mul(8760)
    .mul(BigNumber.from(1000000));

  const var6 = var3.add(var4);
  const var7 = var2.mul(var6);
  const var8 = var1.mul(var7);
  const var9 = var8.div(var5);
  const result = var9.mul(105).div(100);
  return result;
};

const getExpectedAmountDueAfterXDays = (
  params: {
    stakedAmount: BigNumber;
    currentSupply: BigNumber;
    supplyCap: BigNumber;
  },
  numDays: number
) => {
  const var1 = BigNumber.from(24).mul(params.stakedAmount);
  const var2 = params.supplyCap.sub(params.currentSupply);
  const var3 = BigNumber.from(20000).mul(24 * numDays);
  const var4 = BigNumber.from(100000 * 8760);

  const var5 = params.currentSupply
    .mul(8760)
    .mul(8760)
    .mul(BigNumber.from(1000000));

  const var6 = var3.add(var4);
  const var7 = var2.mul(var6);

  const var8 = var1.mul(var7);
  const var9 = var8.div(var5);

  return var9;
};

const getCumulativeExpectedAmountDueAfterXDays = (
  params: {
    stakedAmount: BigNumber;
    currentSupply: BigNumber;
    supplyCap: BigNumber;
  },
  numDays: number
) => {
  let total = BigNumber.from(0);
  for (let i = 1; i <= numDays; i++) {
    total = total.add(getExpectedAmountDueAfterXDays(params, i));
  }
  return total;
};

const getExpectedAmountDueAfterXDaysWithPLoss = (
  params: {
    stakedAmount: BigNumber;
    currentSupply: BigNumber;
    supplyCap: BigNumber;
  },
  numDays: number
) => {
  //     ((_stakedAmount * _totalSold) / 10**18) *
  //     ((_supplyCap - _currentSupply) *
  //         ((_maxConsumptionRate - _minConsumptionRate) *
  //             stakingDuration +
  //             _minConsumptionRate *
  //             _mintingPeriod))) /
  // ((_currentSupply *
  //     _maxStakingDuration *
  //     _mintingPeriod *
  //     _scale *
  //     _totalSupply) / 10**18);
  const var1 = BigNumber.from(24).mul(params.stakedAmount);
  const var2 = params.supplyCap.sub(params.currentSupply);
  const var3 = BigNumber.from(20000).mul(24 * numDays);
  const var4 = BigNumber.from(100000 * 8760);

  const var5 = params.currentSupply
    .mul(8760)
    .mul(8760)
    .mul(BigNumber.from(1000000));

  const var6 = var3.add(var4);
  const var7 = var2.mul(var6);

  const var8 = var1.mul(var7);
  const var9 = var8.div(var5);

  return var9;
};

const getCumulativeExpectedAmountDueAfterXDaysWithPLoss = (
  params: {
    stakedAmount: BigNumber;
    currentSupply: BigNumber;
    supplyCap: BigNumber;
  },
  numDays: number
) => {
  let total = BigNumber.from(0);
  for (let i = 1; i <= numDays; i++) {
    total = total.add(getExpectedAmountDueAfterXDays(params, i));
  }
  return total;
};

const calculateExpectedHaircut = (contractPeriod: number, day: number) => {
  const contractPeriodCubed = contractPeriod ** 3;
  const multiplier = ((day - 1) ** 3 * 100000000000000) / contractPeriodCubed;

  const result = (80 * multiplier) / 100 / 1000000;
  return 1000000 * 100 - result;
};

module.exports = {
  calculateAmountRequiredToCreateContract,
  getExpectedAmountDueAfterXDays,
  getExpectedAmountDueAfterXDaysWithPLoss,
  getCumulativeExpectedAmountDueAfterXDays,
  getCumulativeExpectedAmountDueAfterXDaysWithPLoss,
  calculateExpectedHaircut,
};
