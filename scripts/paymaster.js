// More info on GSN: https://docs.opengsn.org/#architecture
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const deploy = async (
  hre,
  { RELAY_HUB_ADDRESS, GSN_TRUSTED_FORWARDER_ADDRESS }
) => {
  if (!hre) throw new Error("hre is required");
  if (!RELAY_HUB_ADDRESS) throw new Error("Relay hub address is required");
  if (!GSN_TRUSTED_FORWARDER_ADDRESS)
    throw new Error("GSN trusted forwarder address is required");
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

  const tx = await paymaster.setTrustedForwarder(GSN_TRUSTED_FORWARDER_ADDRESS);
  await tx.wait();

  return {
    paymasterContractAddress: paymaster.address,
  };
};

const fill = async (hre, eth, address) => {
  const paymaster = await get(hre, address);
  console.log("sending to paymasterAddress", paymaster.address);
  // process.exit();
  const params = {
    to: paymaster.address,
    value: hre.ethers.utils.parseUnits(eth, "ether").toHexString(),
  };
  const txHash = await (await hre.ethers.getSigners())
    .pop()
    .sendTransaction(params);
  await txHash.wait();
  return true;
};
const getPath = () =>
  join(__dirname, "..", `paymaster.${hre.network.name}.json`);

const get = async (hre, address) => {
  if (!address) {
    const path = getPath();
    if (!existsSync(path))
      throw new Error(
        "Could not find paymaster.json - try running hardhat deploy-paymaster"
      );
    const json = readFileSync(path, "utf8");
    const obj = JSON.parse(json);
    if (!obj.paymasterContractAddress)
      throw new Error(
        "Could not read paymaster.json - try running hardhat deploy-paymaster"
      );
    address = obj.paymasterContractAddress;
  }
  if (!address) throw new Error("Paymaster address is required");
  const Paymaster = await hre.ethers.getContractFactory("NovelPaymaster");
  const paymaster = await Paymaster.attach(address);
  return paymaster;
};

task("deploy-paymaster", "Deploys the paymaster", async (taskArgs, hre) => {
  const output = await deploy(hre, {
    RELAY_HUB_ADDRESS: hre.network.config.RELAY_HUB_ADDRESS,
    GSN_TRUSTED_FORWARDER_ADDRESS:
      hre.network.config.GSN_TRUSTED_FORWARDER_ADDRESS,
  });
  const path = getPath();
  writeFileSync(path, JSON.stringify(output, null, 2));
  console.log("Paymaster deployed at", output.paymasterContractAddress);
});

task("fill-paymaster", "Adds native token to paymaster")
  .addParam(
    "eth",
    "quantity in eth to add to the paymaster account - fractions allowed"
  )
  .setAction(async ({ eth }, hre) => {
    if (isNaN(parseFloat(eth))) throw new Error("eth must be a number");
    if (parseFloat(eth) < 0.01) throw new Error("Minimum amount is 0.01 ETH");
    const output = await fill(hre, eth);
    console.log("Paymaster refilled");
  });
module.exports = { deploy, fill, get };
