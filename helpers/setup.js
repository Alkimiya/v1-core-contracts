const { assert, expect } = require("chai");
const { Contract } = require("ethers");
const { ethers } = require("hardhat");

/**
 * Collection of helper functions for setting up oracle contract, hashSand contract, tester token contracts, and so on.
 */

const setupOracle = async ({ miningPoolName }) => {
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy(miningPoolName);
  return oracle;
};

const setupOracleWithParams = async ({ miningPoolName, deployer }) => {
  const Oracle = await ethers.getContractFactory("Oracle", deployer);
  const oracle = await Oracle.deploy(miningPoolName);
  return oracle;
};

const setupTesterToken = async ({ decimals }) => {
  const TesterTokenFactory = await ethers.getContractFactory("TesterToken");
  const testerToken = await TesterTokenFactory.deploy(decimals);
  return testerToken;
};

const setupTokenWithParams = async ({ name, decimals, deployer }) => {
  const TokenFactory = await ethers.getContractFactory(name, deployer);
  const token = await TokenFactory.deploy();
  return token;
};

const deployHashRepoContract = async ({
  miner,
  minerId,
  alkimiyaDeployer,
  erc20TokenAddress = ethers.constants.AddressZero,
}) => {
  const isErc20TokenContract =
    erc20TokenAddress == ethers.constants.AddressZero;

  let HashRepoMaster;
  if (isErc20TokenContract) {
    HashRepoMaster = await ethers.getContractFactory(
      "HashRepo",
      alkimiyaDeployer
    );
  } else {
    HashRepoMaster = await ethers.getContractFactory(
      "HashRepoERC20",
      alkimiyaDeployer
    );
  }

  const hashRepoMaster = await HashRepoMaster.deploy();

  const HashRepoContractFactory = await ethers.getContractFactory(
    "HashRepoFactory",
    alkimiyaDeployer
  );

  const hashRepoContractFactory = await HashRepoContractFactory.deploy(
    hashRepoMaster.address, //@FIX - actually deploy both contracts
    hashRepoMaster.address
  );

  //@FIX - Hardcode miningpool name for now. Might not need in the future.
  const hashRepoAddress = await hashRepoContractFactory
    .connect(miner)
    .getDeterministicAddress(
      miner.getAddress(),
      minerId,
      "SparkPool",
      erc20TokenAddress
    );

  let newHashRepoEvent = new Promise((resolve, reject) => {
    hashRepoContractFactory.on(
      "NewHashRepo",
      (
        senderAddress,
        clonedAddress,
        minerId,
        miningPool,
        erc20TokenAddress,
        event
      ) => {
        event.removeListener();

        resolve({
          senderAddress: senderAddress,
          clonedAddress: clonedAddress,
          minerId: minerId,
          miningPool: miningPool,
          erc20TokenAddress: erc20TokenAddress,
        });
      }
    );

    setTimeout(() => {
      reject(new Error("timeout"));
    }, 60000);
  });

  await hashRepoContractFactory
    .connect(miner)
    .createSandsRepo(minerId, "SparkPool", erc20TokenAddress);

  let event = await newHashRepoEvent;

  expect(event.senderAddress).to.be.equal(miner.address);
  expect(event.clonedAddress).to.be.equal(hashRepoAddress);
  expect(event.minerId).to.be.equal(minerId);
  expect(event.miningPool).to.be.equal("SparkPool");
  expect(event.erc20TokenAddress).to.be.equal(erc20TokenAddress);

  const newContractInstance = await HashRepoMaster.attach(
    hashRepoAddress
  ).connect(miner);
  if (isErc20TokenContract) {
    await newContractInstance.initialize(minerId);
  } else {
    await newContractInstance.initialize(erc20TokenAddress, minerId);
  }

  return newContractInstance;
};

const deployHashSandsContract = async ({
  signer,
  paymentToken,
  collateralToken,
  hashrate,
  period,
  reservedPrice,
  oracleAddress,
  minerId,
  minimumThreshold,
  hashRepoAddress = "",
}) => {
  const HashSandMaster = await ethers.getContractFactory("HashSand");
  const hashSandMaster = await HashSandMaster.deploy();
  const HashSandFactory = await ethers.getContractFactory(
    "HashSandFactory",
    signer
  );
  const hashSandContractFactory = await HashSandFactory.deploy(
    hashSandMaster.address
  );

  let newHashSandEvent = new Promise((resolve, reject) => {
    hashSandContractFactory.on(
      "NewHashSandContract",
      (minerAddress, contractAddress, event) => {
        resolve({
          minerAddress: minerAddress,
          contractAddress: contractAddress,
        });
      }
    );

    setTimeout(() => {
      reject(new Error("timeout"));
    }, 60000);
  });

  await hashSandContractFactory
    .connect(signer)
    .createHashSandContract(
      paymentToken.address,
      collateralToken.address,
      hashrate,
      period,
      reservedPrice,
      minimumThreshold,
      hashRepoAddress
    );

  let event = await newHashSandEvent;

  expect(event.minerAddress).to.be.equal(signer.address);

  const newContractInstance = await HashSandMaster.attach(
    event.contractAddress
  );

  await newContractInstance
    .connect(signer)
    .initialize(
      paymentToken.address,
      collateralToken.address,
      hashrate,
      period,
      reservedPrice,
      oracleAddress,
      minerId,
      minimumThreshold,
      hashRepoAddress
    );

  assert(
    newContractInstance instanceof Contract,
    "newContractInstance is not a instance of Contract"
  );
  return newContractInstance;
};

module.exports = {
  setupOracle,
  setupTesterToken,
  deployHashSandsContract,
  deployHashRepoContract,
  setupOracleWithParams,
  setupTokenWithParams,
};
