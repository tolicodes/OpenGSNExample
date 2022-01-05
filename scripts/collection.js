const { get: getPaymaster } = require("./paymaster");
const deploy = async (
  hre,
  {
    collectionName,
    collectionSymbol,
    collectionSupplyCap,
    contractMetadataUri,
    //Optional args
    metadataProofHash = "",
    paymaster,
    forwarderAddress,
  }
) => {
  if (!hre) throw new Error("hre is required");
  if (!collectionSymbol) throw new Error("collectionSymbol is required");
  if (!collectionSupplyCap) throw new Error("collectionSupplyCap is required");
  if (!contractMetadataUri) throw new Error("contractMetadataUri is required");
  if (!paymaster) paymaster = await getPaymaster(hre);
  if (!forwarderAddress)
    forwarderAddress = hre.network.config.GSN_TRUSTED_FORWARDER_ADDRESS;
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
  return novelCollection;
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
  .setAction(
    async (
      {
        symbol: collectionSymbol,
        supplycap: collectionSupplyCap,
        name: collectionName,
        uri: contractMetadataUri,
      },
      hre
    ) => {
      if (!collectionSymbol) throw new Error("symbol is required");
      if (!collectionSupplyCap || isNaN(parseInt(collectionSupplyCap)))
        throw new Error("supplycap is required");
      if (!collectionName) throw new Error("name is required");
      if (!contractMetadataUri) throw new Error("uri is required");
      await deploy(hre, {
        collectionName,
        collectionSymbol,
        collectionSupplyCap: parseInt(collectionSupplyCap),
        contractMetadataUri,
      });
    }
  );
module.exports = { deploy };
