const { time } = require("openzeppelin-test-helpers");

import { ethers, getNamedAccounts, deployments, network } from "hardhat";

import { Contract, Signer } from "ethers";

import { Oracle } from "../../../src/types/Oracle";
import { OracleRegistry } from "../../../src/types/OracleRegistry";
import { WrappedBTC } from "../../../src/types/WrappedBTC";
import { WrappedETH } from "../../../src/types/WrappedETH";
import { SilicaAccountFactory } from "../../../src/types/SilicaAccountFactory";
import { Silica } from "../../../src/types/Silica";
import { SilicaAccount } from "../../../src/types/SilicaAccount";

import { expect } from "chai";

import { getXDaysAfterToday } from "../../../helpers/time";

const { generateOracleSignature } = require("../../../helpers/test");

describe(`TriggerUpdate TestSuite`, function () {
  let alkimiya: Signer;
  let seller: Signer;
  let buyer1: Signer;
  let buyer2: Signer;

  let WBTC: WrappedBTC;
  let WETH: WrappedETH;

  let Oracle: Oracle;
  let OracleRegistry: OracleRegistry;

  let silicasContractList: Array<Silica>;

  let silicaAccountContract: SilicaAccount;

  let SilicaMasterContract: Silica;

  beforeEach(async function () {
    await deployments.fixture();

    const { deployer } = await getNamedAccounts();
    silicasContractList = [];

    const accounts = await ethers.getSigners();
    alkimiya = accounts[0];
    seller = accounts[1];
    buyer1 = accounts[2];
    buyer2 = accounts[3];

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

    await WBTC.transfer(await seller.getAddress(), 1000000000000);
    await WBTC.transfer(await buyer1.getAddress(), 1200000000000);
    await WBTC.transfer(await buyer2.getAddress(), 1000000000000);

    await indexOracleOnDay(Oracle, -1);

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

  /// After each test, reset hardhat nodes since we play around with evm time
  afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  describe("Verify defaults", function () {
    let hsParams;
    beforeEach(async function () {
      hsParams = {
        paymentTokenAddress: WBTC.address,
        hashrate: "60000000000",
        period: "10",
        reservedPrice: "40000000000",
      };

      /// DAY 0

      await WETH.connect(seller).approve(
        silicaAccountContract.address,
        189000000000
      );

      await WETH.transfer(silicaAccountContract.address, 189000000000);

      /// Create the contracts //openStatus
      await silicasContractList.push(
        await createNewSilicaAndBid(silicaAccountContract, hsParams)
      );
      await silicasContractList.push(
        await createNewSilicaAndBid(silicaAccountContract, hsParams)
      );
      await silicasContractList.push(
        await createNewSilicaAndBid(silicaAccountContract, hsParams)
      );

      /// Mock 2 days of indexing
      increaseEvmTimeBy(1);
      await indexOracleOnDay(Oracle, 0);

      /// END OF DAY 0

      /// DAY 1 START

      await silicaAccountContract.triggerUpdate();

      /// All contracts created are now running
      for (let i = 0; i < silicasContractList.length; i++) {
        expect(await silicasContractList[i].status()).to.be.equal(1);
      }

      increaseEvmTimeBy(1);
      await indexOracleOnDay(Oracle, 1);

      /// END OF DAY 1
    });

    // It is now impossible for contracts to default on the first day (right?)
    it("Contracts that default on the first day retain totalLockedAmount", async function () {
      /// DAY 2 START
      await silicaAccountContract.triggerUpdate();
      const beforeAmount = await silicaAccountContract.getTotalAmountLocked();

      increaseEvmTimeBy(1);
      await indexOracleOnDay(Oracle, 2);

      /// END OF DAY 2

      /// DAY 3 START

      await silicaAccountContract.triggerUpdate();

      for (let i = 0; i < silicasContractList.length; i++) {
        expect(await silicasContractList[i].status()).to.be.equal(3);
      }

      const afterAmount = await silicaAccountContract.getTotalAmountLocked();

      expect(beforeAmount).to.be.equal(afterAmount);
    });
  });

  async function createNewSilicaAndBid(
    silicaAccountContract: SilicaAccount,
    silicaParams: {
      paymentTokenAddress: string;
      hashrate: string;
      period: string;
      reservedPrice: string;
    }
  ) {
    await await silicaAccountContract.createSilicaContract(
      silicaParams.paymentTokenAddress,
      silicaParams.hashrate,
      silicaParams.period,
      silicaParams.reservedPrice
    );

    let contractEventFilter = silicaAccountContract.filters.NewSilicaContract();
    let contractEvents = await silicaAccountContract.queryFilter(
      contractEventFilter
    );

    let silicaContractAddress =
      contractEvents[contractEvents.length - 1].args![0]; // THIS !!@#$$# NUMBE ROF CONTRACTS?!

    const newSilicaContract = SilicaMasterContract.attach(
      silicaContractAddress
    ) as Silica;

    await WBTC.connect(buyer1).approve(newSilicaContract.address, 40000000000);

    await newSilicaContract.connect(buyer1).deposit(40000000000);

    return newSilicaContract;
  }
});

async function increaseEvmTimeBy(numDays: number) {
  await ethers.provider.send("evm_increaseTime", [
    time.duration.days(numDays).toNumber(),
  ]);
  await ethers.provider.send("evm_mine", []);
}

async function indexOracleOnDay(oracle: Contract, day: number) {
  const signature = await generateOracleSignature({
    referenceDay: getXDaysAfterToday(day),
    referenceBlock: "1",
    hashrate: "10000000000",
    reward: "10000000000",
    fees: "3",
    difficulty: "4",
  });

  await oracle.updateIndex(
    getXDaysAfterToday(day),
    "1",
    "10000000000",
    "10000000000",
    "3",
    "4",
    signature
  );
}
