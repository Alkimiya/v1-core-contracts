module.exports = async ({
  getNamedAccounts,
  deployments,
}: {
  getNamedAccounts: () => any;
  deployments: any;
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(deployer);
  const dai = await deploy("DAI", {
    from: deployer,
    // gas: 4000000,
  });
  console.log("t.DAI address: ", dai.address);
};

module.exports.tags = ['Dai']
