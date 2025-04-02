// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ModelMarketplace = await ethers.getContractFactory("ModelMarketplace");
  const modelMarketplace = await ModelMarketplace.deploy();

  console.log(`model contract deployed to: ${await modelMarketplace.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });