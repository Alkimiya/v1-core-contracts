const { time } = require("openzeppelin-test-helpers");

import { ethers, getNamedAccounts, deployments, network } from "hardhat";

import { Signer } from "ethers";
const { generateOracleSignature } = require("../../../helpers/test");

import { expect } from "chai";

import { getXDaysAfterToday } from "../../../helpers/time";

import { SilicaAccountFactory } from "../../../src/types/SilicaAccountFactory";
import { Silica } from "../../../src/types/Silica";
import { SilicaAccount } from "../../../src/types/SilicaAccount";
import { OracleRegistry } from "../../../src/types/OracleRegistry";
import { Oracle } from "../../../src/types/Oracle";
import { WrappedBTC } from "../../../src/types/WrappedBTC";
import { WrappedETH } from "../../../src/types/WrappedETH";

describe("Silica", function () {
  let alkimiya: Signer;
  let seller: Signer;
  let buyer1: Signer;
  let buyer2: Signer;

  let Oracle: Oracle;

  let silicaContract: Silica;
  let silicaAccountContract: SilicaAccount;

  beforeEach(async function () {
    await deployments.fixture();

    const { deployer } = await getNamedAccounts();
    const OracleRegistry = (await ethers.getContract(
      "OracleRegistry",
      deployer
    )) as OracleRegistry;
    Oracle = (await ethers.getContract("Oracle", deployer)) as Oracle;
    await Oracle.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CALCULATOR_ROLE")),
      deployer
    );
    const SilicaMasterContract = (await ethers.getContract(
      "Silica",
      deployer
    )) as Silica;
    const SilicaAccountMasterERC20 = (await ethers.getContract(
      "SilicaAccount",
      deployer
    )) as SilicaAccount;
    const SilicaAccountFactory = (await ethers.getContract(
      "SilicaAccountFactory",
      deployer
    )) as SilicaAccountFactory;

    const WBTC = (await ethers.getContract(
      "WrappedBTC",
      deployer
    )) as WrappedBTC;
    const WETH = (await ethers.getContract(
      "WrappedETH",
      deployer
    )) as WrappedETH;

    await OracleRegistry.setOracleAddress(
      WETH.address,
      0, // oracle type (0 = normal swap)
      Oracle.address
    );

    const accounts = await ethers.getSigners();
    alkimiya = accounts[0];
    seller = accounts[1];
    buyer1 = accounts[2];
    buyer2 = accounts[3];

    await WBTC.transfer(await seller.getAddress(), 1000000000);
    await WBTC.transfer(await buyer1.getAddress(), 40000000000);
    await WBTC.transfer(await buyer2.getAddress(), 1000000000000);

    /// Seller creates Silica
    await (
      await SilicaAccountFactory.connect(seller)
        .attach(SilicaAccountFactory.address)
        .createSilicaAccount(
          WETH.address,
          0 // oracle Type = 0 (normal swap)
        )
    ).wait();

    let eventFilter = SilicaAccountFactory.filters.NewSilicaAccount();
    let events = await SilicaAccountFactory.queryFilter(eventFilter);

    const newSilicaAccountAddress = events[0].args![1];

    const predictedAddress = await SilicaAccountFactory.getDeterministicAddress(
      await seller.getAddress(),
      WETH.address,
      0 // oracle type (0 = normal swap)
    );

    expect(newSilicaAccountAddress).to.be.equal(predictedAddress);

    silicaAccountContract =
      SilicaAccountMasterERC20.attach(predictedAddress).connect(seller);

    await WETH.connect(seller).approve(predictedAddress, 63000000000);

    silicaAccountContract = SilicaAccountMasterERC20.connect(seller).attach(
      newSilicaAccountAddress
    );

    await WETH.transfer(predictedAddress, 63000000000);

    await indexOracleOnDay(alkimiya, Oracle, -1);

    await await silicaAccountContract.createSilicaContract(
      WBTC.address,
      60000000000,
      10,
      40000000000
    );

    let contractEventFilter = silicaAccountContract.filters.NewSilicaContract();
    let contractEvents = await silicaAccountContract.queryFilter(
      contractEventFilter
    );

    let silicaContractAddress = contractEvents[0].args![0];

    silicaContract = SilicaMasterContract.attach(silicaContractAddress);

    /// Buyers approve token transfers
    await WBTC.connect(buyer1).approve(silicaContract.address, 40000000001);
    await WBTC.connect(buyer2).approve(silicaContract.address, 1000000000000);
  });

  /// After each test, reset hardhat nodes since we play around with evm time
  afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  describe("Verify pre-requisites", function () {
    it("Not in default call", async function () {
      await expect(
        silicaContract.connect(seller).sellerRedeemDefault()
      ).to.be.revertedWith("Not in default call");
    });

    it("Only miner can call this function", async function () {
      await expect(
        silicaContract.connect(buyer1).sellerRedeemDefault()
      ).to.be.revertedWith("Only miner can call this function");
    });

    it("Miner can only cash out once", async function () {
      await silicaContract.connect(buyer1).deposit(40000000000);

      increaseEvmTimeBy(1);
      await indexOracleOnDay(alkimiya, Oracle, 0);

      /// END OF DAY 0

      /// DAY 1

      expect(await silicaContract.amountLocked()).to.be.equal(63000000000);

      await silicaAccountContract.triggerUpdate(); // open => running (day 1). amountLocked is still 63000000000

      expect(await silicaContract.amountLocked()).to.be.equal(60000000000);

      increaseEvmTimeBy(1);
      await indexOracleOnDay(alkimiya, Oracle, 1);

      /// END OF DAY 1

      /// DAY 2
      await silicaAccountContract.triggerUpdate();

      increaseEvmTimeBy(1); //day 1 => day 2
      await indexOracleOnDay(alkimiya, Oracle, 2);

      /// END OF DAY 2

      /// DAY 3
      increaseEvmTimeBy(1); //day 2 => day 3
      await indexOracleOnDay(alkimiya, Oracle, 3);
      await silicaAccountContract.triggerUpdate(); // running => default (Day 3)

      expect(await silicaAccountContract.getAvailableBalance()).to.be.equal(
        "3000000000"
      );

      await silicaContract.connect(seller).sellerRedeemDefault();

      await expect(
        silicaContract.connect(seller).sellerRedeemDefault()
      ).to.be.revertedWith("Miner cashed out from defaulting");
    });
  });
});

async function increaseEvmTimeBy(numDays: number) {
  await ethers.provider.send("evm_increaseTime", [
    time.duration.days(numDays).toNumber(),
  ]);
  await ethers.provider.send("evm_mine", []);
}

async function indexOracleOnDay(deployer: Signer, oracle: Oracle, day: number) {
  const signature = await generateOracleSignature({
    deployer,
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
