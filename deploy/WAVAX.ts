module.exports = async ({
    getNamedAccounts,
    deployments,
  }: {
    getNamedAccounts: () => any;
    deployments: any;
  }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
  
    const WAVAX = await deploy("WAVAX", {
      from: deployer,
      // gas: 4000000,
    });
    console.log("WAVAX address: ", WAVAX.address);
  };
  
  module.exports.tags = ['WrappedAVAX']