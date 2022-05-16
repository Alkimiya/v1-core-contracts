import { ethers, getNamedAccounts, deployments, network } from "hardhat";
const { generateOracleSignature } = require("../../../helpers/test");

import { getXDaysAfterToday } from "../../../helpers/time";

import { Contract, Signer } from "ethers";

import { Oracle } from "../../../src/types/Oracle";
import { OracleRegistry } from "../../../src/types/OracleRegistry";
import { WrappedBTC } from "../../../src/types/WrappedBTC";
import { WrappedETH } from "../../../src/types/WrappedETH";
import { SilicaAccountFactory } from "../../../src/types/SilicaAccountFactory";
import { Silica } from "../../../src/types/Silica";
import { SilicaAccount } from "../../../src/types/SilicaAccount";

import { expect } from "chai";

describe(`GetDailyBasisReward`, function () {
  let alkimiya: Signer;
  let seller: Signer;
  let buyer1: Signer;
  let buyer2: Signer;

  let Oracle: Oracle;
  let WBTC: WrappedBTC;
  let WETH: WrappedETH;

  let silicaAccountContract: SilicaAccount;

  beforeEach(async function () {
    await deployments.fixture();

    const { deployer } = await getNamedAccounts();
    const OracleRegistry = (await ethers.getContract(
      "OracleRegistry",
      deployer
    )) as OracleRegistry;
    Oracle = await ethers.getContract("Oracle", deployer);
    await Oracle.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CALCULATOR_ROLE")),
      deployer
    );

    const SilicaAccountMasterERC20 = (await ethers.getContract(
      "SilicaAccount",
      deployer
    )) as SilicaAccount;

    const SilicaAccountFactory = (await ethers.getContract(
      "SilicaAccountFactory",
      deployer
    )) as SilicaAccountFactory;
    WBTC = await ethers.getContract("WrappedBTC", deployer);
    WETH = await ethers.getContract("WrappedETH", deployer);

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
    silicaAccountContract = SilicaAccountMasterERC20.connect(seller).attach(
      newSilicaAccountAddress
    );
  });

  it(`Verify calculations match (1)}`, async function () {
    await indexOracleOnDay(
      alkimiya,
      Oracle,
      0,
      "1",
      "10000000000",
      "10000000000",
      "3",
      "4"
    );

    const dailyBasisReward = await silicaAccountContract.getDailyBasisReward(
      getXDaysAfterToday(0)
    );

    const expectedDailyBasisReward = calculateExpectedDailyBasisReward(
      10000000000,
      10000000000
    );
    expect(dailyBasisReward).to.be.equal(expectedDailyBasisReward);
  });

  it("Verify calculations match (2)", async function () {
    await indexOracleOnDay(
      alkimiya,
      Oracle,
      0,
      "1",
      "99999999999",
      "512342341234",
      "3",
      "4"
    );

    const dailyBasisReward = await silicaAccountContract.getDailyBasisReward(
      getXDaysAfterToday(0)
    );

    const expectedDailyBasisReward = calculateExpectedDailyBasisReward(
      512342341234,
      99999999999
    );
    expect(dailyBasisReward).to.be.equal(expectedDailyBasisReward);
  });

  it("Verify calculations match (3)", async function () {
    await indexOracleOnDay(
      alkimiya,
      Oracle,
      0,
      "1",
      "99999999999",
      "99999999998",
      "3",
      "4"
    );

    const dailyBasisReward = await silicaAccountContract.getDailyBasisReward(
      getXDaysAfterToday(0)
    );

    const expectedDailyBasisReward = calculateExpectedDailyBasisReward(
      99999999998,
      99999999999
    );
    expect(dailyBasisReward).to.be.equal(expectedDailyBasisReward);
  });
});

function calculateExpectedDailyBasisReward(reward: number, hashrate: number) {
  return Math.floor(reward / hashrate);
}

async function indexOracleOnDay(
  deployer: Signer,
  oracle: Contract,
  day: number,
  referenceBlock: String,
  hashrate: String,
  reward: String,
  fees: String,
  difficulty: String
) {
  const signature = await generateOracleSignature({
    deployer,
    referenceDay: getXDaysAfterToday(day),
    referenceBlock,
    hashrate,
    reward,
    fees,
    difficulty,
  });

  await oracle.updateIndex(
    getXDaysAfterToday(day),
    referenceBlock,
    hashrate,
    reward,
    fees,
    difficulty,
    signature
  );
}
