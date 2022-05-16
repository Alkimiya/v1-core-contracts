import { ethers, getNamedAccounts, deployments, network } from "hardhat";
const { generateOracleSignature } = require("../../../helpers/test");

import { Contract, Signer } from "ethers";

import { expect } from "chai";

import { Oracle } from "../../../src/types/Oracle";
import { OracleRegistry } from "../../../src/types/OracleRegistry";
import { WrappedBTC } from "../../../src/types/WrappedBTC";
import { WrappedETH } from "../../../src/types/WrappedETH";
import { SilicaAccountFactory } from "../../../src/types/SilicaAccountFactory";
import { Silica } from "../../../src/types/Silica";
import { SilicaAccount } from "../../../src/types/SilicaAccount";

import { getXDaysAfterToday } from "../../../helpers/time";

function runTests(isERC20: boolean) {
  describe(`CreateSilicaContract ${isERC20}`, function () {
    let alkimiya: Signer;
    let seller: Signer;
    let buyer1: Signer;
    let buyer2: Signer;

    let Oracle: Oracle;
    let WBTC: WrappedBTC;
    let WETH: WrappedETH;

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

      const accounts = await ethers.getSigners();
      alkimiya = accounts[0];
      seller = accounts[1];
      buyer1 = accounts[2];
      buyer2 = accounts[3];

      await indexOracleOnDay(alkimiya, Oracle, -1);
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

    describe("Precondition Checks", function () {
      it("Only seller can create Silica", async function () {
        await expect(
          silicaAccountContract
            .connect(buyer1)
            .createSilicaContract(WBTC.address, 5000000000, 1, 1)
        ).to.be.revertedWith("Only owner");
      });

    });

    describe("Verify Silica state on creation", function () {
      let newSilicaContract: Contract;
      let hsParams: any;
      beforeEach(async function () {
        /// Seller creates Silica
        hsParams = {
          paymentTokenAddress: WBTC.address,
          hashrate: "60000000000",
          period: 10,
          reservedPrice: "40000000000",
        };

        await WETH.connect(seller).approve(
          silicaAccountContract.address,
          63000000000
        );

        await WETH.transfer(silicaAccountContract.address, 63000000000);

        newSilicaContract = await createNewSilica(
          await silicaAccountContract.connect(seller),
          hsParams
        );
      });

      it("Silica owner is set to seller", async function () {
        expect(await newSilicaContract.seller()).to.be.equal(
          await seller.getAddress()
        );
      });

      it("Silica's amountLocked is set to cost to create the contract", async function () {
        // hardcoded amount required to create contract
        expect(await newSilicaContract.amountLocked()).to.be.equal(
          "63000000000"
        );
      });

      it("Silica is set to Open status", async function () {
        expect(await newSilicaContract.status()).to.be.equal(0);
      });

      it("Silica's amountOwedNextUpdate is set to 0", async function () {
        expect(await newSilicaContract.amountOwedNextUpdate()).to.be.equal(0);
      });

      it("Silica's amountDueAtContractEnd is set to 0", async function () {
        expect(await newSilicaContract.amountDueAtContractEnd()).to.be.equal(0);
      });

      it("Silica's startDay, endDay, totalSold are all set to 0", async function () {
        expect(await newSilicaContract.startDay()).to.be.equal(0);
        expect(await newSilicaContract.endDay()).to.be.equal(0);
        expect(await newSilicaContract.totalSold()).to.be.equal(0);
      });

      it("Silica contract parameters set properly", async function () {
        expect(await newSilicaContract.hashrate()).to.be.equal(
          hsParams.hashrate
        );
        expect(await newSilicaContract.contractPeriod()).to.be.equal(
          hsParams.period
        );
        expect(await newSilicaContract.reservedPrice()).to.be.equal(
          hsParams.reservedPrice
        );
        expect(await newSilicaContract.paymentToken()).to.be.equal(
          hsParams.paymentTokenAddress
        );
      });

      it("Silica seller and owner addresses set correctly", async function () {
        expect(await newSilicaContract.seller()).to.be.equal(
          await seller.getAddress()
        );
      });
    });

    describe("Verify SilicaAccount state on creation", function () {
      /// Seller creates Silica
      let hsParams: any;

      let newSilicaContract: Contract;

      beforeEach(async function () {
        hsParams = {
          paymentTokenAddress: WBTC.address,
          hashrate: "60000000000",
          period: "10",
          reservedPrice: "40000000000",
        };

        await WETH.connect(seller).approve(
          silicaAccountContract.address,
          63000000000
        );

        await WETH.transfer(silicaAccountContract.address, 63000000000);

        newSilicaContract = await createNewSilica(
          await silicaAccountContract.connect(seller),
          hsParams
        );
      });

      it("SilicaAccount's getTotalAmountLocked is correct", async function () {
        const totalAmountLocked =
          await silicaAccountContract.getTotalAmountLocked({
            from: await seller.getAddress(),
          });

        expect(totalAmountLocked).to.be.equal("63000000000");
      });

      it("SilicaAccount's getAvailableBalance is correct", async function () {
        const balance = await silicaAccountContract.getAvailableBalance();
        expect(balance).to.be.equal("0");
      });

      it("Newly created contract is registered", async function () {
        expect(
          await silicaAccountContract.isRegistered(newSilicaContract.address)
        ).to.be.equal(true);
      });
    });
  });
}

async function createNewSilica(
  silicaAccount: Contract,
  silicaParams: {
    paymentTokenAddress: String;
    hashrate: String;
    period: String;
    reservedPrice: String;
  }
) {
  const createSilicaTxnResponse = await silicaAccount.createSilicaContract(
    silicaParams.paymentTokenAddress,
    silicaParams.hashrate,
    silicaParams.period,
    silicaParams.reservedPrice
  );
  const createSilicaTxnReceipt = await createSilicaTxnResponse.wait();

  let contractEventFilter = silicaAccount.filters.NewSilicaContract();
  let contractEvents = await silicaAccount.queryFilter(contractEventFilter);

  let silicaContractAddress =
    contractEvents[contractEvents.length - 1].args![0]; // THIS !!@#$$# NUMBE ROF CONTRACTS?!

  return (await ethers.getContractFactory("Silica")).attach(
    silicaContractAddress
  );
}

runTests(true);

async function indexOracleOnDay(
  deployer: Signer,
  oracle: Contract,
  day: number
) {
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
