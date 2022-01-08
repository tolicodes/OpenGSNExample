import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";

import { config } from "dotenv";

import "./scripts/paymaster";
import "./scripts/collection";

import { task, HardhatUserConfig } from "hardhat/config";
import { PaymasterConfig } from "./scripts/paymasterConfig";

//#region set up environment variables
config();
const { 
  ETH_PRIVATE_KEY,
  RPC_MAINNET_URL,
  ETHERSCAN_API_KEY
} = process.env;

//#endregion

//#region accounts task
task("accounts", "Prints the list of accounts", async (_, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
//#endregion

export default {
  defaultNetwork: "polygonMumbai",
  networks: {
    hardhat: { chainId: 1337 },
    polygonMumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [ETH_PRIVATE_KEY],

      // how much you pay (in wei) per "compute unit"
      // 20 gigawei
      gasPrice: 20e9,
      // how much compute you need
      // 10 million
      gas: 10e6,
    },

    mainnet: {
      // change this to use your alchemy key in .env
      url: RPC_MAINNET_URL,

      // change this to use your MetaMask PK
      accounts: [ETH_PRIVATE_KEY],

      // how much you pay (in wei) per "compute unit"
      // 100 gigawei
      gasPrice: 100e9,
      // how much compute you need
      // 1 million
      gas: 1e6,
    },
  },

  rpc: {
    // no limit for deploying
    // money is no object
    txfeecap: 0,
  },

  solidity: "0.8.0",
  
  // support for verifying my contract
  etherscan: {
    apiKey: {
      // get from https://polygonscan.com/myapikey
      polygonMumbai: ETHERSCAN_API_KEY,
      polygon: ETHERSCAN_API_KEY,
    },
  },

  // paymaster for GSN
  paymasterInfo: {
    polygon: {
      // https://docs.opengsn.org/#architecture
      // Customer wallet contract the relay hub to execute the mint 
      RELAY_HUB_ADDRESS: "0x6C28AfC105e65782D9Ea6F2cA68df84C9e7d750d",

      // Contacts the Paymaster contract to pay for the mint
      GSN_TRUSTED_FORWARDER_ADDRESS:
        "0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d",
    },

    polygonMumbai: {
      RELAY_HUB_ADDRESS: "0x6C28AfC105e65782D9Ea6F2cA68df84C9e7d750d",
      GSN_TRUSTED_FORWARDER_ADDRESS:
        "0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d",
    },
  },
} as PaymasterConfig;
