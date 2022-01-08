import { get as getPaymaster } from "./paymaster";
import { readFileSync, writeFileSync } from "fs";
import { task } from "hardhat/config";
import { join } from "path";
import { HardhatConfig, HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";
import hardhatConfig from "../hardhat.config";
import { PaymasterConfig } from "./paymasterConfig";
type CollectionConstructorArguments = [
  collectionName: string,
  collectionSymbol: string,
  collectionSupplyCap: number,
  metadataProofHash: string,
  contractMetadataUri: string,
  forwarderAddress: string
];
const getPath = (
  hre: HardhatRuntimeEnvironment,
  collectionSymbol: string,
  address: string
) =>
  join(
    __dirname,
    "..",
    `collection.${collectionSymbol}.${address}.${hre.network.name}.json`
  );
export const deploy = async (
  hre: HardhatRuntimeEnvironment,
  {
    collectionName,
    collectionSymbol,
    collectionSupplyCap,
    contractMetadataUri,
    //Optional args
    metadataProofHash = "",
    paymaster,
    forwarderAddress,
  }: {
    collectionName: string;
    collectionSymbol: string;
    collectionSupplyCap: number;
    contractMetadataUri: string;
    //Optionalargs
    metadataProofHash?: string;
    paymaster?: Contract;
    forwarderAddress?: string;
  }
) => {
  if (!hre) throw new Error("hre is required");
  if (!collectionSymbol) throw new Error("collectionSymbol is required");
  if (!collectionSupplyCap) throw new Error("collectionSupplyCap is required");
  if (!contractMetadataUri) throw new Error("contractMetadataUri is required");
  if (!paymaster) paymaster = await getPaymaster(hre);
  if (!forwarderAddress)
    forwarderAddress = (hre.config as PaymasterConfig<HardhatConfig>)
      .paymasterInfo[hre.network.name].GSN_TRUSTED_FORWARDER_ADDRESS;
  // The NovelCollection contract constructor
  const NovelCollection = await hre.ethers.getContractFactory(
    "NovelCollection"
  );

  const novelCollection = await NovelCollection.deploy(
    collectionName,
    collectionSymbol,
    collectionSupplyCap,
    metadataProofHash,
    contractMetadataUri,
    forwarderAddress
  );

  // wait for the collection to be deployed
  await novelCollection.deployed();

  // local result (transaction started)
  console.log("paymaster contract", paymaster.address);
  const enableContractTxn = await paymaster.enableContract(
    novelCollection.address
  );

  // waiting for the xtn to complete
  await enableContractTxn.wait();

  console.log(`Contract Deployed at: ${novelCollection.address}`);

  const outputObj = {
    address: novelCollection.address,
    collectionName,
    collectionSymbol,
    collectionSupplyCap,
    metadataProofHash,
    contractMetadataUri,
    forwarderAddress,
    constructorArguments: [
      collectionName,
      collectionSymbol,
      collectionSupplyCap,
      metadataProofHash,
      contractMetadataUri,
      forwarderAddress,
    ] as CollectionConstructorArguments,
  };
  const path = getPath(hre, collectionSymbol, novelCollection.address);
  writeFileSync(path, JSON.stringify(outputObj, null, 2));
  return { path, novelCollection };
};
export const verify = async (
  hre: HardhatRuntimeEnvironment,
  address: string,
  [
    collectionName,
    collectionSymbol,
    collectionSupplyCap,
    metadataProofHash,
    contractMetadataUri,
    forwarderAddress,
  ]: CollectionConstructorArguments
) => {
  if (!hre) throw new Error("hre is required");
  if (!address) throw new Error("address is required");
  if (!collectionSymbol) throw new Error("collectionSymbol is required");
  if (!collectionSupplyCap) throw new Error("collectionSupplyCap is required");
  if (!contractMetadataUri) throw new Error("contractMetadataUri is required");
  if (!forwarderAddress) throw new Error("forwarderAddress is required");
  if (!collectionName) throw new Error("collectionName is required");
  if (!metadataProofHash) throw new Error("metadataProofHash is required");
  await hre.run("verify:verify", {
    address,
    constructorArguments: [
      collectionName,
      collectionSymbol,
      collectionSupplyCap,
      metadataProofHash,
      contractMetadataUri,
      forwarderAddress,
    ],
  });
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
task("deploy-collection", "Deploys the collection")
  .addParam("symbol", "Symbol for the collection")
  .addOptionalParam("supplycap", "Supply of the token", "1000")
  .addParam("name", "Name of the collection")
  .addOptionalParam(
    "uri",
    "Metadata URI for the collection",
    "https://ennf00de38owpbo.m.pipedream.net"
  )
  .addOptionalParam("verify", "Verify the collection")
  .setAction(
    async (
      {
        symbol: collectionSymbol,
        supplycap: collectionSupplyCap,
        name: collectionName,
        uri: contractMetadataUri,
        verify: doVerify,
      },
      hre
    ) => {
      if (!collectionSymbol) throw new Error("symbol is required");
      if (!collectionSupplyCap || isNaN(parseInt(collectionSupplyCap)))
        throw new Error("supplycap is required");
      if (!collectionName) throw new Error("name is required");
      if (!contractMetadataUri) throw new Error("uri is required");
      const { path } = await deploy(hre, {
        collectionName,
        collectionSymbol,
        collectionSupplyCap: parseInt(collectionSupplyCap),
        contractMetadataUri,
      });
      if (doVerify) {
        const { address, constructorArguments } = JSON.parse(
          readFileSync(path, { encoding: "utf8" })
        );
        try {
          await verify(hre, address, constructorArguments);
        } catch (e) {
          console.warn(
            "Could not verify collection contract",
            (e as Error).message
          );
        }
      }
    }
  );
task("verify-collection", "Verifies the collection on the scanner")
  .addParam("path", "path to the JSON for this collection")
  .setAction(async ({ path }, hre) => {
    const { address, constructorArguments } = JSON.parse(
      readFileSync(path, { encoding: "utf8" })
    );
    await verify(hre, address, constructorArguments);
  });
