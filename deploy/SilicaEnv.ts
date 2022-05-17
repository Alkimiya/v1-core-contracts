module.exports = async ({
  getNamedAccounts,
  deployments,
}: {
  getNamedAccounts: () => any;
  deployments: any;
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const silicaMaster = await deploy("Silica", {
    from: deployer,
    // gas: 4000000,
  });
  console.log("Silica Master address: ", silicaMaster.address);

  const oracle = await deploy("Oracle", {
    from: deployer,
    args: ["ETH"],
    // gas: 4000000,
  });
  console.log("OracleETH address: ", oracle.address);
  
  const oracleRegistry = await deploy("OracleRegistry", {
    from: deployer,
    // gas: 4000000,
  });
  console.log("oracleRegistryAddress: ", oracleRegistry.address);

  const oracleWBTC = await deploy("Oracle", {
    from: deployer,
    args: ["WBTC"],
    // gas: 4000000,
  });
  console.log("OracleWBTC address: ", oracleWBTC.address);

  const silicaAccountERC20Master = await deploy("SilicaAccount", {
    from: deployer,
    args: [silicaMaster.address, oracleRegistry.address],
    //   libraries: {
    //     LiquidationEngine: liquidationEngine.address,
    //   },
    gas: 4000000,
  });
  console.log("SilicaAccount Master address: ", silicaAccountERC20Master.address);

  const silicaAccountFactory = await deploy("SilicaAccountFactory", {
    from: deployer,
    args: [silicaAccountERC20Master.address],
    // gas: 4000000,
  });
  console.log("SilicaAccount Factory address: ", silicaAccountFactory.address);
  const oracleFeeSwap = await deploy("Oracle", {
  from: deployer,
  args: ["FeeSwap"],
  // gas: 4000000,
});
console.log("OracleFeeSwap address: ", oracleFeeSwap.address);

  // deploy separate oracle and oracle registry for PoS oracles (may change)
  
  const oraclePosWAVAX = await deploy("OraclePoS", {
    from: deployer,
    args: ["WAVAX"],
  });
  console.log("OraclePoSWAVAX address: ", oraclePosWAVAX.address);

  const silicaAvaxMaster = await deploy("SilicaAvax", {
    from: deployer,
  });
  console.log("SilicaAvaxMaster address: ", silicaAvaxMaster.address);

  const silicaAccountAvaxMaster = await deploy("SilicaAccountAvax", {
    from: deployer,
    args: [silicaAvaxMaster.address, oracleRegistry.address]
  })
  console.log("SilicaAccountAvaxMaster address: ", silicaAccountAvaxMaster.address);

  const silicaAccountAvaxFactory = await deploy("SilicaAccountAvaxFactory", {
    from: deployer,
    args: [silicaAccountAvaxMaster.address]
  })
  console.log("SilicaAccountAvaxFactory address: ", silicaAccountAvaxFactory.address);

};

module.exports.tags = ['SilicaEnvEnv']