const hre = require("hardhat");
const { deployPaymaster } = require('./deployPaymaster');
const { getPaymasterDetails, savePaymasterDetails } = require('../helpers/tempStorage');
const { RELAY_HUB_ADDRESS } = require("../config");

async function main({
  collectionName,
  collectionSymbol,
  collectionSupplyCap,
  contractMetadataUri,
  metadataProofHash = '',
}) {
  let paymasterDetails = getPaymasterDetails();

  console.log('paymaster', paymasterDetails)

  // we want to crash in production, paymaster must be deployed
  // already
  if (!paymasterDetails) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Paymaster not found');
    } else {
      // locally we will deploy a paymaster if it doesn't exist 
      // and save config
      paymasterDetails = await deployPaymaster();
      savePaymasterDetails(paymasterDetails);
      console.error('Should not happen unless we delete paymaster.json locally')
    }
  }

  const {
    forwarderAddress,
    paymasterContractAddress
  } = paymasterDetails;

  const NovelPaymaster = await hre.ethers.getContractFactory("NovelPaymaster2");

  const novelPaymaster = NovelPaymaster.attach(paymasterContractAddress)

  // The NovelCollection contract constructor
  const NovelCollection = await hre.ethers.getContractFactory("NovelCollection");

  // console.log('novelcollection deploy params', {
  //   collectionName,
  //   collectionSymbol,
  //   collectionSupplyCap,
  //   metadataProofHash,
  //   contractMetadataUri,
  //   forwarderAddress,
  //   paymasterContractAddress,
  // })

  const novelCollection = await NovelCollection.deploy(
    collectionName,
    collectionSymbol,
    collectionSupplyCap,
    metadataProofHash,
    contractMetadataUri,
    forwarderAddress,
  );

  // wait for the collection to be deployed
  await novelCollection.deployed();

  // local result (transaction started)
  const enableContractTxn = await novelPaymaster.enableContract(novelCollection.address);
 
  // waiting for the xtn to complete
  await enableContractTxn.wait();

  console.log(`Contract Deployed at: ${novelCollection.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main({
  collectionName: 'Not Toli Collection 2',
  collectionSymbol: 'TOLI2',
  collectionSupplyCap: 1000,
  contractMetadataUri: "https://ennf00de38owpbo.m.pipedream.net",
})
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
