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
import { getAddress } from "ethers/lib/utils";

const { time } = require("openzeppelin-test-helpers");
async function increaseEvmTimeBy(numDays: number) {
  await ethers.provider.send("evm_increaseTime", [
    time.duration.days(numDays).toNumber(),
  ]);
  await ethers.provider.send("evm_mine", []);
}
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

    await WAVAX.transfer(
      await seller.getAddress(),
      BigNumber.from("1000000000000000000")
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
      BigNumber.from("1000000000000000000")
    );

    await WAVAX.transfer(
      newSilicaAccountAddress,
      BigNumber.from("10000000000000000")
    );

    newSilicaAccount = await SilicaAccountAvax.connect(seller).attach(
      newSilicaAccountAddress
    );

    const createSilicaContractTransaction =
      await newSilicaAccount.createSilicaAvaxContract(
        tUSDT.address,
        60000000000,
        BigNumber.from("25000000000000000000"), //stakedAmount
        10
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

  describe("Seller Redeem Avax", function () {
    it("Cannot redeem if caller is not seller", async function () {
      await expect(
        silicaContract.connect(buyer1).minerRedeem()
      ).to.be.revertedWith("Only miner can call this function");
    });

    it("Cannot redeem if contract is running", async function () {
      await silicaContract.connect(buyer1).deposit(60000000000);

      expect(await silicaContract.status()).to.be.equal(0);

      await indexOracleOnDay(alkimiya, Oracle, 0);

      await newSilicaAccount.triggerUpdate();

      expect(await silicaContract.status()).to.be.equal(1);

      await expect(
        silicaContract.connect(seller).minerRedeem()
      ).to.be.revertedWith("Only finished contracts can be redeemed");
    });

    it("Cannot redeem if contract is defaulted", async function () {
      await silicaContract.connect(buyer1).deposit(60000000000);
      expect(await silicaContract.status()).to.be.equal(0);

      await indexOracleOnDay(alkimiya, Oracle, 0);

      await newSilicaAccount.triggerUpdate(); // open => running

      expect(await silicaContract.status()).to.be.equal(1);

      await indexOracleOnDay(alkimiya, Oracle, 1);

      await newSilicaAccount.triggerUpdate();
      expect(await silicaContract.status()).to.be.equal(1);

      await indexOracleOnDay(alkimiya, Oracle, 2);

      await indexOracleOnDay(alkimiya, Oracle, 3);

      await indexOracleOnDay(alkimiya, Oracle, 4);

      await newSilicaAccount.triggerUpdate();
      expect(await silicaContract.status()).to.be.equal(3);

      await expect(
        silicaContract.connect(seller).minerRedeem()
      ).to.be.revertedWith("Only finished contracts can be redeemed");
    });

    it("normal redeem", async function () {
      await WAVAX.transfer(
        newSilicaAccount.address,
        BigNumber.from("90000000000000000")
      );
      const buyer1deposit = BigNumber.from(60000000000);
      await silicaContract.connect(buyer1).deposit(buyer1deposit);
      expect(await silicaContract.status()).to.be.equal(0);

      await indexOracleOnDay(alkimiya, Oracle, 0);

      await newSilicaAccount.triggerUpdate(); // open => running

      expect(await silicaContract.status()).to.be.equal(1);

      let i = 1;
      while (i < 11) {
        await increaseEvmTimeBy(1);
        await indexOracleOnDay(alkimiya, Oracle, i);
        try {
          await newSilicaAccount.connect(alkimiya).triggerUpdate();
        } catch {}
        i++;
      }

      expect(await silicaContract.status()).to.be.equal(4);

      await silicaContract.connect(seller).minerRedeem();
      await expect(
        await (await tUSDT.balanceOf(seller.getAddress())).toString()
      ).to.be.equals(buyer1deposit);
    });
  });
});

// feed values in from the calc tables
const vals = {
  currentSupply: "377752194000000000000000000",
  supplyCap: "720000000000000000000000000",
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
