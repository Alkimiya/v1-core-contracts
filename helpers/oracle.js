const { ethers } = require("hardhat");

const generateOracleSignature = async ({
  owner,
  sands,
  minerHashrate,
  minerReward,
  poolHashrate,
  poolReward,
  timestamp,
}) => {
  let message = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [sands, minerHashrate, minerReward, poolHashrate, poolReward, timestamp]
    )
  );

  let signature = await owner.signMessage(ethers.utils.arrayify(message));
  return signature;
};

module.exports = {
  generateOracleSignature,
};
