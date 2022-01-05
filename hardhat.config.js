require("@nomiclabs/hardhat-waffle");

require("dotenv").config();
require("./scripts/paymaster");
require("./scripts/collection");
const { ETH_PRIVATE_KEY } = process.env;
// console.log(ETH_PRIVATE_KEY);
// process.exit();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "mumbai",
  networks: {
    hardhat: { chainId: 1337 },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [ETH_PRIVATE_KEY],
      gasPrice: 20e9,
      // how much compute you need
      gas: 10e6,

      RELAY_HUB_ADDRESS: "0x6646cD15d33cE3a6933e36de38990121e8ba2806",
      GSN_TRUSTED_FORWARDER_ADDRESS:
        "0x4d4581c01A457925410cd3877d17b2fd4553b2C5",
    },
    mainnet: {
      url: "https://polygon-rpc.com/",
      // accounts: [ETH_PRIVATE_KEY],
      // how much you pay (in wei) per "compute unit"
      gasPrice: 20e9,
      // how much compute you need
      gas: 25e9,

      RELAY_HUB_ADDRESS: "ABC0x6646cD15d33cE3a6933e36de38990121e8ba2806",
      GSN_TRUSTED_FORWARDER_ADDRESS:
        "1230x4d4581c01A457925410cd3877d17b2fd4553b2C5",
    },
  },
  rpc: {
    txfeecap: 0,
  },
  solidity: "0.8.0",
};
