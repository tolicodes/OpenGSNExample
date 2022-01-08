// More info on GSN: https://docs.opengsn.org/#architecture
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { HardhatConfig, HardhatRuntimeEnvironment } from "hardhat/types";
import { task } from "hardhat/config";
import { PaymasterConfig } from "./paymasterConfig";

interface IDeployParams { 
  RELAY_HUB_ADDRESS: string; 
  GSN_TRUSTED_FORWARDER_ADDRESS: string 
};

type PaymasterConstructorArguments = [RELAY_HUB_ADDRESS: string, GSN_TRUSTED_FORWARDER_ADDRESS: string];

// Deploys Paymaster
const deploy = async (
  // context that HardHat is giving us
  hre: HardhatRuntimeEnvironment,
  {
    RELAY_HUB_ADDRESS,
    GSN_TRUSTED_FORWARDER_ADDRESS,
  }: IDeployParams
) => {
  if (!hre) throw new Error("hre is required");
  if (!RELAY_HUB_ADDRESS) throw new Error("Relay hub address is required");
  if (!GSN_TRUSTED_FORWARDER_ADDRESS)
    throw new Error("GSN trusted forwarder address is required");
  
  // Paymaster funds transactions
  // ethers interacts with ethereum provider
  // hardhat makes web3 available without a browser
  // also has a local blockchain network to test w/o 
  // testnet
  const Paymaster = await hre.ethers.getContractFactory("NovelPaymaster");


  // Relay hub is starting the transaction (asks the NovelPaymaster if the payment should
  // go through (preRelayedCall), and then passes on the transaction to the forwarder
  // The NovelPaymaster holds and hands out the gas needed for the transactions
  const paymaster = await Paymaster.deploy(RELAY_HUB_ADDRESS, GSN_TRUSTED_FORWARDER_ADDRESS);

  // wait for it to be deployed
  await paymaster.deployed();

  return {
    address: paymaster.address,
    constructorArguments: [RELAY_HUB_ADDRESS, GSN_TRUSTED_FORWARDER_ADDRESS] as PaymasterConstructorArguments,
  };
};

// Refills paymaster gas
export const fill = async (
  hre: HardhatRuntimeEnvironment,
  // How much gas to put in
  ethToTransfer: string,
  // Address of the Paymaster
  // If not specified, fills Paymaster from config file
  optionalPaymasterAddress?: string
) => {
  // if there is no paymasterAddress as param, then asks HRE
  // for the address
  const paymaster = await get(hre, optionalPaymasterAddress);

  const amountToSendInWei = hre.ethers.utils.parseUnits(ethToTransfer, "ether")
  const amountToTransferAsHex = amountToSendInWei.toHexString();
  
  const paymasterAddress = paymaster.address;
  console.log("sending to paymasterAddress", {
    paymasterAddress,
    amountToSendInWei,
    amountToTransferAsHex,
  });
  
  // pulls from accounts (usually we have one, this just takes
  // the last one)
  const lastSigner = (await hre.ethers.getSigners()).pop();
  if (!lastSigner) throw new Error("no signers available");

  const transferMoneyTxnParams = {
    to: paymasterAddress,
    value: amountToTransferAsHex,
  };

  console.log('sending Transaction - transferMoney', {
    transferMoneyTxnParams,
  });

  const transferMoneyTxn = await lastSigner.sendTransaction(transferMoneyTxnParams);
  
  console.log('Waiting for transferMoneyTxn to complete')
  await transferMoneyTxn.wait();

  console.log('transferMoneyTxn was successful!')
  
  return true;
};

// get the path for paymaster details on local file system
// in prod, this will be in a DB or secrets manger (K8S)
const getPaymasterJSONPath = (hre: HardhatRuntimeEnvironment) =>
  join(__dirname, "..", `paymaster.${hre.network.name}.json`);


// Gets the paymaster ethers object from json file or passed in address
export const get = async (hre: HardhatRuntimeEnvironment, paymasterAddress?: string) => {
  if (!paymasterAddress) {
    // get the JSON file containing paymaster address
    const path = getPaymasterJSONPath(hre);

    if (!existsSync(path)) {
      throw new Error(
        "Could not find paymaster.json - try running hardhat deploy-paymaster"
      );
    }

    const json = readFileSync(path, "utf8");
    const paymasterData = JSON.parse(json);
    if (!paymasterData.address)
      throw new Error(
        "Could not read paymaster.json - try running hardhat deploy-paymaster"
      );
      paymasterAddress = paymasterData.address;
  }

  if (!paymasterAddress) throw new Error("Paymaster address is required");

  // get the paymaster contract ethers object
  const Paymaster = await hre.ethers.getContractFactory("NovelPaymaster");
  const paymaster = await Paymaster.attach(paymasterAddress);
  return paymaster;
};

// Verifies contract with PolygonScan (adds green checkmark)
export const verify = async (
  hre: HardhatRuntimeEnvironment,
  // the paymaster we want to verify on PolygonScan
  paymasterAddress: string,
  paymasterConstructorArguments: PaymasterConstructorArguments
) => {
  const [RELAY_HUB_ADDRESS, GSN_TRUSTED_FORWARDER_ADDRESS] = paymasterConstructorArguments;
  if (!RELAY_HUB_ADDRESS) throw new Error("Relay hub address is required");
  if(!GSN_TRUSTED_FORWARDER_ADDRESS) throw new Error("GSN trusted forwarder address is required");

  try {
    // subtask provided by etherscan (built in)
    const output = await hre.run("verify:verify", {
      address: paymasterAddress,
      constructorArguments: paymasterConstructorArguments,
    });
    console.log("Verification successful: ", output);
  } catch (e) {
    const message = (e as Error).message;
    
    // if already verified, that's fine, don't fail
    if (message.includes("Reason: Already Verified")) {
      console.log("Verification successful: Already verified");
    } else {
      throw e;
    }
  }
};

task("deploy-paymaster", "Deploys the paymaster")

  .addOptionalParam("verify", "Should we verify the contract after deploying? (boolean)")

  .setAction(async ({ verify: doVerify }, hre) => {
    const config = hre.config as PaymasterConfig<HardhatConfig>;
    
    // run the deploy
    const deployOutput = await deploy(hre, {
      RELAY_HUB_ADDRESS:
        config.paymasterInfo[hre.network.name].RELAY_HUB_ADDRESS,
      GSN_TRUSTED_FORWARDER_ADDRESS:
        config.paymasterInfo[hre.network.name].GSN_TRUSTED_FORWARDER_ADDRESS,
    });

    const path = getPaymasterJSONPath(hre);
    
    // if the deploy is successful, we write the output to a file, 
    // so that we don't deploy multiple paymasters
    // in production, this will be stored in a DB or secrets manager
    writeFileSync(path, JSON.stringify(deployOutput, null, 2));

    console.log("Paymaster deployed at", deployOutput.address);
    
    // if we specify that we want to verify on Polygon scan,
    // then do verification
    if (doVerify) {
      try {
        await verify(hre, deployOutput.address, deployOutput.constructorArguments);
      } catch (e) {
        console.warn("Could not verify paymaster", (e as Error).message);
      }
    }
  });

task("fill-paymaster", "Adds native token to paymaster")
  .addParam(
    "ethToTransfer",
    "quantity in eth to add to the paymaster account - fractions allowed"
  )
  .setAction(async ({ ethToTransfer }, hre: HardhatRuntimeEnvironment) => {
    if (isNaN(parseFloat(ethToTransfer))) throw new Error("eth must be a number");
    
    // $.02-ish at current pricing (minimum to run account)
    if (parseFloat(ethToTransfer) < 0.01) throw new Error("Minimum amount is 0.01 ETH");
    
    await fill(hre, ethToTransfer);
    console.log("Paymaster refilled");
  });

task("check-paymaster", "Check that a contract is whitelisted on the paymaster")
  .addParam("collectionContractAddress", "address of the contract")
  .setAction(async ({ address }, hre: HardhatRuntimeEnvironment) => {
    const paymaster = await get(hre);
    const isWhitelisted = await paymaster.isEnabledContract(address);
    console.log("isWhitelisted", isWhitelisted);
  });

task(
  "verify-paymaster",
  "Verify that a contract is whitelisted on the paymaster"
)
  .addOptionalParam("path", "paymaster contract JSON path")
  .setAction(async ({ path }, hre) => {
    if (!path) {
      path = getPaymasterJSONPath(hre);
    }
    else if (!path.startsWith("/")) {
      path = join(process.cwd(), path);
    }

    const { address, constructorArguments } = require(path);
    await verify(hre, address, constructorArguments);
  });
