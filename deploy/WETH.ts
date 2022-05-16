module.exports = async ({
  getNamedAccounts,
  deployments,
}: {
  getNamedAccounts: () => any;
  deployments: any;
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const wETH = await deploy("WrappedETH", {
    from: deployer,
    // gas: 4000000,
  });
  console.log("wETH address: ", wETH.address);
};

module.exports.tags = ['WrappedETH']