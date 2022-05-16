const { expect } = require("chai");

const { time } = require("openzeppelin-test-helpers");

const { calculateAmountRequiredToCreateContract, getExpectedReward, getExpectedAmountDueAfterXDays } = require("../silica/helpers/calcs");

import { ethers, network, deployments, getNamedAccounts } from "hardhat";

const { generateOracleSignature } = require("../../../helpers/test");
const { getXDaysAfterToday } = require("../../../helpers/time");

import { BigNumber, Contract, Signer } from "ethers";

import { Oracle } from "../../../src/types/Oracle";
import { OracleRegistry } from "../../../src/types/OracleRegistry";
import { WrappedBTC } from "../../../src/types/WrappedBTC";
import { WrappedETH } from "../../../src/types/WrappedETH";
import { SilicaAccountFactory } from "../../../src/types/SilicaAccountFactory";
import { Silica } from "../../../src/types/Silica";
import { SilicaAccount } from "../../../src/types/SilicaAccount";

let silicaAccountContract: SilicaAccount;

let WBTC: WrappedBTC;
let WETH: WrappedETH;
let SilicaMasterContract: Silica;

let alkimiya: Signer;
let seller: Signer;
let buyer1: Signer;
let buyer2: Signer;
let buyer3: Signer;

let OracleRegistry: OracleRegistry;
let Oracle: Oracle;

let contract1Params: any;

describe(`Default Scenario Testing`, function () {
  beforeEach(async function () {
    await deployments.fixture();
    const { deployer } = await getNamedAccounts();

    const accounts = await ethers.getSigners();
    alkimiya = accounts[0];
    seller = accounts[1];
    buyer1 = accounts[2];
    buyer2 = accounts[3];
    buyer3 = accounts[4];

    OracleRegistry = (await ethers.getContract(
      "OracleRegistry",
      deployer
    )) as OracleRegistry;
    Oracle = (await ethers.getContract("Oracle", deployer)) as Oracle;
    await Oracle.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CALCULATOR_ROLE")),
      deployer
    );

    const SilicaAccountMasterERC20 = (await ethers.getContract(
      "SilicaAccount",
      deployer
    )) as SilicaAccount;

    SilicaMasterContract = (await ethers.getContract(
      "Silica",
      deployer
    )) as Silica;

    const SilicaAccountFactory = (await ethers.getContract(
      "SilicaAccountFactory",
      deployer
    )) as SilicaAccountFactory;

    /// setup payment token
    WBTC = await ethers.getContract("WrappedBTC", deployer);
    WETH = await ethers.getContract("WrappedETH", deployer);

    contract1Params = {
      paymentTokenAddress: WBTC.address, // what if address is 0?
      hashrate: BigNumber.from(60000000000),
      period: 2,
      reservedPrice: BigNumber.from(40000000000),
    };

    await WBTC.transfer(await seller.getAddress(), 1000000000000);
    await WBTC.transfer(await buyer1.getAddress(), 1200000000000);
    await WBTC.transfer(await buyer2.getAddress(), 1000000000000);
    await WBTC.transfer(await buyer3.getAddress(), 1000000000000);

    await OracleRegistry.setOracleAddress(
      WETH.address,
      0, // oracle type (0 = normal swap)
      Oracle.address
    );
    await OracleRegistry.setOracleAddress(
      WBTC.address,
      0, // oracle type (0 = normal swap)
      Oracle.address
    );

    await indexOracleOnDay(Oracle, -1);

    await (
      await SilicaAccountFactory.connect(seller)
        .attach(SilicaAccountFactory.address)
        .createSilicaAccount(
          WETH.address,
          0 // oracle type (0 = normal swap)
        )
    ).wait();

    let eventFilter = SilicaAccountFactory.filters.NewSilicaAccount();
    let events = await SilicaAccountFactory.queryFilter(eventFilter);

    const newSilicaAccountAddress = events[0].args![1];
    silicaAccountContract = SilicaAccountMasterERC20.connect(seller).attach(
      newSilicaAccountAddress
    );
  });

  afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  describe("Starting contracts", function () {
      it("Run ", async function () {

        const purchaseAmount = BigNumber.from("30000000000");

        const createNewSilica = async (contractParams: {
          paymentTokenAddress: any;
          hashrate: any;
          period: any;
          reservedPrice: any;
        }) => {
          await await silicaAccountContract.createSilicaContract(
            contractParams.paymentTokenAddress,
            contractParams.hashrate,
            contractParams.period,
            contractParams.reservedPrice
          );
          let contractEventFilter = silicaAccountContract.filters.NewSilicaContract();
          let contractEvents = await silicaAccountContract.queryFilter(
            contractEventFilter
          );
          const newSilicaAddress =
            contractEvents[contractEvents.length - 1].args![0];
          return SilicaMasterContract.attach(newSilicaAddress);
        };

        /// DAY 0

        await WETH.transfer(silicaAccountContract.address, 
          calculateAmountRequiredToCreateContract({
            hashrate: contract1Params.hashrate,
            networkReward: BigNumber.from("10000000000"),
            networkHashrate: BigNumber.from("10000000000")
        }));

        let contract1 = await createNewSilica(contract1Params);
        
        await WBTC.connect(buyer1).approve(contract1.address, purchaseAmount);
        await contract1.connect(buyer1).deposit(purchaseAmount);

        increaseEvmTimeBy(1);
        await indexOracleOnDay(Oracle, 0);
        /// END OF DAY 0
        
        /// DAY 1
        
        /// WAITING 1 ADDITIONAL DAY FOR CONTRACT TO BEGIN
        await silicaAccountContract.triggerUpdate();
        expect(await contract1.status()).to.be.equal(0);

        increaseEvmTimeBy(1);
        await indexOracleOnDay(Oracle, 1);

        /// END OF DAY 1

        /// DAY 2

        /// COLLATERAL converted to one day 
        await silicaAccountContract.triggerUpdate();
        expect(await contract1.status()).to.be.equal(1);

        const totalSold = await contract1.totalSold();

        /// TRANSFER REWARD TO COVER DAY 2
        await WETH.transfer(silicaAccountContract.address, getExpectedReward({
          totalSold: totalSold,
          networkReward: BigNumber.from("10000000000"),
          networkHashrate: BigNumber.from("10000000000")
        }));

        increaseEvmTimeBy(1);
        await indexOracleOnDay(Oracle, 2);

        /// END OF DAY 2

        /// DAY 3
        await silicaAccountContract.triggerUpdate();
        expect(await contract1.status()).to.be.equal(1);

        /// TRANSFER REWARD TO COVER DAY 3
        await WETH.transfer(silicaAccountContract.address, getExpectedReward({
          totalSold: totalSold,
          networkReward: BigNumber.from("10000000000"),
          networkHashrate: BigNumber.from("10000000000")
        }));

        increaseEvmTimeBy(1);
        await indexOracleOnDay(Oracle, 3);

        /// END OF DAY 3
        
        /// DAY 4
        await silicaAccountContract.triggerUpdate();
        expect(await contract1.status()).to.be.equal(4);

        
        expect(await contract1.amountDueAtContractEnd()).to.be.equal(
          getExpectedAmountDueAfterXDays({
            totalSold: totalSold,
            networkReward: BigNumber.from("10000000000"),
            networkHashrate: BigNumber.from("10000000000")
          }, await contract1.endDay() - await contract1.startDay())
        );

        await verifyBuyerRedeem(contract1, buyer1, WETH);
        await verifySellerRedeem(contract1, seller, WBTC);
        await verifyWithdrawExcessReward(silicaAccountContract, WETH, seller);

        increaseEvmTimeBy(1);
        await indexOracleOnDay(Oracle, 4);
        /// END OF DAY 3

      });
  });
});

async function verifySellerRedeem(
  silicaContract: Silica,
  seller: Signer,
  paymentToken: Contract
) {
  
  const sellerTokenBalanceBefore = await paymentToken.balanceOf(await seller.getAddress());

  await silicaContract.connect(seller).minerRedeem();

  const sellerTokenBalanceAfter = await paymentToken.balanceOf(await seller.getAddress());
  const sellerTokenBalanceDiff = sellerTokenBalanceAfter - sellerTokenBalanceBefore;

  expect(sellerTokenBalanceDiff).to.be.equal(await silicaContract.totalPayment());
}

async function verifyWithdrawExcessReward(
  silicaAccount: Contract,
  rewardToken: Contract,
  seller: Signer
) {
  let sellerBalanceBefore,
    sellerBalanceAfter,
    silicaAccountBalanceBefore,
    silicaAccountBalanceAfter;
  sellerBalanceBefore = await rewardToken.balanceOf(await seller.getAddress());

  silicaAccountBalanceBefore = await silicaAccount.getAvailableBalance();

  let withdrawExcessRewardGasCost: BigNumber = BigNumber.from(0);

  await silicaAccount.withdrawExcessReward(silicaAccountBalanceBefore);

  sellerBalanceAfter = await rewardToken.balanceOf(await seller.getAddress());

  silicaAccountBalanceAfter = await silicaAccount.getAvailableBalance();

  const sellerBalanceDiff: BigNumber =
    sellerBalanceAfter.sub(sellerBalanceBefore);
  expect(silicaAccountBalanceAfter).to.be.equal(0);
  expect(sellerBalanceDiff).to.be.equal(
    silicaAccountBalanceBefore.sub(withdrawExcessRewardGasCost)
  );
}

async function verifyMinerDefault(
  contract: Contract,
  paymentToken: Contract,
  seller: Signer
) {
  const totalPayment = await contract.totalPayment();

  const sellerPaymentTokenBalanceBefore = await paymentToken.balanceOf(
    await seller.getAddress()
  );

  await contract.connect(seller).sellerRedeemDefault();

  const sellerPaymentTokenBalanceAfter = await paymentToken.balanceOf(
    await seller.getAddress()
  );

  const sellerPaymentTokenBalanceDiff: BigNumber =
    sellerPaymentTokenBalanceAfter.sub(sellerPaymentTokenBalanceBefore);

  const endDay = await contract.endDay();
  const startDay = await contract.startDay();
  const day = endDay - startDay;
  const contractPeriod = await contract.contractPeriod();

  const expectedHaircut = 1 - 0.8 * ((day - 1) / contractPeriod) ** 3;

  const expectedSellerPaymentTokenReward = Math.floor(
    totalPayment * (1 - expectedHaircut)
  );

  const diff = Math.abs(
    expectedSellerPaymentTokenReward - sellerPaymentTokenBalanceDiff.toNumber()
  );

  expect(diff).to.be.below(
    BigNumber.from(10) // sloppy check for margin of error
  );
}

async function verifyBuyerDefault(
  contract: Contract,
  paymentToken: Contract,
  rewardToken: Contract,
  buyer: Signer
) {
  const hashrate = await contract.hashrate();
  const totalPayment = await contract.totalPayment();
  const totalSold = await contract.totalSold();

  const buyerSilicaBalance = await contract.balanceOf(await buyer.getAddress());

  const buyerPaymentTokenBalanceBefore = await paymentToken.balanceOf(
    await buyer.getAddress()
  );

  const buyerRewardTokenBalanceBefore = await rewardToken.balanceOf(
    await buyer.getAddress()
  );

  await contract.connect(buyer).buyerRedeemDefault();

  const buyerPaymentTokenBalanceAfter = await paymentToken.balanceOf(
    await buyer.getAddress()
  );
  const buyerRewardTokenBalanceAfter = await rewardToken.balanceOf(
    await buyer.getAddress()
  );

  //haircut * totalpayment tokenBalance / hashrateSold
  const amountDueAtContractEnd = await contract.amountDueAtContractEnd();

  const buyerPaymentTokenBalanceDiff =
    buyerPaymentTokenBalanceAfter - buyerPaymentTokenBalanceBefore;

  const buyerRewardTokenBalanceDiff =
    buyerRewardTokenBalanceAfter - buyerRewardTokenBalanceBefore;

  const endDay = await contract.endDay();
  const startDay = await contract.startDay();
  const day = endDay - startDay;
  const contractPeriod = await contract.contractPeriod();

  const expectedHaircut = 1 - 0.8 * ((day - 1) / contractPeriod) ** 3;

  const expectedRewardTokenAmount =
    Math.floor(buyerSilicaBalance * amountDueAtContractEnd) / hashrate;
  const expectedPaymentTokenAmount =
    (expectedHaircut * buyerSilicaBalance * totalPayment) / totalSold;

  expect(buyerPaymentTokenBalanceDiff).to.be.equal(
    BigNumber.from(expectedPaymentTokenAmount)
  );

  expect(buyerRewardTokenBalanceDiff).to.be.equal(
    BigNumber.from(expectedRewardTokenAmount)
  );
}

async function verifyBuyerRedeem(
  contract: Contract,
  buyer: Signer,
  rewardToken: Contract
) {
  const totalSold = await contract.totalSold();
  const buyerSilicaBalance = await contract.balanceOf(await buyer.getAddress());

  let buyerBalanceBefore = await rewardToken.balanceOf(
    await buyer.getAddress()
  );
  await contract.connect(buyer).buyerRedeem();

  let buyerBalanceAfter = await rewardToken.balanceOf(await buyer.getAddress());
  let buyerBalanceDiff = buyerBalanceAfter - buyerBalanceBefore;

  const amountDueAtContractEnd = await contract.amountDueAtContractEnd();

  expect(buyerBalanceDiff).to.be.equal(
    BigNumber.from(
      Math.floor((amountDueAtContractEnd * buyerSilicaBalance) / totalSold)
    )
  );
}

async function increaseEvmTimeBy(numDays: number) {
  await ethers.provider.send("evm_increaseTime", [
    time.duration.days(numDays).toNumber(),
  ]);
  await ethers.provider.send("evm_mine", []);
}

async function indexOracleOnDay(oracle: Contract, day: number) {
  const signature = await generateOracleSignature({
    referenceDay: getXDaysAfterToday(day),
    referenceBlock: "2",
    hashrate: BigNumber.from("10000000000"),
    reward: BigNumber.from("10000000000"),
    fees: "3",
    difficulty: "4",
  });

  await oracle.updateIndex(
    getXDaysAfterToday(day),
    "2",
    BigNumber.from("10000000000"),
    BigNumber.from("10000000000"),
    "3",
    "4",
    signature
  );
}
