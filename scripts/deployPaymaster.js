const {
    RELAY_HUB_ADDRESS,
    GSN_TRUSTED_FORWARDER_ADDRESS
} = require('../config');

// More info on GSN: https://docs.opengsn.org/#architecture
module.exports.deployPaymaster = async () => {

  // Paymaster funds transactions
  const Paymaster = await hre.ethers.getContractFactory("NovelPaymaster");

  // Relay hub is starting the transaction (asks the NovelContract if the payment should
  // go through, and then passes on the transaction to the forwarder
  // The paymaster holds and hands out the gas needed for the transactions
  const paymaster = await Paymaster.deploy(RELAY_HUB_ADDRESS);

  // wait for it to be deployed
  await paymaster.deployed();

  // the forwarder is the address of the contract that talks to the NovelCollection contract
  // it makes the gas payment for the user
  // collects money from the paymaster
  const setTrustedForwarderTxn = await paymaster.setTrustedForwarder(GSN_TRUSTED_FORWARDER_ADDRESS);
  await setTrustedForwarderTxn.wait();

  console.log('paymaster created', paymaster);

  return {
    paymasterContractAddress: paymaster.address,
    forwarderAddress: GSN_TRUSTED_FORWARDER_ADDRESS
  };
}