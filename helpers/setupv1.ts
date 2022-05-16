import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";

/**
 * Collection of helper functions for setting up oracle contract, hashSand contract, tester token contracts, and so on.
 */

const setupTesterToken = async (decimals: Number, deployer: Signer) => {
  const TokenFactory = await ethers.getContractFactory("TesterToken", deployer);
  const token = await TokenFactory.deploy(decimals);
  return token;
};

const deployOracle = async (deployer: Signer, name: string) => {
  const Oracle = await ethers.getContractFactory("Oracle", deployer);
  const oracle = await Oracle.deploy(name);
  await oracle.grantRole(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CALCULATOR_ROLE")),
    deployer.getAddress());
  return oracle;
};

const deployOracleAddr = async (deployer: Signer) => {
  const Oracle = await ethers.getContractFactory("OracleRegistry", deployer);
  const oracle = await Oracle.deploy();
  return oracle;
};

const deploySilicaMaster = async (deployer: Signer) => {
  const SilicaMasterContract = await ethers.getContractFactory(
    "Silica",
    deployer
  );
  const hashSandMasterContract = await SilicaMasterContract.deploy();
  return hashSandMasterContract;
};

const deploySilicaFactoryLib = async (deployer: Signer) => {
  const SilicaFactoryLib = await ethers.getContractFactory(
    "SilicaFactoryLib",
    deployer
  );
  const hashSandFactoryLib = await SilicaFactoryLib.deploy();
  await hashSandFactoryLib.deployed();
  return hashSandFactoryLib;
};

const deploySilicaAccountMasterNative = async (
  deployer: Signer,
  hashSandMasterContractAddress: string,
  oracleAddress: string
) => {
  const silicaAccountMasterNative: ContractFactory =
    await ethers.getContractFactory("SilicaAccount", {
      signer: deployer,
      libraries: {
        // SilicaFactoryLib: hashSandFactoryLibAddress,
        // LiquidationEngine: liquidationEngineLibAddress
      },
    });
  const silicaAccountNativeContract: Contract = await silicaAccountMasterNative.deploy(
    hashSandMasterContractAddress,
    oracleAddress
  );
  return silicaAccountNativeContract;
};

const deploySilicaAccountMasterERC20 = async (
  deployer: Signer,
  hashSandMasterContractAddress: string,
  oracleAddress: string
) => {
  const silicaAccountMasterERC20: ContractFactory = await ethers.getContractFactory(
    "SilicaAccount",
    deployer
  );
  const silicaAccountERC20Contract: Contract = await silicaAccountMasterERC20.deploy(
    hashSandMasterContractAddress,
    oracleAddress
  );
  return silicaAccountERC20Contract;
};

const deploySilicaAccountFactory = async (
  deployer: Signer,
  masterErc20Address: string
) => {
  const silicaAccountFactory: ContractFactory = await ethers.getContractFactory(
    "SilicaAccountFactory",
    deployer
  );
  const silicaAccountFactoryContract: Contract = await silicaAccountFactory.deploy(
    masterErc20Address
  );
  return silicaAccountFactoryContract;
};

const deployLiquidationEngine = async (deployer: Signer) => {
  const LiquidationEngine: ContractFactory = await ethers.getContractFactory(
    "LiquidationEngine",
    deployer
  );
  const liquidationEngine: Contract = await LiquidationEngine.deploy();
  return liquidationEngine;
};

export {
  setupTesterToken,
  deployOracle,
  deploySilicaMaster,
  deploySilicaFactoryLib,
  deploySilicaAccountMasterNative,
  deploySilicaAccountMasterERC20,
  deploySilicaAccountFactory,
  deployLiquidationEngine,
  deployOracleAddr,
};
