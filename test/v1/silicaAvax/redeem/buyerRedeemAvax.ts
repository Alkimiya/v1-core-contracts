import { ethers, getNamedAccounts, deployments } from "hardhat";
const { generateOraclePoSSignature } = require("../../../../helpers/test");

import { BigNumber, Contract, Signer } from "ethers";

import { SilicaAccountAvax } from "../../../../src/types/SilicaAccountAvax";
import { SilicaAvax } from "../../../../src/types/SilicaAvax";
import { SilicaAccountAvaxFactory } from "../../../../src/types/SilicaAccountAvaxFactory";
import { OracleRegistry } from "../../../../src/types/OracleRegistry";
import { expect } from "chai";
import { WAVAX } from "../../../../src/types/WAVAX";

import { getXDaysAfterToday } from "../../../../helpers/time";
import { WrappedETH } from "../../../../src/types/WrappedETH";
import { USDT } from "../../../../src/types/USDT";

const {
  calculateAmountRequiredToCreateContract,
  getExpectedAmountDueAfterXDays,
} = require("../helpers/calcs");

const { time } = require("openzeppelin-test-helpers");
async function increaseEvmTimeBy(numDays: number) {
  await ethers.provider.send("evm_increaseTime", [
    time.duration.days(numDays).toNumber(),
  ]);
  await ethers.provider.send("evm_mine", []);
}

const STAKED_AMOUNT = BigNumber.from("25000000000000000000");
const CURRENT_SUPPLY = BigNumber.from("377752194000000000000000000");
const SUPPLY_CAP = BigNumber.from("720000000000000000000000000");

describe("Silica Avax", function () {
  let alkimiya: Signer;
  let seller: Signer;
  let buyer1: Signer;
  let buyer2: Signer;
  let buyer3: Signer;

  let Oracle: Contract;

  let silicaContract: SilicaAvax;
  let newSilicaAccount: SilicaAccountAvax;
  let WAVAX: Contract;
  let tUSDT: Contract;

  beforeEach(async function () {
    await deployments.fixture();

    const { deployer } = await getNamedAccounts();
    const SilicaAvaxMasterContract = (await ethers.getContract(
      "SilicaAvax",
      deployer
    )) as SilicaAvax;

    const SilicaAccountAvax = (await ethers.getContract(
      "SilicaAccountAvax",
      deployer
    )) as SilicaAccountAvax;

    const OraclePoSRegistry = (await ethers.getContract(
      "OracleRegistry",
      deployer
    )) as OracleRegistry;

    Oracle = await ethers.getContract("OraclePoS", deployer);
    await Oracle.grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CALCULATOR_ROLE")),
      deployer
    );

    const SilicaAccountAvaxFactory = (await ethers.getContract(
      "SilicaAccountAvaxFactory",
      deployer
    )) as SilicaAccountAvaxFactory;

    WAVAX = (await ethers.getContract("WAVAX", deployer)) as WAVAX;

    const WETH = (await ethers.getContract(
      "WrappedETH",
      deployer
    )) as WrappedETH;

    tUSDT = (await ethers.getContract("USDT", deployer)) as USDT;

    await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, -1);

    await OraclePoSRegistry.setOracleAddress(
      WAVAX.address,
      2, // oracle Type = 0 (avax pos)
      Oracle.address
    );

    const accounts = await ethers.getSigners();
    alkimiya = accounts[0];
    seller = accounts[1];
    buyer1 = accounts[2];
    buyer2 = accounts[3];
    buyer3 = accounts[4];

    const amountRequiredToCreateContract =
      calculateAmountRequiredToCreateContract({
        stakedAmount: STAKED_AMOUNT,
        currentSupply: CURRENT_SUPPLY,
        supplyCap: SUPPLY_CAP,
      });
    await WAVAX.transfer(
      await seller.getAddress(),
      amountRequiredToCreateContract
    );
    await tUSDT.transfer(await buyer1.getAddress(), 60000000000);

    await (
      await SilicaAccountAvaxFactory.connect(seller)
        .attach(SilicaAccountAvaxFactory.address)
        .createSilicaAccount(
          WAVAX.address,
          2 // oracle type (0 = normal swap)
        )
    ).wait();

    const newSilicaAccountAddress =
      await SilicaAccountAvaxFactory.getDeterministicAddress(
        await seller.getAddress(),
        WAVAX.address,
        2 // oracle Type = 0 (normal swap)
      );

    await WAVAX.connect(seller).approve(
      newSilicaAccountAddress,
      amountRequiredToCreateContract
    );

    await WAVAX.connect(seller).transfer(
      newSilicaAccountAddress,
      amountRequiredToCreateContract
    );

    newSilicaAccount = await SilicaAccountAvax.connect(seller).attach(
      newSilicaAccountAddress
    );

    const createSilicaContractTransaction =
      await newSilicaAccount.createSilicaAvaxContract(
        tUSDT.address,
        60000000000, //PRICE
        STAKED_AMOUNT, //stakedAmount
        5 //PERIOD
      );
    createSilicaContractTransaction.wait();

    let eventFilter = newSilicaAccount.filters.NewSilicaContract();
    let events = await newSilicaAccount.queryFilter(eventFilter);

    let silicaContractAddress = events[0].args![0];

    silicaContract = await SilicaAvaxMasterContract.attach(
      silicaContractAddress
    );

    await tUSDT.connect(buyer1).approve(silicaContract.address, 60000000000);
    await tUSDT.connect(buyer2).approve(silicaContract.address, 1000000000000);
    await tUSDT.connect(buyer3).approve(silicaContract.address, 1000000000);
  });

  describe("BuyerRedeem", function () {
    it("Buyer cannot redeem without sands", async function () {
      await expect(
        silicaContract.connect(seller).buyerRedeem()
      ).to.be.revertedWith("Not a buyer");
    });
    it("Buyer redeem if contract is running", async function () {
      const { deployer } = await getNamedAccounts();

      await silicaContract.connect(buyer1).deposit(60000000000);

      expect(await silicaContract.status()).to.be.equal(0);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 0);
      /// END OF DAY 0

      /// DAY 1
      await newSilicaAccount.triggerUpdate();

      expect(await silicaContract.status()).to.be.equal(1);

      await expect(
        silicaContract.connect(buyer1).buyerRedeem()
      ).to.be.revertedWith("Only finished contracts can be redeemed");
    });
    it("Buyer cannot call redeem on defaulted contracts", async function () {
      const { deployer } = await getNamedAccounts();

      await silicaContract.connect(buyer1).deposit(60000000000);

      expect(await silicaContract.status()).to.be.equal(0);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 0);
      /// END OF DAY 0

      /// DAY 1
      await newSilicaAccount.triggerUpdate();

      expect(await silicaContract.status()).to.be.equal(1);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 1);

      /// END OF DAY 1

      /// DAY 2
      await newSilicaAccount.triggerUpdate();

      expect(await silicaContract.status()).to.be.equal(1);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 2);
      /// END OF DAY 2

      /// DAY 3
      await newSilicaAccount.triggerUpdate();

      expect(await silicaContract.status()).to.be.equal(3);

      await expect(
        silicaContract.connect(buyer1).buyerRedeem()
      ).to.be.revertedWith("Only finished contracts can be redeemed");
    });

    it("Buyer cannot call redeem a expired contract", async function () {
      const { deployer } = await getNamedAccounts();
      expect(await silicaContract.status()).to.be.equal(0);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 0);
      /// END OF DAY 0

      /// DAY 1
      await newSilicaAccount.triggerUpdate();
      expect(await silicaContract.status()).to.be.equal(0);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 1);

      ///DAY 2
      await newSilicaAccount.triggerUpdate();
      expect(await silicaContract.status()).to.be.equal(0);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 2);

      ///DAY 3
      await newSilicaAccount.triggerUpdate();
      expect(await silicaContract.status()).to.be.equal(2);

      await expect(
        silicaContract.connect(seller).buyerRedeem()
      ).to.be.revertedWith("Not a buyer");
    });
    it("RewardAmountToBuyer check up", async function () {
      const { deployer } = await getNamedAccounts();

      await silicaContract.connect(buyer1).deposit(60000000000);

      expect(await silicaContract.status()).to.be.equal(0);

      await increaseEvmTimeBy(1);
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 0);
      /// END OF DAY 0

      /// DAY 1
      await newSilicaAccount.triggerUpdate();

      expect(await silicaContract.status()).to.be.equal(1);

      await WAVAX.transfer(
        await seller.getAddress(),
        BigNumber.from("1000000000000000000")
      );

      await WAVAX.connect(seller).approve(
        newSilicaAccount.address,
        BigNumber.from("1000000000000000000")
      );

      await WAVAX.connect(seller).transfer(
        newSilicaAccount.address,
        BigNumber.from("1000000000000000000")
      );

      let i = 1;
      while (i <= 5) {
        await increaseEvmTimeBy(1);
        await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, i);
        try {
          await newSilicaAccount.triggerUpdate();
        } catch {}
        i++;
      }
      ///DAY 6

      expect(await silicaContract.status()).to.be.equal(4);

      let amountLocked = (await silicaContract.amountLocked()).toString();

      await silicaContract.connect(buyer1).buyerRedeem();
      expect((await silicaContract.amountLocked()).toString()).to.be.equals(
        "0"
      );
      expect(
        (await WAVAX.balanceOf(buyer1.getAddress())).toString()
      ).to.be.equals(amountLocked);
    });
  });
});

// feed values in from the calc tables
const vals = {
  currentSupply: BigNumber.from("377752194000000000000000000"),
  supplyCap: BigNumber.from("720000000000000000000000000"),
  maxStakingDuration: "8760",
  maxConsumptionRate: "120000",
  minConsumptionRate: "100000",
  mintingPeriod: "8760",
  scale: "1000000",
};

async function indexOracleOnDay(
  deployer: Signer,
  oracle: Contract,
  day: number
) {
  const signature = await generateOraclePoSSignature({
    deployer,
    referenceDay: getXDaysAfterToday(day),
    referenceBlock: await ethers.provider.getBlockNumber(),
    currentSupply: vals.currentSupply,
    supplyCap: vals.supplyCap,
    maxStakingDuration: vals.maxStakingDuration,
    maxConsumptionRate: vals.maxConsumptionRate,
    minConsumptionRate: vals.minConsumptionRate,
    mintingPeriod: vals.mintingPeriod,
    scale: vals.scale,
  });

  await oracle.updateIndex(
    getXDaysAfterToday(day),
    await ethers.provider.getBlockNumber(),
    vals.currentSupply,
    vals.supplyCap,
    vals.maxStakingDuration,
    vals.maxConsumptionRate,
    vals.minConsumptionRate,
    vals.mintingPeriod,
    vals.scale,
    signature
  );
}
