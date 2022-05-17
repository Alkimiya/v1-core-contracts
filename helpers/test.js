const { expect, assert } = require("chai");
const { Contract, BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { time } = require("openzeppelin-test-helpers");
const BigNumberJS = require("bignumber.js");
const { formatBytes32String } = require("ethers").utils;

let paymentToken;
let collateralToken;
let miner;
let owner;
let buyer1;
let buyer2;
let buyer3;
let buyer4;
let oracle;

const minerID = "minerId1";
let HashSandMaster;
let hashSandFactory;

/// Initialization function for testing smart contracts
/// 1) Deploy TesterToken for both payment and collateral tokens
/// 2) Deploy HashSand factory and master contracts
/// 3) Transfer payment tokens to buyer, collateral tokens to miner
const init = async ({
  collateralDecimals = 18,
  paymentDecimals = 6,
  minerCollateralBalance = "50000000000000000000000",
  poolName = "SparkPool",
}) => {
  [owner, miner, buyer1, buyer2, buyer3, buyer4] = await ethers.getSigners();

  const Oracle = await ethers.getContractFactory("Oracle");
  oracle = await Oracle.deploy(poolName);

  const TesterTokenFactory = await ethers.getContractFactory("TesterToken");
  collateralToken = await TesterTokenFactory.deploy(collateralDecimals);
  paymentToken = await TesterTokenFactory.deploy(paymentDecimals);

  // deploy hashsands Master / Factory
  HashSandMaster = await ethers.getContractFactory("HashSand");
  const hashSandMaster = await HashSandMaster.deploy();
  const HashSandFactory = await ethers.getContractFactory("HashSandFactory");
  hashSandFactory = await HashSandFactory.deploy(hashSandMaster.address);

  // Share coins
  await Promise.all([
    paymentToken.transfer(buyer1.getAddress(), "50000000000000000000000"),
    paymentToken.transfer(buyer2.getAddress(), "50000000000000000000000"),
    paymentToken.transfer(buyer3.getAddress(), 50000000000),
    paymentToken.transfer(buyer4.getAddress(), 50000000000),
    collateralToken.transfer(miner.getAddress(), minerCollateralBalance),
  ]);

  return {
    owner,
    miner,
    buyer1,
    buyer2,
    buyer3,
    buyer4,
    Oracle,
    oracle,
    TesterTokenFactory,
    collateralToken,
    paymentToken,
    hashSandMaster,
    hashSandFactory,
  };
};

/// Deploys contract, using parameters provided as construction params
const deployContract = async ({
  paymentAddress = paymentToken.address,
  collateralAddress = collateralToken.address,
  inputHashrate = 6000000000,
  period = 15,
  inputReservedPrice = 40000000000,
  oracleAddress = oracle.address,
  minerId = minerID,
  seller = miner,
  minimumThreshold = 80,
  vaultAddress,
}) => {
  const rndString = Math.random() * (1000 - 1) + 1;
  const hashSandAddress = await hashSandFactory
    .connect(seller)
    .getHashSandAddress(
      seller.getAddress(),
      formatBytes32String(rndString.toString())
    );
  await hashSandFactory
    .connect(seller)
    .createHashSandContract(
      seller.getAddress(),
      formatBytes32String(rndString.toString())
    );
  const newContractInstance = await HashSandMaster.attach(hashSandAddress);
  await newContractInstance
    .connect(seller)
    .initialize(
      paymentAddress,
      collateralAddress,
      inputHashrate,
      period,
      inputReservedPrice,
      oracleAddress,
      minerId,
      minimumThreshold,
      vaultAddress
    );
  assert(
    newContractInstance instanceof Contract,
    "newContractInstance is not a instance of Contract"
  );
  return newContractInstance;
};

const validateContractDeploy = async ({
  contractInstance,
  inputHashrate = 6000000000,
  inputReservedPrice = 40000000000,
  minerId = minerId,
  period = 15,
  paymentAddress = paymentToken.address,
  collateralAddress = collateralToken.address,
  oracleAddress = oracle.address,
  seller = miner,
}) => {
  const [
    hashrate,
    totalSands,
    reservedPrice,
    contractMinerId,
    paymentToken,
    collateralToken,
    contractPeriod,
    alkimiyaOracle,
    contractseller,
  ] = await Promise.all([
    contractInstance.hashrate(),
    contractInstance.totalSands(),
    contractInstance.reservedPrice(),
    contractInstance.minerId(),
    contractInstance.paymentToken(),
    contractInstance.collateralToken(),
    contractInstance.period(),
    contractInstance.alkimiyaOracle(),
    contractInstance.seller(),
  ]);
  const errors = [];
  if (!hashrate.eq(BigNumber.from(inputHashrate))) {
    errors.push("Contract hashrate different than input");
  }
  if (!hashrate.eq(totalSands)) {
    errors.push("Contract hashrate different than sands");
  }
  if (!reservedPrice.eq(BigNumber.from(inputReservedPrice))) {
    errors.push("Contract price different than input");
  }
  if (contractMinerId !== minerId) {
    errors.push("Contract minerId different than input");
  }
  if (paymentToken !== paymentAddress) {
    errors.push("Contract paymentToken different than input");
  }
  if (collateralToken !== collateralAddress) {
    errors.push("Contract collateralToken different than input");
  }
  if (!contractPeriod.eq(BigNumber.from(period))) {
    errors.push("Contract period different than input");
  }
  if (alkimiyaOracle !== oracleAddress) {
    errors.push("alkimiyaOracleAddress period different than input");
  }
  if (seller.address !== contractseller) {
    errors.push("seller different than input");
  }
  assert(errors.length === 0, "\n" + errors.join("\n"));
};

/// Wrapper for 1) deployContract 2) validateContractDeployment
const deployAndValidate = async ({
  paymentAddress = paymentToken.address,
  collateralAddress = collateralToken.address,
  inputHashrate = 6000000000,
  period = 15,
  inputReservedPrice = 40000000000, // USDT 40000
  oracleAddress = oracle.address,
  minerId = minerID,
  seller = miner,
}) => {
  const contractInstance = await deployContract({
    paymentAddress,
    collateralAddress,
    inputHashrate,
    period,
    inputReservedPrice,
    oracleAddress,
    minerId,
    seller,
  });

  await validateContractDeploy({
    contractInstance,
    inputHashrate,
    inputReservedPrice,
    minerId,
    paymentAddress,
    collateralAddress,
    period,
    oracleAddress,
    seller,
  });
};

const approveCollateral = async ({
  contractInstanceAddress,
  contractCollateralToken = collateralToken,
  allowanceAmount = "1500000000000000000",
  sender = miner,
}) => {
  await contractCollateralToken
    .connect(sender)
    .approve(contractInstanceAddress, allowanceAmount);
  const allowance = await contractCollateralToken.allowance(
    sender.address,
    contractInstanceAddress
  );
  assert(
    allowance.eq(BigNumber.from(allowanceAmount)),
    "Collateral allowance different than input"
  );
};

const sendCollateral = async ({
  contractInstance,
  contractCollateralToken = collateralToken,
  collateralAmount = "1500000000000000000",
  sender = miner,
}) => {
  await contractInstance.connect(sender).confirmCollateral(collateralAmount);
  const collateral = await contractCollateralToken.balanceOf(
    contractInstance.address
  );
  assert(
    collateral.eq(BigNumber.from(collateralAmount)),
    "Collateral amount different than input"
  );
};

const approveAndSendCollateral = async ({
  contractInstance,
  contractCollateralToken = collateralToken,
  allowanceAmount = "1500000000000000000",
  collateralAmount = "1500000000000000000",
  sender = miner,
}) => {
  await approveCollateral({
    contractInstanceAddress: contractInstance.address,
    contractCollateralToken,
    allowanceAmount: allowanceAmount,
    sender: sender,
  });
  await sendCollateral({
    contractInstance,
    contractCollateralToken,
    collateralAmount: collateralAmount,
    sender: sender,
  });
};

/// Approve transfer from buyer to contract
const approvePayment = async ({
  contractInstanceAddress,
  contractPaymentToken = paymentToken,
  allowanceAmount = "40000000000",
  sender = owner,
}) => {
  await contractPaymentToken
    .connect(sender)
    .approve(contractInstanceAddress, allowanceAmount);
  const allowance = await contractPaymentToken.allowance(
    sender.address,
    contractInstanceAddress
  );
  assert(
    allowance.eq(BigNumber.from(allowanceAmount)),
    "Payment allowance different than input"
  );
};

/// Buyer calls confirm bid to contract
const confirmPayment = async ({
  contractInstance,
  paymentAmount = "40000000000",
  sender = owner,
}) => {
  await contractInstance.connect(sender).confirmBid(paymentAmount);
};

const approveAndConfirmPayment = async ({
  contractInstance,
  contractPaymentToken = paymentToken,
  allowanceAmount = "40000000000",
  paymentAmount = "40000000000",
  sender = owner,
}) => {
  await approvePayment({
    contractInstanceAddress: contractInstance.address,
    contractPaymentToken,
    allowanceAmount: allowanceAmount,
    sender: sender,
  });
  await confirmPayment({
    contractInstance,
    contractPaymentToken,
    paymentAmount: paymentAmount,
    sender: sender,
  });
};

const parseBigNumber = ({ bigNumber, decimals, formatDecimals }) => {
  let bigNumberStr = bigNumber.toString();
  if (bigNumberStr.length < decimals) {
    while (bigNumberStr.length < decimals) {
      if (bigNumberStr[0] === "-") {
        bigNumberStr = "-0" + bigNumberStr.slice(1);
      } else {
        bigNumberStr = "0" + bigNumberStr;
      }
    }
    if (bigNumberStr[0] === "-") {
      bigNumberStr = "-0" + bigNumberStr.slice(1);
    } else {
      bigNumberStr = "0" + bigNumberStr;
    }
  }

  let decimalsStr = bigNumberStr.slice(bigNumberStr.length - decimals);
  if (formatDecimals) {
    decimalsStr = decimalsStr.slice(0, formatDecimals);
  }
  while (decimalsStr && decimalsStr[decimalsStr.length - 1] === "0") {
    decimalsStr = decimalsStr.slice(0, decimalsStr.length - 1);
  }

  const intStr = bigNumberStr.slice(0, bigNumberStr.length - decimals);
  return (
    (intStr ? (intStr === "-" ? "-0" : intStr) : 0) +
    (decimalsStr
      ? "." + (decimalsStr.length > 9 ? decimalsStr.slice(0, 9) : decimalsStr)
      : "")
  );
};

const toBigNumber = ({ str, decimals }) => {
  const bigNumberArray = str.split(".");
  let myBigNumber = BigNumber.from(
    bigNumberArray[0] ? bigNumberArray[0] : 0
  ).mul(BigNumber.from(10).pow(decimals));
  let decimalsBigNumberStr = bigNumberArray[1] ? bigNumberArray[1] : "0";
  while (decimalsBigNumberStr.length < decimals) {
    decimalsBigNumberStr += "0";
  }
  const decimalsBigNumber = BigNumber.from(decimalsBigNumberStr);
  myBigNumber = myBigNumber.add(decimalsBigNumber);
  return myBigNumber;
};

const updateOracle = async ({
  contractInstance,
  referenceDate,
  hashrate = "10500000000",
  reward = "655000000000000000",
  fees = "1",
  difficulty = "2",
}) => {
  let ts = Math.floor(new Date().valueOf() / 1000);
  let signature = await generateOracleSignature({
    referenceDate: referenceDate,
    hashrate: hashrate,
    reward: reward,
    fees: fees,
    difficulty: difficulty,
    timestamp: ts,
  });
  await oracle.updateIndex(referenceDate, hashrate, reward, ts, signature);
};

const generateOracleSignature = async ({
  caller,
  referenceDay,
  referenceBlock,
  hashrate,
  reward,
  fees,
  difficulty,
}) => {
  let message = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [referenceDay, referenceBlock, hashrate, reward, fees, difficulty]
    )
  );
  if (!caller) {
    [caller] = await ethers.getSigners();
  }
  let signature = await caller.signMessage(ethers.utils.arrayify(message));
  return signature;
};

const generateOraclePoSSignature = async ({
  caller,
  referenceDay,
  referenceBlock,
  currentSupply,
  supplyCap,
  maxStakingDuration,
  maxConsumptionRate,
  minConsumptionRate,
  mintingPeriod,
  scale
}) => {
  let message = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [referenceDay, referenceBlock, currentSupply, supplyCap, maxStakingDuration, maxConsumptionRate,
      minConsumptionRate, mintingPeriod, scale]
    )
  );
  if (!caller) {
    [caller] = await ethers.getSigners();
  }
  let signature = await caller.signMessage(ethers.utils.arrayify(message));
  return signature;
};


const validateDefault = async ({
  contractInstance,
  eventCollateralToken,
  eventPaymentToken,
  eventRewardAmount,
  eventHaircut,
  expectedHaircut = "100",
  inputHashrate = "10500000000",
  reservedPrice = BigNumber.from(40000000000),
  collateralAmount,
  paymentAmount = BigNumber.from(40000000000),
  filledAmount = BigNumber.from(40000000000),
  miner = false,
  days,
  period = 15,
}) => {
  expect(eventHaircut).to.be.equal(BigNumber.from(expectedHaircut));
  const hundredBN = new BigNumberJS(100);
  const haircutBN = new BigNumberJS(expectedHaircut);
  const minerRate = hundredBN.minus(haircutBN).div(hundredBN);
  const filledAmountBN = new BigNumberJS(filledAmount.toString());
  const minerMultiplier = minerRate.times(days - 1).div(period);
  const minerPaymentAmount = filledAmountBN.times(minerMultiplier);
  if (miner) {
    expect(eventCollateralToken.isZero()).to.be.true;
    expect(eventRewardAmount.isZero()).to.be.true;
    expect(eventPaymentToken).to.be.equal(
      minerPaymentAmount.integerValue().toFixed()
    );
  } else {
    const totalBuyersPayment = filledAmountBN.minus(
      minerPaymentAmount.integerValue()
    );
    const hashrateBN = new BigNumberJS(inputHashrate);
    const mintAmount = hashrateBN
      .times(paymentAmount.toString())
      .div(reservedPrice.toString());
    const [totalSands, totalReward] = await Promise.all([
      contractInstance.totalSands(),
      contractInstance.totalReward(),
    ]);
    const contractHashrateBN = new BigNumberJS(inputHashrate);
    const totalSandsBN = new BigNumberJS(totalSands.toString());
    const totalMintAmount = contractHashrateBN.minus(totalSandsBN);
    expect(
      BigNumber.from(
        mintAmount
          .times(totalBuyersPayment)
          .div(totalMintAmount)
          .integerValue()
          .toFixed()
      )
    ).to.be.equal(eventPaymentToken);
    expect(
      mintAmount
        .times(collateralAmount.toString())
        .div(totalMintAmount)
        .integerValue()
        .toFixed()
    ).to.be.equal(eventCollateralToken);
    // needs to be discussed
    expect(
      mintAmount
        .times(totalReward.toString())
        .div(totalMintAmount)
        .integerValue()
        .toFixed()
    ).to.be.equal(eventRewardAmount);
  }
};

const awaiterFunc = async timeout => {
  let resolvePromise;
  const awaiter = new Promise(resolve => {
    resolvePromise = resolve;
  });
  setTimeout(() => {
    resolvePromise();
  }, timeout);
  return awaiter;
};

const getTimestamp = ({ startTime, offset = 0 }) => {
  const startDate = new Date(startTime.toNumber() * 1000);
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const seconds = startDate.getSeconds();
  const referenceDate = new Date();
  referenceDate.setDate(referenceDate.getDate() + offset);
  const oracleDate = new Date();
  oracleDate.setDate(oracleDate.getDate() + offset);
  oracleDate.setHours(hours);
  oracleDate.setMinutes(minutes);
  oracleDate.setSeconds(seconds);
  while (referenceDate.valueOf() < oracleDate.valueOf()) {
    oracleDate.setDate(oracleDate.getDate() - 1);
  }
  return oracleDate;
};

module.exports = {
  init,
  deployContract,
  validateContractDeploy,
  deployAndValidate,
  approveCollateral,
  sendCollateral,
  approveAndSendCollateral,
  approvePayment,
  confirmPayment,
  approveAndConfirmPayment,
  parseBigNumber,
  toBigNumber,
  updateOracle,
  validateDefault,
  awaiterFunc,
  getTimestamp,
  generateOracleSignature,
  generateOraclePoSSignature
};
