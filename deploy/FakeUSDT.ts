module.exports = async ({
  getNamedAccounts,
  deployments,
}: {
  getNamedAccounts: () => any;
  deployments: any;
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const fUSDT = await deploy("USDT", {
    from: deployer,
    // gas: 4000000,
  });
  console.log("USDT address: ", fUSDT.address);
};

module.exports.tags = ['USDT']