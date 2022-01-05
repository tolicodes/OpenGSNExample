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
  defaultNetwork: "mumbai",
  networks: {
    mumbai: {
      url: "https://matic-testnet-archive-rpc.bwarelabs.com",
      accounts: [ETH_PRIVATE_KEY],
      // gasPrice: 20e9,
      // // how much compute you need
      // gas: 25e6,
    },
    mainnet: {
      url: 'https://polygon-rpc.com/',
      accounts: [ETH_PRIVATE_KEY],
      // how much you pay (in wei) per "compute unit"
      gasPrice: 20e9,
      // // how much compute you need
      gas: 25e6,
    },
  },
  gasReporter: {
    // enabled: process.env.ETH_REPORT_GAS !== undefined,
    currency: "USD",
    token: "MATIC",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPriceApi:
        "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
},
  rpc: {
    txfeecap: 0
  },
  solidity: "0.8.0",
};
