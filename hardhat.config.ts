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
const { ETH_PRIVATE_KEY } = process.env;
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
      gasPrice: 20e9,
      // how much compute you need
      gas: 10e6,
    },
    mainnet: {
      url: "https://polygon-mainnet.g.alchemy.com/v2/p6ch7y_To2B3GnKwrdxQXAwEX1GA4TmN",
      accounts: [ETH_PRIVATE_KEY],
      // how much you pay (in wei) per "compute unit"
      gasPrice: 100e9,
      // how much compute you need
      gas: 1e6,
    },
  },
  rpc: {
    txfeecap: 0,
  },
  solidity: "0.8.0",
  etherscan: {
    apiKey: {
      polygonMumbai: "GETYOUROWN",
      polygon: "GETYOUROWN",
    },
  },
  paymasterInfo: {
    polygonMumbai: {
      RELAY_HUB_ADDRESS: "0x6C28AfC105e65782D9Ea6F2cA68df84C9e7d750d",
      GSN_TRUSTED_FORWARDER_ADDRESS:
        "0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d",
    },
    polygon: {
      RELAY_HUB_ADDRESS: "0x6C28AfC105e65782D9Ea6F2cA68df84C9e7d750d",
      GSN_TRUSTED_FORWARDER_ADDRESS:
        "0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d",
    },
  },
} as PaymasterConfig;
