module.exports = async ({
  getNamedAccounts,
  deployments,
}: {
  getNamedAccounts: () => any;
  deployments: any;
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const wBTC = await deploy("WrappedBTC", {
    from: deployer,
    // gas: 4000000,
  });
  console.log("wBTC address: ", wBTC.address);
};

module.exports.tags = ['WrappedBTC']