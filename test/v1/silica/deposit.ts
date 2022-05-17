import { ethers, getNamedAccounts, deployments } from "hardhat";
const { generateOracleSignature } = require("../../../helpers/test");

import { Contract, Signer } from "ethers";

import { SilicaAccountFactory } from "../../../src/types/SilicaAccountFactory";
import { Silica } from "../../../src/types/Silica";
import { SilicaAccount } from "../../../src/types/SilicaAccount";
import { OracleRegistry } from "../../../src/types/OracleRegistry";
import { expect } from "chai";
import { WrappedETH } from "../../../src/types/WrappedETH";
import { WrappedBTC } from "../../../src/types/WrappedBTC";

import { getXDaysAfterToday } from "../../../helpers/time";

describe("Silica", function () {
  let alkimiya: Signer;
  let seller: Signer;
  let buyer1: Signer;
  let buyer2: Signer;
  let buyer3: Signer;

  let silicaContract: Contract;

  beforeEach(async function () {
    await deployments.fixture();

    const { deployer } = await getNamedAccounts();
    const SilicaMasterContract = (await ethers.getContract(
      "Silica",
      deployer
    )) as Silica;
    const OracleRegistry = (await ethers.getContract(
      "OracleRegistry",
      deployer
    )) as OracleRegistry;
    const Oracle = await ethers.getContract("Oracle", deployer);
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

    const WETH = (await ethers.getContract(
      "WrappedETH",
      deployer
    )) as WrappedETH;
    const WBTC = (await ethers.getContract(
      "WrappedBTC",
      deployer
    )) as WrappedBTC;

    await indexOracleOnDay(ethers.provider.getSigner(deployer), Oracle, 0);

    await OracleRegistry.setOracleAddress(
      WETH.address,
      0, // oracle Type = 0 (normal swap)
      Oracle.address
    );

    const accounts = await ethers.getSigners();
    alkimiya = accounts[0];
    seller = accounts[1];
    buyer1 = accounts[2];
    buyer2 = accounts[3];
    buyer3 = accounts[4];

    await WBTC.transfer(await seller.getAddress(), 1000000000);
    await WBTC.transfer(await buyer1.getAddress(), 40000000000);
    await WBTC.transfer(await buyer2.getAddress(), 1000000000000);

    await (
      await SilicaAccountFactory.connect(seller)
        .attach(SilicaAccountFactory.address)
        .createSilicaAccount(
          WETH.address,
          0 // oracle type (0 = normal swap)
        )
    ).wait();

    const newSilicaAccountAddress =
      await SilicaAccountFactory.getDeterministicAddress(
        await seller.getAddress(),
        WETH.address,
        0 // oracle Type = 0 (normal swap)
      );

    await WETH.connect(seller).approve(newSilicaAccountAddress, 630000000000);

    await WETH.transfer(newSilicaAccountAddress, 630000000000);

    const newSilicaAccount = await SilicaAccountMasterERC20.connect(
      seller
    ).attach(newSilicaAccountAddress);

    const createSilicaContractTransaction =
      await newSilicaAccount.createSilicaContract(
        WBTC.address,
        60000000000,
        10,
        40000000000
      );
    createSilicaContractTransaction.wait();

    let eventFilter = newSilicaAccount.filters.NewSilicaContract();
    let events = await newSilicaAccount.queryFilter(eventFilter);

    let silicaContractAddress = events[0].args![0];

    silicaContract = SilicaMasterContract.attach(silicaContractAddress);

    await WBTC.connect(buyer1).approve(silicaContract.address, 40000000001);
    await WBTC.connect(buyer2).approve(silicaContract.address, 1000000000000);
    await WBTC.connect(buyer3).approve(silicaContract.address, 1000000000);
  });

  describe("deposit", function () {
    it("Bid: Single buyer bids 100% of contract", async function () {
      await silicaContract.connect(buyer1).deposit(40000000000);
      const buyer1SilicaBalance = await silicaContract.balanceOf(
        await buyer1.getAddress()
      );
      expect(buyer1SilicaBalance).to.be.equal(60000000000);
    });

    it("Buyer cannot bid if buyer's allowance is too", async () => {
      await expect(
        silicaContract.connect(buyer3).deposit(40000000000)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Bid: Buyer cannot bid over 100% Silica", async function () {
      await expect(
        silicaContract.connect(buyer2).deposit(1000000000000)
      ).to.be.revertedWith("Not enough Silica");
    });

    it("Bid: Buyer cannot purchase more Silica than is available", async function () {
      /// buyer1 buys out the whole contract, and buyer1 and buyer2 tries to bid over available balance
      await silicaContract.connect(buyer1).deposit(20000000000);

      await expect(
        silicaContract.connect(buyer1).deposit(20000000001)
      ).to.be.revertedWith("Not enough Silica");

      await expect(
        silicaContract.connect(buyer2).deposit(20000000001)
      ).to.be.revertedWith("Not enough Silica");
    });

    it("Bid: Cannot bid 0", async function () {
      await expect(
        silicaContract.connect(buyer1).deposit(0)
      ).to.be.revertedWith("Value not permitted");
    });
  });
});

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
