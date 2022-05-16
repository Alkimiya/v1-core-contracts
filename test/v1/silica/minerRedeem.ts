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

  it("Cannot redeem if caller is not seller", async function () {
    await expect(
      silicaContract.connect(buyer1).minerRedeem()
    ).to.be.revertedWith("Only miner can call this function");
  });

  it("Cannot redeem if contract is running", async function () {
    await silicaContract.connect(buyer1).deposit(40000000000);

    expect(await silicaContract.status()).to.be.equal(0);

    await indexOracleOnDay(alkimiya, Oracle, 0);

    /// END OF DAY 0

    /// DAY 1

    await silicaAccountContract.triggerUpdate();

    expect(await silicaContract.status()).to.be.equal(1);

    await expect(
      silicaContract.connect(seller).minerRedeem()
    ).to.be.revertedWith("Only finished contracts can be redeemed");
  });

  it("Cannot redeem if contract is defaulted", async function () {
    await silicaContract.connect(buyer1).deposit(40000000000);
    expect(await silicaContract.status()).to.be.equal(0);

    await indexOracleOnDay(alkimiya, Oracle, 0);

    /// DAY 1

    await silicaAccountContract.triggerUpdate(); // open => running

    expect(await silicaContract.status()).to.be.equal(1); // 1 == Running

    await indexOracleOnDay(alkimiya, Oracle, 1);

    /// DAY 2

    await silicaAccountContract.triggerUpdate();
    expect(await silicaContract.status()).to.be.equal(1); // 1 == Running

    await indexOracleOnDay(alkimiya, Oracle, 2);

    /// DAY 3

    await silicaAccountContract.triggerUpdate();
    expect(await silicaContract.status()).to.be.equal(3); // 3 == Defaulted

    await expect(
      silicaContract.connect(seller).minerRedeem()
    ).to.be.revertedWith("Only finished contracts can be redeemed");
  });
});

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
