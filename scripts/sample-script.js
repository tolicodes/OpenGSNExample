// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Paymaster = await hre.ethers.getContractFactory("NovelPaymaster");
  const paymaster = await Paymaster.deploy("0x6646cD15d33cE3a6933e36de38990121e8ba2806");

  await paymaster.deployed();

  paymaster.setTrustedForwarder("0x4d4581c01A457925410cd3877d17b2fd4553b2C5")

  const NovelCollection = await hre.ethers.getContractFactory("NovelCollection");
  const novelCollection = await NovelCollection.deploy("MonkeyBoy", "MGNB", 1000, "https://ennf00de38owpbo.m.pipedream.net", "0x4d4581c01A457925410cd3877d17b2fd4553b2C5");

  await novelCollection.deployed();
  console.log("novelCollection deployed to:", novelCollection.address);

  paymaster.enableContract(novelCollection.address)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
