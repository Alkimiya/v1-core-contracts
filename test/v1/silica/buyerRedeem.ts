import { ethers, network, deployments, getNamedAccounts } from "hardhat";
const { generateOracleSignature } = require("../../../helpers/test");

import { Signer } from "ethers";

import { expect } from "chai";

import { getXDaysAfterToday } from "../../../helpers/time";

import { Oracle } from "../../../src/types/Oracle";
import { OracleRegistry } from "../../../src/types/OracleRegistry";
import { WrappedBTC } from "../../../src/types/WrappedBTC";
import { WrappedETH } from "../../../src/types/WrappedETH";
import { SilicaAccountFactory } from "../../../src/types/SilicaAccountFactory";
import { Silica } from "../../../src/types/Silica";
import { SilicaAccount } from "../../../src/types/SilicaAccount";
/**
 * TestSuite for Silica Status transitions.
 * These tests are to test valid state transitions only. Tests that test
 * Silica behavior at a specific state should go elsewhere.
 */
let alkimiya: Signer;
let seller: Signer;
let buyer1: Signer;
let buyer2: Signer;

let silicaContract: Silica;
let silicaAccountContract: SilicaAccount;

let Oracle: Oracle;

describe("BuyerRedeem", function () {
  beforeEach(async function () {
    await deployments.fixture();

    const { deployer } = await getNamedAccounts();
    alkimiya = ethers.provider.getSigner(deployer);

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

    const WETH = (await ethers.getContract(
      "WrappedETH",
      deployer
    )) as WrappedETH;
    const WBTC = (await ethers.getContract(
      "WrappedBTC",
      deployer
    )) as WrappedBTC;

    await indexOracleOnDay(alkimiya, Oracle, -1);

    await OracleRegistry.setOracleAddress(
      WETH.address,
      0, // oracle Type (0 = normal swap)
      Oracle.address
    );

    const accounts = await ethers.getSigners();
    alkimiya = accounts[0];
    seller = accounts[1];
    buyer1 = accounts[2];
    buyer2 = accounts[3];

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

    await WBTC.connect(buyer1).approve(silicaContract.address, 40000000001);
    await WBTC.connect(buyer2).approve(silicaContract.address, 1000000000000);

    await WBTC.transfer(await seller.getAddress(), 1000000000);
    await WBTC.transfer(await buyer1.getAddress(), 1000000000000);
    await WBTC.transfer(await buyer2.getAddress(), 1000000000000);
  });

  /// After each test, reset hardhat nodes since we play around with evm time
  afterEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  it("Buyer cannot redeem without sands", async function () {
    await expect(
      silicaContract.connect(seller).buyerRedeem()
    ).to.be.revertedWith("Not a buyer");
  });

  //"Buyer redeem if contract is running"
  //"Buyer cannot call redeem on defaulted contracts"
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
