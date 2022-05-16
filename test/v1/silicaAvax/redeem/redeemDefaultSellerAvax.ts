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

  describe("Redeem Default Seller Avax", function () {
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
      await silicaContract.connect(buyer1).deposit(60000000000);
      const { deployer } = await getNamedAccounts();

      // check if the contract is open
      expect(await silicaContract.status()).to.be.equal(0);

      // update oracle
      await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 0);
      await newSilicaAccount.triggerUpdate();

      // Check if contract is running
      expect(await silicaContract.status()).to.be.equal(1);

      let i = 1;
      while (i < 11) {
        await increaseEvmTimeBy(1);
        await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, i);
        try {
          await newSilicaAccount.connect(alkimiya).triggerUpdate();
        } catch {}
        i++;
      }

      //check if contract is defaulted
      expect(await silicaContract.status()).to.be.equal(3);

      const RewardBalance = await silicaContract.amountLocked();
      silicaContract.connect(buyer1).buyerRedeemDefault();

      //check that buyer get all the rewards from the silicaContract
      expect(await WAVAX.balanceOf(buyer1.getAddress())).to.be.equals(
        RewardBalance
      );

      const PaymentBalance = await tUSDT.balanceOf(silicaContract.address);
      silicaContract.connect(seller).sellerRedeemDefault();

      //Check that the seller can not redeem twice
      await expect(
        silicaContract.connect(seller).sellerRedeemDefault()
      ).to.be.revertedWith("Miner cashed out from defaulting");

      //check if seller get all rewards from silicaContract
      expect(await tUSDT.balanceOf(seller.getAddress())).to.be.equals(
        PaymentBalance
      );
      expect(await tUSDT.balanceOf(buyer1.getAddress())).to.be.equals(
        60000000000 - PaymentBalance
      );
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
