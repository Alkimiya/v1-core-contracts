import { BigNumber } from "ethers";

const calculateAmountRequiredToCreateContract = (params: {
  hashrate: BigNumber;
  networkReward: BigNumber;
  networkHashrate: BigNumber;
}) => {
    return BigNumber.from(105).mul(params.hashrate).mul(params.networkReward).div(params.networkHashrate).div(BigNumber.from(100));
};

const getExpectedReward = (params: {
    totalSold: BigNumber,
    networkReward: BigNumber,
    networkHashrate: BigNumber,
  }) => {
      return (params.totalSold).mul(params.networkReward).div(params.networkHashrate);
  };


/// Calculate amount due at contractEnd how much shoulda been due for a contract
/// that ran x hours? For now, expects oracle has constant networkReward + hashrate


const getExpectedAmountDueAfterXDays = (params: {
    totalSold: BigNumber,
    networkReward: BigNumber,
    networkHashrate: BigNumber
}, numDaysActive: number) => {
    return (params.totalSold).mul(params.networkReward).div(params.networkHashrate).mul(numDaysActive)
};

module.exports = {
  calculateAmountRequiredToCreateContract,
  getExpectedReward,
  getExpectedAmountDueAfterXDays
};

