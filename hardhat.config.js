require("@nomiclabs/hardhat-waffle");

require('dotenv').config()

const { ETH_PRIVATE_KEY } = process.env;

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
  defaultNetwork: "mainnet",
  networks: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [ETH_PRIVATE_KEY]
    },
    mainnet: {
      url: 'https://polygon-rpc.com/',
      accounts: [ETH_PRIVATE_KEY],
      // how much you pay (in wei) per "compute unit"
      gasPrice: 20e9,
      // how much compute you need
      gas: 25e9,
    },
  },
  rpc: {
    txfeecap: 0
  },
  solidity: "0.8.0",
};
